
> 在 [https://haohaodada-official.github.io/pxt-HaodaAI/](https://haohaodada-official.github.io/pxt-HaodaAI/) 打开此页面

## 用作扩展

此仓库可以作为 **插件** 添加到 MakeCode 中。

* 打开 [https://makecode.microbit.org/](https://makecode.microbit.org/)
* 点击 **新项目**
* 点击齿轮图标菜单下的 **扩展**
* 搜索 **https://github.com/Haohaodada-official/pxt-HaodaAI** 并导入

## 编辑此项目 ![构建状态标志](https://github.com/Haohaodada-official/pxt-HaodaAI/workflows/MakeCode/badge.svg)

在 MakeCode 中编辑此仓库。

* 打开 [https://makecode.microbit.org/](https://makecode.microbit.org/)
* 点击 **导入**，然后点击 **导入 URL**
* 粘贴 **https://github.com/Haohaodada-official/pxt-HaodaAI** 并点击导入

## 使用方法

* Get Vision result

```blocks
// Initialized HaodaAI with I2C port
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
})
```

* Get Color result

```blocks
// Initialized HaodaAI with I2C port
let target_num = 0
HaodaAI.Begin(haodaai_mode_e.kI2CMode, haodaai_addr_e.ADDR1)
HaodaAI.VisionSetStatus(HaodaAIStatus.Enable, haodaai_vision_e.kVisionColor)
HaodaAI.LedSetColor(haodaai_led_color_e.kLedBlue, haodaai_led_color_e.kLedGreen)
HaodaAI.SetParamNum(haodaai_vision_e.kVisionColor, 3)
HaodaAI.SetParam(haodaai_vision_e.kVisionColor, HaodaAI.ColorParam(10, 10, 5, 5))
HaodaAI.SetParam(haodaai_vision_e.kVisionColor, HaodaAI.ColorParam(40, 40, 6, 6))
HaodaAI.SetParam(haodaai_vision_e.kVisionColor, HaodaAI.ColorParam(80, 80, 8, 8))
basic.showIcon(IconNames.Heart)
basic.forever(function () {
    target_num = HaodaAI.Detected(haodaai_vision_e.kVisionColor)
    serial.writeValue("target_num", target_num)
    for (let index = 0; index <= target_num - 1; index++) {
        serial.writeValue("index", index)
        serial.writeValue("R", HaodaAI.ColorRcgValue(haodaai_color_info_e.kRValue, index))
        serial.writeValue("G", HaodaAI.ColorRcgValue(haodaai_color_info_e.kGValue, index))
        serial.writeValue("B", HaodaAI.ColorRcgValue(haodaai_color_info_e.kBValue, index))
        serial.writeValue("L", HaodaAI.ColorRcgValue(haodaai_color_info_e.kLabel, index))
        if (HaodaAI.DetectedColor(color_label_e.kColorBlack)) {
            serial.writeLine("black")
        } else if (HaodaAI.DetectedColor(color_label_e.kColorWhite)) {
            serial.writeLine("white")
        } else if (HaodaAI.DetectedColor(color_label_e.kColorRed)) {
            serial.writeLine("red")
        } else if (HaodaAI.DetectedColor(color_label_e.kColorYellow)) {
            serial.writeLine("yellow")
        }
    }
})
```


* Get QrCode result

```blocks
// Initialized HaodaAI with I2C port
HaodaAI.Begin(haodaai_mode_e.kI2CMode, haodaai_addr_e.ADDR1)
HaodaAI.SetDefault()
HaodaAI.VisionSetStatus(HaodaAIStatus.Enable, haodaai_vision_e.kVisionQrCode)
HaodaAI.LedSetColor(haodaai_led_color_e.kLedGreen, haodaai_led_color_e.kLedPurple, 1)
basic.forever(function () {
    if (HaodaAI.Detected(haodaai_vision_e.kVisionQrCode) > 0) {
        serial.writeValue("x", HaodaAI.QrRcgValue(haodaai_qr_info_e.kXValue))
        serial.writeValue("y", HaodaAI.QrRcgValue(haodaai_qr_info_e.kYValue))
        serial.writeValue("w", HaodaAI.QrRcgValue(haodaai_qr_info_e.kWidthValue))
        serial.writeValue("h", HaodaAI.QrRcgValue(haodaai_qr_info_e.kHeightValue))
        serial.writeString("l=" + HaodaAI.GetQrCodeValue())
    }
})
```


#### 元数据（用于搜索、渲染）

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
