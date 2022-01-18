let target_num = 0
HaodaAI.Begin(haodaai_mode_e.kI2CMode, haodaai_addr_e.ADDR1)
HaodaAI.VisionSetStatus(HaodaAIStatus.Enable, haodaai_vision_e.kVisionCard)
HaodaAI.LedSetColor(haodaai_led_color_e.kLedBlue, haodaai_led_color_e.kLedGreen)
basic.forever(function () {
    target_num = HaodaAI.Detected(haodaai_vision_e.kVisionCard)
    serial.writeValue("target_num", target_num)
    for (let index = 0; index <= target_num - 1; index++) {
        serial.writeValue("index", index)
        serial.writeValue("x", HaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_gen_info_e.kXValue, index))
        serial.writeValue("y", HaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_gen_info_e.kYValue, index))
        serial.writeValue("w", HaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_gen_info_e.kWidthValue, index))
        serial.writeValue("h", HaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_gen_info_e.kWidthValue, index))
        serial.writeValue("l", HaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_gen_info_e.kLabel, index))
    }
    basic.pause(2000)
})
