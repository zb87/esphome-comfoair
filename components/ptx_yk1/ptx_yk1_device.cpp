#include "ptx_yk1_device.h"
#include "esphome/core/log.h"

#ifdef USE_ESP32

namespace esphome {
namespace ptx_yk1 {

static const char *const TAG = "ptx_yk1";

void PTXYK1Device::dump_config() {
  LOG_BINARY_SENSOR("", "PTX YK1", this);
  ESP_LOGCONFIG(TAG, "  MAC Address: %02X:%02X:%02X:%02X:%02X:%02X",
                (uint8_t)(this->address_ >> 40), (uint8_t)(this->address_ >> 32),
                (uint8_t)(this->address_ >> 24), (uint8_t)(this->address_ >> 16),
                (uint8_t)(this->address_ >> 8), (uint8_t)(this->address_));
  ESP_LOGCONFIG(TAG, "  BLE Timeout: %" PRIu32 " ms", this->timeout_ms_);
}

void PTXYK1Device::loop() {
  uint32_t now = millis();
  if (this->need_timeout_ && (now - this->time_ > this->timeout_ms_)) {
    this->publish_state(false);
    this->need_timeout_ = false;
  }
}

bool PTXYK1Device::parse_device(const esp32_ble_tracker::ESPBTDevice &device) {
  if (device.address_uint64() != this->address_) {
    return false;
  }

  for (const auto &adv : device.get_manufacturer_datas()) {
    if (adv.uuid != esp32_ble_tracker::ESPBTUUID::from_uint16(0x5348) || adv.data.size() != 14) {
      continue;
    }

    uint32_t id = (uint32_t(adv.data[11]) << 16) | (uint32_t(adv.data[12]) << 8) | uint32_t(adv.data[13]);
    if (id == this->last_id_) {
      return true;
    }

    this->time_ = millis();
    if (this->state) {
      this->publish_state(false);
    }
    this->last_id_ = id;
    this->publish_state(true);
    this->need_timeout_ = true;
    return true;
  }
  return true;
}

}  // namespace ptx_yk1
}  // namespace esphome

#endif
