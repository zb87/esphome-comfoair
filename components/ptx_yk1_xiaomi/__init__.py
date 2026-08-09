import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import esp32_ble_tracker
from esphome.const import CONF_ID, CONF_MAC_ADDRESS, CONF_TRIGGER_ID
from esphome import automation

CODEOWNERS = ["@zb87"]
DEPENDENCIES = ["esp32_ble_tracker"]
MULTI_CONF = True

CONF_BINDKEY = "bindkey"
CONF_ON_PRESS = "on_press"
CONF_ON_DOUBLE_PRESS = "on_double_press"
CONF_ON_LONG_PRESS = "on_long_press"

ptx_yk1_xiaomi_ns = cg.esphome_ns.namespace("ptx_yk1_xiaomi")
PTXYK1XiaomiDevice = ptx_yk1_xiaomi_ns.class_(
    "PTXYK1XiaomiDevice",
    cg.Component,
    esp32_ble_tracker.ESPBTDeviceListener,
)

PressTrigger = ptx_yk1_xiaomi_ns.class_(
    "PressTrigger", automation.Trigger.template()
)
DoublePressTrigger = ptx_yk1_xiaomi_ns.class_(
    "DoublePressTrigger", automation.Trigger.template()
)
LongPressTrigger = ptx_yk1_xiaomi_ns.class_(
    "LongPressTrigger", automation.Trigger.template()
)


def validate_bindkey(value):
    value = cv.string_strict(value)
    if len(value) != 32:
        raise cv.Invalid("Bindkey must be exactly 32 hex characters (16 bytes)")
    try:
        bytes.fromhex(value)
    except ValueError as err:
        raise cv.Invalid("Bindkey must be a valid hex string") from err
    return value


CONFIG_SCHEMA = (
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(PTXYK1XiaomiDevice),
            cv.Required(CONF_MAC_ADDRESS): cv.mac_address,
            cv.Required(CONF_BINDKEY): validate_bindkey,
            cv.Optional(CONF_ON_PRESS): automation.validate_automation(
                {
                    cv.GenerateID(CONF_TRIGGER_ID): cv.declare_id(PressTrigger),
                }
            ),
            cv.Optional(CONF_ON_DOUBLE_PRESS): automation.validate_automation(
                {
                    cv.GenerateID(CONF_TRIGGER_ID): cv.declare_id(
                        DoublePressTrigger
                    ),
                }
            ),
            cv.Optional(CONF_ON_LONG_PRESS): automation.validate_automation(
                {
                    cv.GenerateID(CONF_TRIGGER_ID): cv.declare_id(
                        LongPressTrigger
                    ),
                }
            ),
        }
    )
    .extend(esp32_ble_tracker.ESP_BLE_DEVICE_SCHEMA)
    .extend(cv.COMPONENT_SCHEMA)
)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    await esp32_ble_tracker.register_ble_device(var, config)

    cg.add(var.set_address(config[CONF_MAC_ADDRESS].as_hex))
    cg.add(var.set_bindkey(config[CONF_BINDKEY]))

    for conf in config.get(CONF_ON_PRESS, []):
        trigger = cg.new_Pvariable(conf[CONF_TRIGGER_ID], var)
        await automation.build_automation(trigger, [], conf)

    for conf in config.get(CONF_ON_DOUBLE_PRESS, []):
        trigger = cg.new_Pvariable(conf[CONF_TRIGGER_ID], var)
        await automation.build_automation(trigger, [], conf)

    for conf in config.get(CONF_ON_LONG_PRESS, []):
        trigger = cg.new_Pvariable(conf[CONF_TRIGGER_ID], var)
        await automation.build_automation(trigger, [], conf)
