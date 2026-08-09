#pragma once

#include "esphome/core/component.h"
#include "esphome/core/automation.h"
#include "esphome/components/esp32_ble_tracker/esp32_ble_tracker.h"

#ifdef USE_ESP32

namespace esphome {
namespace ptx_yk1_xiaomi {

class PTXYK1XiaomiDevice : public Component,
                            public esp32_ble_tracker::ESPBTDeviceListener {
 public:
  void set_address(uint64_t address) { this->address_ = address; }
  void set_bindkey(const char *bindkey);

  bool parse_device(const esp32_ble_tracker::ESPBTDevice &device) override;
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::DATA; }

  void add_on_press_callback(std::function<void()> &&callback) {
    this->press_callback_.add(std::move(callback));
  }
  void add_on_double_press_callback(std::function<void()> &&callback) {
    this->double_press_callback_.add(std::move(callback));
  }
  void add_on_long_press_callback(std::function<void()> &&callback) {
    this->long_press_callback_.add(std::move(callback));
  }

 protected:
  bool decrypt_mibeacon_v5_(const uint8_t *data, size_t size, int raw_offset,
                             std::vector<uint8_t> &plaintext);
  bool try_decrypt_(const uint8_t *ciphertext, size_t ct_len,
                     const uint8_t *nonce, size_t nonce_len,
                     const uint8_t *aad, size_t aad_len,
                     const uint8_t *mic, size_t mic_len,
                     std::vector<uint8_t> &plaintext);
  void process_button_event_(const uint8_t *data, size_t size);

  uint64_t address_{0};
  uint8_t bindkey_[16]{};
  uint8_t last_frame_count_{0};
  bool has_last_frame_count_{false};

  CallbackManager<void()> press_callback_;
  CallbackManager<void()> double_press_callback_;
  CallbackManager<void()> long_press_callback_;
};

class PressTrigger : public Trigger<> {
 public:
  explicit PressTrigger(PTXYK1XiaomiDevice *parent) {
    parent->add_on_press_callback([this]() { this->trigger(); });
  }
};

class DoublePressTrigger : public Trigger<> {
 public:
  explicit DoublePressTrigger(PTXYK1XiaomiDevice *parent) {
    parent->add_on_double_press_callback([this]() { this->trigger(); });
  }
};

class LongPressTrigger : public Trigger<> {
 public:
  explicit LongPressTrigger(PTXYK1XiaomiDevice *parent) {
    parent->add_on_long_press_callback([this]() { this->trigger(); });
  }
};

}  // namespace ptx_yk1_xiaomi
}  // namespace esphome

#endif
