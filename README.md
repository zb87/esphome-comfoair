# ESPHome ComfoAir Ventilation Controller

ESPHome configuration for Zehnder ComfoAir 180 / 200 series ventilation units powered by an ESP32-S3 board.

## Features

- **Zehnder ComfoAir Integration**: Full monitoring and control over fan speeds, bypass valves, temperatures (outside, supply, return, exhaust), and operating hours.
- **Pass-through Proxy**: Supports dual UART to allow an original external remote controller to operate concurrently with ESPHome.
- **Wi-Fi & Home Assistant**: Built-in Home Assistant Native API discovery, Improv Serial, and Web Server UI on port 80.
- **Visual Status LED**: Single WS2812 RGB LED providing clear visual feedback for system state, network status, filter warnings, and fan adjustments.
- **Multifunction Boot Button**: Manual fan speed cycling and hardware factory reset.

---

## 1. How to Compile and Flash

### Prerequisites
- Docker installed (recommended), or ESPHome installed locally.
- An ESP32-S3 board (default target: `esp32-s3-n16r8`).

### Helper Script
The repository includes a helper script `esphome_docker.sh` that runs ESPHome inside Docker without requiring a local Python/ESPHome installation.

### Commands

1. **Validate Configuration**:
   ```bash
   ./esphome_docker.sh config comfoair.yaml
   ```

2. **First-Time Compile & Install (Web Flashing)**:
   - Compile the firmware binary:
     ```bash
     ./esphome_docker.sh compile comfoair.yaml
     ```
   - The compiled factory firmware file is located at:
     `.esphome/build/comfoair/.pioenvs/comfoair/firmware.factory.bin`
   - Press and hold the **BOOT** button on the ESP32-S3 board, connect the board to your computer via USB, and then release the **BOOT** button.
   - Open [web.esphome.io](https://web.esphome.io/) in your web browser and flash `firmware.factory.bin` to the ESP32-S3 board.

3. **Follow-up Development / OTA Flow**:
   - Find the IP address of the device on your local network.
   - Flash updates directly over Wi-Fi:
     ```bash
     ./esphome_docker.sh run comfoair.yaml --device=<ip_address>
     ```

---

## 2. First-Run Experience

When you power on the board for the first time (or after a factory reset):

1. **Access Point (AP) & Setup Mode**:
   - The board will automatically launch a Wi-Fi Access Point named `comfoair` (or prompt via Improv Serial / Bluetooth).
   - The status LED will **fast-pulse YELLOW** to indicate setup mode is active.

2. **Wi-Fi Configuration**:
   - Connect your phone or computer to the `comfoair` Wi-Fi access point.
   - A Captive Portal page will open automatically (if not, navigate to `http://192.168.4.1` in your browser).
   - Select your local Wi-Fi network, enter your password, and click **Save**.

3. **Connection Status Confirmation**:
   - Once successfully connected to your Wi-Fi network, the status LED will turn **solid GREEN for 10 seconds**.
   - After 10 seconds, the LED automatically turns **OFF** for normal silent operation.

4. **Home Assistant & Web Server Setup**:
   - **Home Assistant**: The device will automatically be discovered via the ESPHome integration. Click **Configure** in Home Assistant to add it.
   - **Custom UI Card**: You can install the dedicated ComfoAir Lovelace card in Home Assistant from [lovelace-comfoair](https://github.com/zb87/lovelace-comfoair).
   - **Web Interface**: Access the local web dashboard at `http://comfoair.local` or via the device's IP address.

---

## 3. LED Signals & Button Controls

### RGB Status LED Signals (WS2812 on GPIO2)

The RGB status LED provides real-time visual feedback:

| Signal / Effect | Color | Meaning / State |
| :--- | :--- | :--- |
| **Fast Pulse** (250ms) | 🔴 Red | **Wi-Fi Disconnected** (AP inactive, searching for network) |
| **Fast Pulse** (250ms) | 🟡 Yellow | **Access Point Active** (Captive Portal / Setup Mode ready) |
| **Solid On** (10s) | 🟢 Green | **Wi-Fi Connected** (Displays for 10s upon successful connection) |
| **Off** | ⚪ None | **Normal Status** (Wi-Fi connected & filter status healthy) |
| **Solid On** | 🟣 Purple | **Filter Replacement Required** (Filter status marked as Full) |
| **Fast Pulse** | 🔵 Blue | **Fan Level Change** (Pulses 1x for Low, 2x for Medium, 3x for High) |
| **Solid On** (5s) | 🔴 Red | **Factory Reset Warning** (Triggers before factory reset executes) |

---

### Boot Button Functions (GPIO0)

The physical Boot button on GPIO0 provides manual control:

- **Short Press** (50ms – 1.5s):
  - Cycles ventilation fan mode: **Low ➔ Medium ➔ High ➔ Low**.
  - Triggers a **BLUE fast pulse** LED animation matching the selected level (1 pulse = Low, 2 pulses = Medium, 3 pulses = High).
- **Long Press** (5s – 15s):
  - Initiates a **Factory Reset**.
  - Displays a solid **RED** LED for 3 seconds as a warning before erasing stored Wi-Fi credentials and resetting device configuration.

---

## Credits

The code is based on the following GitHub projects:
- https://github.com/wichers/esphome-comfoair
- https://github.com/julianpas/esphome-comfoair

