#include "ptx_yk1_xiaomi.h"
#include "esphome/core/log.h"

#ifdef USE_ESP32

#include <mbedtls/ccm.h>
#include <cstring>

namespace esphome {
namespace ptx_yk1_xiaomi {

static const char *const TAG = "ptx_yk1_xiaomi";

void PTXYK1XiaomiDevice::set_bindkey(const char *bindkey) {
  for (size_t i = 0; i < 16; i++) {
    char byte_str[3] = {bindkey[i * 2], bindkey[i * 2 + 1], '\0'};
    this->bindkey_[i] = (uint8_t) strtoul(byte_str, nullptr, 16);
  }
}

void PTXYK1XiaomiDevice::dump_config() {
  ESP_LOGCONFIG(TAG, "PTX YK1 Xiaomi BLE Button:");
  ESP_LOGCONFIG(TAG, "  MAC: %02X:%02X:%02X:%02X:%02X:%02X",
                (uint8_t)(this->address_ >> 40), (uint8_t)(this->address_ >> 32),
                (uint8_t)(this->address_ >> 24), (uint8_t)(this->address_ >> 16),
                (uint8_t)(this->address_ >> 8), (uint8_t)(this->address_));
  ESP_LOGCONFIG(TAG, "  Bindkey: [set]");
}

bool PTXYK1XiaomiDevice::parse_device(const esp32_ble_tracker::ESPBTDevice &device) {
  if (device.address_uint64() != this->address_) {
    return false;
  }

  for (const auto &sd : device.get_service_datas()) {
    // Check for MiBeacon UUID 0xFE95
    if (sd.uuid != esp32_ble_tracker::ESPBTUUID::from_uint16(0xFE95)) {
      continue;
    }

    const auto &raw = sd.data;
    if (raw.size() < 5) {
      ESP_LOGD(TAG, "Service data too short: %d bytes", raw.size());
      continue;
    }

    // Parse frame control (2 bytes, LE)
    uint16_t frame_ctrl = raw[0] | (raw[1] << 8);
    bool is_encrypted = (frame_ctrl >> 3) & 1;
    bool mac_included = (frame_ctrl >> 4) & 1;
    bool cap_included = (frame_ctrl >> 5) & 1;
    bool has_object = (frame_ctrl >> 6) & 1;
    uint8_t version = frame_ctrl >> 12;

    // Parse product ID (2 bytes, LE)
    uint16_t product_id = raw[2] | (raw[3] << 8);

    // Frame counter for deduplication
    uint8_t frame_count = raw[4];

    ESP_LOGD(TAG, "MiBeacon V%d, PID: 0x%04X, Frame: %d, Enc: %s, Obj: %s",
             version, product_id, frame_count,
             is_encrypted ? "Y" : "N", has_object ? "Y" : "N");

    // Deduplicate by frame counter
    if (this->has_last_frame_count_ && frame_count == this->last_frame_count_) {
      ESP_LOGVV(TAG, "Duplicate frame %d", frame_count);
      return true;
    }
    this->last_frame_count_ = frame_count;
    this->has_last_frame_count_ = true;

    if (!has_object) {
      ESP_LOGVV(TAG, "No object data");
      continue;
    }

    // Calculate offset to object/encrypted data
    int offset = 5;  // frame_ctrl(2) + product_id(2) + frame_cnt(1)
    if (mac_included) offset += 6;
    if (cap_included) offset += 1;

    if (!is_encrypted) {
      // Unencrypted data — directly parse object
      if ((int) raw.size() < offset + 3) {
        ESP_LOGW(TAG, "Payload too short for unencrypted object");
        continue;
      }
      this->process_button_event_(raw.data() + offset, raw.size() - offset);
      return true;
    }

    // Encrypted data — need at least offset + 1 byte ciphertext + 4 bytes MIC
    if ((int) raw.size() < offset + 5) {
      ESP_LOGW(TAG, "Payload too short for encrypted data");
      continue;
    }

    std::vector<uint8_t> plaintext;
    if (!this->decrypt_mibeacon_v5_(raw.data(), raw.size(), offset, plaintext)) {
      continue;
    }

    this->process_button_event_(plaintext.data(), plaintext.size());
    return true;
  }

  return false;
}

bool PTXYK1XiaomiDevice::try_decrypt_(const uint8_t *ciphertext, size_t ct_len,
                                       const uint8_t *nonce, size_t nonce_len,
                                       const uint8_t *aad, size_t aad_len,
                                       const uint8_t *mic, size_t mic_len,
                                       std::vector<uint8_t> &plaintext) {
  plaintext.resize(ct_len);

  mbedtls_ccm_context ctx;
  mbedtls_ccm_init(&ctx);

  int ret = mbedtls_ccm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES,
                                this->bindkey_, 128);
  if (ret != 0) {
    ESP_LOGE(TAG, "mbedtls_ccm_setkey failed: -0x%04X", -ret);
    mbedtls_ccm_free(&ctx);
    return false;
  }

  ret = mbedtls_ccm_auth_decrypt(&ctx, ct_len,
                                  nonce, nonce_len,
                                  aad, aad_len,
                                  ciphertext, plaintext.data(),
                                  mic, mic_len);
  mbedtls_ccm_free(&ctx);

  return ret == 0;
}

bool PTXYK1XiaomiDevice::decrypt_mibeacon_v5_(const uint8_t *data, size_t size,
                                               int raw_offset,
                                               std::vector<uint8_t> &plaintext) {
  // Build MAC in little-endian (reversed) order for nonce, matching
  // the Python xiaomi-ble library: xiaomi_mac[::-1]
  uint8_t mac_le[6];
  mac_le[0] = this->address_ & 0xFF;
  mac_le[1] = (this->address_ >> 8) & 0xFF;
  mac_le[2] = (this->address_ >> 16) & 0xFF;
  mac_le[3] = (this->address_ >> 24) & 0xFF;
  mac_le[4] = (this->address_ >> 32) & 0xFF;
  mac_le[5] = (this->address_ >> 40) & 0xFF;

  uint8_t aad = 0x11;

  // Log raw encrypted data for debugging
  ESP_LOGV(TAG, "Encrypted data (%d bytes, offset=%d):", size, raw_offset);
  char hex_buf[96];
  int hpos = 0;
  for (size_t i = 0; i < size && hpos < (int) sizeof(hex_buf) - 4; i++) {
    hpos += snprintf(hex_buf + hpos, sizeof(hex_buf) - hpos, "%02x ", data[i]);
  }
  ESP_LOGV(TAG, "  %s", hex_buf);

  // ================================================================
  // Approach 1: Standard MiBeacon V4/V5
  //   Nonce (12 bytes): MAC_LE(6) + product_id(2) + frame_cnt(1) + ext_cnt(3)
  //   Ciphertext: data[offset .. size-7)
  //   Ext counter: data[size-7 .. size-4)   (used in nonce)
  //   MIC:         data[size-4 .. size)
  // ================================================================
  if ((int) size >= raw_offset + 7) {
    size_t ct_len = size - 7 - raw_offset;

    if (ct_len > 0 && ct_len < 64) {
      uint8_t nonce[12];
      memcpy(nonce, mac_le, 6);
      nonce[6] = data[2];          // product_id low byte
      nonce[7] = data[3];          // product_id high byte
      nonce[8] = data[4];          // frame counter
      nonce[9] = data[size - 7];   // ext_cnt[0]
      nonce[10] = data[size - 6];  // ext_cnt[1]
      nonce[11] = data[size - 5];  // ext_cnt[2]

      const uint8_t *ct = data + raw_offset;
      const uint8_t *mic = data + size - 4;

      ESP_LOGV(TAG, "Try 12-byte nonce (ct=%d bytes)", ct_len);

      if (this->try_decrypt_(ct, ct_len, nonce, 12, &aad, 1, mic, 4, plaintext)) {
        ESP_LOGD(TAG, "Decrypted OK (12-byte nonce), %d bytes", plaintext.size());
        return true;
      }
      ESP_LOGV(TAG, "12-byte nonce failed");
    }
  }

  // ================================================================
  // Approach 2: No ext_cnt separation (shorter nonce)
  //   Nonce (9 bytes): MAC_LE(6) + product_id(2) + frame_cnt(1)
  //   Ciphertext: data[offset .. size-4)
  //   MIC:        data[size-4 .. size)
  // This treats the "ext_cnt" bytes as part of the ciphertext.
  // ================================================================
  if ((int) size >= raw_offset + 5) {
    size_t ct_len = size - 4 - raw_offset;

    if (ct_len > 0 && ct_len < 64) {
      uint8_t nonce[9];
      memcpy(nonce, mac_le, 6);
      nonce[6] = data[2];
      nonce[7] = data[3];
      nonce[8] = data[4];

      const uint8_t *ct = data + raw_offset;
      const uint8_t *mic = data + size - 4;

      ESP_LOGV(TAG, "Try 9-byte nonce (ct=%d bytes)", ct_len);

      if (this->try_decrypt_(ct, ct_len, nonce, 9, &aad, 1, mic, 4, plaintext)) {
        ESP_LOGD(TAG, "Decrypted OK (9-byte nonce), %d bytes", plaintext.size());
        return true;
      }
      ESP_LOGV(TAG, "9-byte nonce failed");
    }
  }

  // ================================================================
  // Approach 3: 12-byte nonce with zero ext_cnt, full ciphertext
  //   Nonce (12 bytes): MAC_LE(6) + product_id(2) + frame_cnt(1) + 0x000000
  //   Ciphertext: data[offset .. size-4)
  //   MIC:        data[size-4 .. size)
  // ================================================================
  if ((int) size >= raw_offset + 5) {
    size_t ct_len = size - 4 - raw_offset;

    if (ct_len > 0 && ct_len < 64) {
      uint8_t nonce[12];
      memcpy(nonce, mac_le, 6);
      nonce[6] = data[2];
      nonce[7] = data[3];
      nonce[8] = data[4];
      nonce[9] = 0x00;
      nonce[10] = 0x00;
      nonce[11] = 0x00;

      const uint8_t *ct = data + raw_offset;
      const uint8_t *mic = data + size - 4;

      ESP_LOGV(TAG, "Try 12-byte nonce (zero ext_cnt, ct=%d bytes)", ct_len);

      if (this->try_decrypt_(ct, ct_len, nonce, 12, &aad, 1, mic, 4, plaintext)) {
        ESP_LOGD(TAG, "Decrypted OK (12-byte nonce, zero ext_cnt), %d bytes", plaintext.size());
        return true;
      }
      ESP_LOGV(TAG, "12-byte nonce (zero ext_cnt) failed");
    }
  }

  ESP_LOGW(TAG, "All decryption approaches failed — check bindkey");
  return false;
}

void PTXYK1XiaomiDevice::process_button_event_(const uint8_t *data, size_t size) {
  // Log raw decrypted event data for debugging
  char hex[128];
  int pos = 0;
  for (size_t i = 0; i < size && pos < (int) sizeof(hex) - 4; i++) {
    pos += snprintf(hex + pos, sizeof(hex) - pos, "%02x ", data[i]);
  }
  ESP_LOGD(TAG, "Decrypted event payload (%d bytes): %s", size, hex);

  size_t offset = 0;
  bool event_fired = false;

  // Standard MiBeacon TLV parser: [type_lo, type_hi, length, data...]
  while (offset + 3 <= size) {
    uint16_t obj_id = data[offset] | (data[offset + 1] << 8);
    uint8_t obj_len = data[offset + 2];
    size_t next_offset = offset + 3 + obj_len;

    if (next_offset > size) {
      ESP_LOGW(TAG, "Object 0x%04X length %d exceeds payload size %d", obj_id, obj_len, size);
      break;
    }

    const uint8_t *obj_data = data + offset + 3;
    ESP_LOGD(TAG, "Parsing object 0x%04X (len=%d)", obj_id, obj_len);

    switch (obj_id) {
      // Single press objects (0x4A0C: PTX YK1 / XMWS01XS, 0x4E0C: XMWXKG01YL, 0x560C: KS1/KS2)
      case 0x4A0C:
      case 0x4E0C:
      case 0x560C:
      case 0x480C:
        ESP_LOGI(TAG, "Press (object 0x%04X)", obj_id);
        this->press_callback_.call();
        event_fired = true;
        break;

      // Double press objects
      case 0x4A0D:
      case 0x4E0D:
      case 0x560D:
      case 0x480D:
        ESP_LOGI(TAG, "Double press (object 0x%04X)", obj_id);
        this->double_press_callback_.call();
        event_fired = true;
        break;

      // Long press objects
      case 0x4A0E:
      case 0x4E0E:
      case 0x560E:
      case 0x480E:
        ESP_LOGI(TAG, "Long press (object 0x%04X)", obj_id);
        this->long_press_callback_.call();
        event_fired = true;
        break;

      // Generic 3-byte button event object (0x1001)
      case 0x1001:
        if (obj_len >= 3) {
          uint8_t button_type = obj_data[0];
          uint8_t value = obj_data[1];
          uint8_t press_type = obj_data[2];
          ESP_LOGD(TAG, "0x1001 event: button=%d, value=%d, press_type=%d", button_type, value, press_type);
          switch (press_type) {
            case 0:
              ESP_LOGI(TAG, "Press (0x1001)");
              this->press_callback_.call();
              event_fired = true;
              break;
            case 1:
              ESP_LOGI(TAG, "Double press (0x1001)");
              this->double_press_callback_.call();
              event_fired = true;
              break;
            case 2:
              ESP_LOGI(TAG, "Long press (0x1001)");
              this->long_press_callback_.call();
              event_fired = true;
              break;
            default:
              ESP_LOGW(TAG, "Unknown 0x1001 press_type: %d", press_type);
              break;
          }
        }
        break;

      default:
        ESP_LOGD(TAG, "Ignored object 0x%04X (len=%d)", obj_id, obj_len);
        break;
    }

    offset = next_offset;
  }

  if (!event_fired) {
    ESP_LOGW(TAG, "No known button event recognized in payload");
  }
}

}  // namespace ptx_yk1_xiaomi
}  // namespace esphome

#endif
