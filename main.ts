//% color="#ff6600" weight=20 icon="\uf030"
namespace HaodaAI {
    // haodaai_reg
    const kRegDeviceId = 0x01
    const kRegRestart = 0x03
    const kRegSensorConfig1 = 0x04
    const kRegLock = 0x05
    const kRegLed = 0x06
    const kRegLedLevel = 0x08
    const kRegLcdCongig = 0x0C
    const kRegHWConfig = 0x0F
    const kRegCameraConfig1 = 0x10
    const kRegFrameCount = 0x1F
    const kRegVisionId = 0x20
    const kRegVisionConfig1 = 0x21
    const kRegParamNum = 0x23
    const kRegParamId = 0x24
    const kReghaodaai_object_tNumber = 0x34
    const kReghaodaai_object_tId = 0x35

    const HAODAAI_DEVICE_ID = 0x04

    const HAODAAI_MAX_RESULT = 5

    const HAODAAI_OK = 0x00
    const HAODAAI_FAIL = 0x01
    const HAODAAI_UNKNOWN_PROTOCOL = 0x11

    class haodaai_object_t {
        data1: number
        data2: number
        data3: number
        data4: number
        data5: number
        bytestr: string
    }

    let _vision_states: haodaai_vision_state_t[] = [null, null, null, null, null, null, null, null, null, null, null, null];

    export class haodaai_vision_state_t {
        frame: number
        detect: number
        haodaai_objects: haodaai_object_t[]

        constructor() {
            this.haodaai_objects = [];
            for (let i = 0; i < HAODAAI_MAX_RESULT; i++) {
                this.haodaai_objects[i] = new haodaai_object_t();
            }
        }
    }

    class HaodaAII2CMethod {

        address: number

        private i2cwrite(reg: number, value: number) {
            let buf = pins.createBuffer(2);
            buf[0] = reg;
            buf[1] = value;

            let ret = pins.i2cWriteBuffer(this.address, buf);

            //console.log("i2cwrite " + this._addr.toString() + " reg:" + reg.toString() + "\t" + value.toString() + "\n")

            return ret;
        }

        private i2cread(reg: number) {
            pins.i2cWriteNumber(this.address, reg, NumberFormat.UInt8BE, true);
            let value = pins.i2cReadNumber(this.address, NumberFormat.UInt8BE);

            //console.log("i2cread " + this._addr.toString() + " reg:" + reg.toString() + "\t" + value.toString() + "\n")

            return value;
        }

        private Get_u16(reg: number): number {
            return this.Get(reg) << 8 | this.Get(reg+1)
        }

        Set(reg_address: number, value: number): number {
            this.i2cwrite(reg_address, value);
            return HAODAAI_OK;
        }

        Get(reg_address: number): number {
            let value = this.i2cread(reg_address);

            return value;
        }

        Read(vision_type: haodaai_vision_e): number {
            let err = HAODAAI_OK;

            err = this.Set(kRegVisionId, vision_type);

            if (err) return err;

            _vision_states[vision_type-1].frame = this.Get(kRegFrameCount)
            _vision_states[vision_type-1].detect = this.Get(kReghaodaai_object_tNumber)

            if (_vision_states[vision_type-1].detect <= 0) {
                return HAODAAI_OK
            }

            if (HAODAAI_MAX_RESULT < _vision_states[vision_type-1].detect) {
                _vision_states[vision_type-1].detect = HAODAAI_MAX_RESULT;
            }

            if (haodaai_vision_e.kVisionQrCode == vision_type) {
                _vision_states[vision_type-1].detect = 1;
            }

            for (let i = 0; i < _vision_states[vision_type-1].detect; i++) {
                err = this.Set(kReghaodaai_object_tId, i + 1);
                if (err) return err;

                _vision_states[vision_type-1].haodaai_objects[i].data1 = this.Get_u16(0x80)
                _vision_states[vision_type-1].haodaai_objects[i].data2 = this.Get_u16(0x82)
                _vision_states[vision_type-1].haodaai_objects[i].data3 = this.Get_u16(0x84)
                _vision_states[vision_type-1].haodaai_objects[i].data4 = this.Get_u16(0x86)
                _vision_states[vision_type-1].haodaai_objects[i].data5 = this.Get_u16(0x88)

                if (haodaai_vision_e.kVisionQrCode == vision_type) {
                    let bytec = 0;
                    let haodaai_object_t_id = 0;
                    let offset = 0;
                    let bytestr: string = "";

                    for (let i = 0; i < _vision_states[vision_type-1].haodaai_objects[0].data5; i++) {
                        haodaai_object_t_id = (i / 5 + 2) | 0;
                        offset = i % 5;
                        if (0 == i % 5) {
                            err = this.Set(kReghaodaai_object_tId, haodaai_object_t_id)
                            if (err) return err;
                        }

                        bytec = this.Get(0x81 + 2 * offset)

                        bytestr += String.fromCharCode(bytec)
                    }

                    _vision_states[vision_type-1].haodaai_objects[0].bytestr = bytestr;
                }
            }

            return HAODAAI_OK
        }

        SetParam(vision_id: number, param: haodaai_object_t, param_id: number): number {
            let err = HAODAAI_OK
            err = this.Set(kRegVisionId, vision_id)
            if (err) return err;

            err = this.Set(kRegParamId, param_id + 1)
            if (err) return err;

            this.Set(0x70, (param.data1 >> 8) & 0xFF)
            this.Set(0x71, param.data1 & 0xFF)
            this.Set(0x72, (param.data2 >> 8) & 0xFF)
            this.Set(0x73, param.data2 & 0xFF)
            this.Set(0x74, (param.data3 >> 8) & 0xFF)
            this.Set(0x75, param.data3 & 0xFF)
            this.Set(0x76, (param.data4 >> 8) & 0xFF)
            this.Set(0x77, param.data4 & 0xFF)
            this.Set(0x78, (param.data5 >> 8) & 0xFF)
            this.Set(0x79, param.data5 & 0xFF)

            return HAODAAI_OK;
        }
    }


    class HaodaAIMethod {
        _address: number;
        _stream: HaodaAII2CMethod;
        _mode: haodaai_mode_e;

        img_w: number;
        img_h: number;
        constructor(addr: number) {
            this._address = addr
            this._mode = haodaai_mode_e.kUnknownMode;
        }

        Begin(mode: haodaai_mode_e): number {
            if (mode == haodaai_mode_e.kUnknownMode) {
                mode = haodaai_mode_e.kI2CMode;
            }

            if (this._mode != mode) {
                this._mode = mode;
                if (mode == haodaai_mode_e.kI2CMode) {
                    this._stream = new HaodaAII2CMethod();
                    this._stream.address = this._address
                }
            }

            if (this.SensorInit()) {
                return HAODAAI_FAIL;
            }

            return HAODAAI_OK;
        }

        SensorInit() {
            let err = HAODAAI_OK;

            /* Check sensor startup*/
            err = this.SensorStartupCheck();
            if (err) return err;
            /* Check haodaai protocol version */
            err = this.ProtocolVersionCheck();
            if (err) return err;
            /* Sensor set default if version is correction. */
            err = this.SensorSetDefault();
            if (err) return err;
            /* Get sensor image shape. */
            err = this.GetImageShape();
            if (err) return err;

            return HAODAAI_OK;
        }

        SensorStartupCheck() {
            let err_count = 0;
            let start_up = 0;
            while (true) {
                if (++err_count > 100) return HAODAAI_FAIL;  // set max retry times

                start_up = this._stream.Get(kRegSensorConfig1);
                if (start_up & 0x01) break;

                basic.pause(200);
            }

            return HAODAAI_OK;
        }

        ProtocolVersionCheck() {
            let err = HAODAAI_OK;
            let err_count = 0;
            let device_id = 0;
            while (true) {
                if (++err_count > 3) return HAODAAI_UNKNOWN_PROTOCOL;
                device_id = this._stream.Get(kRegDeviceId);

                if (device_id == HAODAAI_DEVICE_ID) break;
            }
            return err;
        }

        SensorSetDefault() {
            let sensor_config_reg_value = this._stream.Get(kRegSensorConfig1);
            sensor_config_reg_value |= 0x08;
            let err = this._stream.Set(kRegSensorConfig1, sensor_config_reg_value);
            while (true) {
                sensor_config_reg_value = this._stream.Get(kRegSensorConfig1);
                if (err) return err;

                if (!(sensor_config_reg_value & 0x08)) break;
            }
            return err;
        }

        SeneorSetCoordinateType(coordinate: haodaai_coordinate_type_e){
            let err, hw_config_reg_value = this._stream.Get(kRegHWConfig)

            if(((hw_config_reg_value & 0x0c) >> 2) != coordinate){
                hw_config_reg_value &= 0xF3
                hw_config_reg_value != (coordinate & 0x03) << 2
                err = this._stream.Set(kRegHWConfig,hw_config_reg_value)
            }
            return err;
        }


        SensorSetRestart() {
            return this._stream.Set(kRegRestart, 1);
        }

        GetImageShape() {
            this.img_w = this._stream.Get(0x1B) << 8 | this._stream.Get(0x1C);
            this.img_h = this._stream.Get(0x1D) << 8 | this._stream.Get(0x1E);
            return HAODAAI_OK
        }

        VisionSetStatus(vision_type: haodaai_vision_e, enable: HaodaAIStatus) {
            let err = HAODAAI_OK;
            let vision_config1 = 0;

            err = this._stream.Set(kRegVisionId, vision_type);
            if (err) return err;

            vision_config1 = this._stream.Get(kRegVisionConfig1);

            let status = vision_config1 & 0x01
            if (status != enable) {
                vision_config1 &= 0xfe
                vision_config1 |= enable & 0x01;
            }

            err = this._stream.Set(kRegVisionConfig1, vision_config1);
            if (err) return err;

            if (enable && _vision_states[vision_type - 1] == null) {
                _vision_states[vision_type - 1] = new haodaai_vision_state_t();
            }

            return HAODAAI_OK;
        }

        VisionGetStatus(vision_type: haodaai_vision_e) {
            let err = HAODAAI_OK;
            let vision_config1 = 0;

            err = this._stream.Set(kRegVisionId, vision_type);
            if (err) return err;

            vision_config1 = this._stream.Get(kRegVisionConfig1);

            return 0x01 & vision_config1
        }

        GetValue(vision_type: haodaai_vision_e, obj_info: haodaai_obj_info_e, obj_id: number = 0) {

            if (obj_info == haodaai_obj_info_e.kStatus) {
                while (this.UpdateResult(vision_type));
            }

            return this.read(vision_type, obj_info, obj_id)
        }

        GetQrCodeValue(): string {

            if (_vision_states[haodaai_vision_e.kVisionQrCode - 1] == null) return "";

            return _vision_states[haodaai_vision_e.kVisionQrCode - 1].haodaai_objects[0].bytestr;
        }

        SetParamNum(vision_type: haodaai_vision_e, max_num: number) {
            let err = HAODAAI_OK;

            err = this._stream.Set(kRegVisionId, vision_type);
            if (err) return err;

            err = this._stream.Set(kRegParamNum, max_num);

            return err;
        }

        SetParam(vision_type: haodaai_vision_e, param: haodaai_object_t, param_id: number = 0) {
            return this._stream.SetParam(vision_type, param, param_id)
        }

        _SensorLockkReg(lock: HaodaAIStatus) {
            let err = HAODAAI_OK;
            let status = 0;

            for (; ;) {
                status = this._stream.Get(kRegLock);
                if (status == lock) {
                    return HAODAAI_OK;
                }
                err = this._stream.Set(kRegLock, lock);
                if (err) return err;
            }
        }

        UpdateResult(vision_type: haodaai_vision_e) {
            if (vision_type >= haodaai_vision_e.kVisionMaxType)
                return 0;

            let frame = this._stream.Get(kRegFrameCount);

            while (HAODAAI_OK != this._SensorLockkReg(HaodaAIStatus.Disable));

            if (frame == _vision_states[vision_type-1].frame)  return HAODAAI_FAIL;

            while (HAODAAI_OK != this._SensorLockkReg(HaodaAIStatus.Enable));

            let err = this._stream.Read(vision_type);

            while (HAODAAI_OK != this._SensorLockkReg(HaodaAIStatus.Disable));

            return err;
        }

        private read(vision_type: haodaai_vision_e, obj_info: haodaai_obj_info_e, obj_id: number = 0) {

            if (obj_id >= HAODAAI_MAX_RESULT) obj_id = HAODAAI_MAX_RESULT - 1;

            if (null == _vision_states[vision_type - 1] || (vision_type - 1) >= haodaai_vision_e.kVisionMaxType)
                return 0;

            switch (obj_info) {
                case haodaai_obj_info_e.kStatus:
                    return _vision_states[vision_type - 1].detect;
                case haodaai_obj_info_e.kXValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data1;
                case haodaai_obj_info_e.kYValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data2;
                case haodaai_obj_info_e.kWidthValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data3;
                case haodaai_obj_info_e.kHeightValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data4;
                case haodaai_obj_info_e.kLabel:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data5;
                case haodaai_obj_info_e.kRValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data1;
                case haodaai_obj_info_e.kGValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data2;
                case haodaai_obj_info_e.kBValue:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data3;
                case haodaai_obj_info_e.kX1Value:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data1;
                case haodaai_obj_info_e.kY1Value:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data2;
                case haodaai_obj_info_e.kX0Value:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data3;
                case haodaai_obj_info_e.kY0Value:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data4;
                case haodaai_obj_info_e.kAngle:
                    return _vision_states[vision_type - 1].haodaai_objects[obj_id].data5;
                default:
                    return 0;
            }
        }

        VisionSetDefault(vision_type: haodaai_vision_e) {
            return this._stream.Set(kRegVisionId, vision_type);
        }

        LedSetColor(detected_color: haodaai_led_color_e, undetected_color: haodaai_led_color_e, level: number = 1) {
            let led_reg_value = 0;

            led_reg_value = this._stream.Get(kRegLedLevel)
            led_reg_value = (led_reg_value & 0xF0) | (level & 0x0F);
            this._stream.Set(kRegLedLevel, led_reg_value)

            led_reg_value = this._stream.Get(kRegLed)

            if (detected_color != undetected_color) {
                led_reg_value &= 0xf0
            }
            else {
                led_reg_value &= 0xf0
                led_reg_value |= 0x1
            }

            led_reg_value |= (detected_color & 0x07) << 1
            led_reg_value &= 0x1f
            led_reg_value |= (undetected_color & 0x07) << 5

            return this._stream.Set(kRegLed, led_reg_value);
        }

        CameraSetZoom(zoom: haodaai_camera_zoom_e) {
            let camera_reg_value = this._stream.Get(kRegCameraConfig1);
            let gzoom = camera_reg_value & 0x07
            if (zoom != gzoom) {
                camera_reg_value &= 0xf8
                camera_reg_value |= zoom & 0x07
                return this._stream.Set(kRegCameraConfig1, camera_reg_value);
            }
            return HAODAAI_OK;
        }

        CameraSetFPS(fps: haodaai_camera_fps_e) {
            let camera_reg_value = this._stream.Get(kRegCameraConfig1);
            let gfps = (camera_reg_value >> 4) & 0x01
            if (fps != gfps) {
                camera_reg_value &= 0xef
                camera_reg_value |= (fps & 0x01) << 4
                return this._stream.Set(kRegCameraConfig1, camera_reg_value);
            }
            return HAODAAI_OK;
        }

        CameraSetAwb(awb: haodaai_camera_white_balance_e) {
            let camera_reg_value = this._stream.Get(kRegCameraConfig1);
            let white_balance = (camera_reg_value >> 5) & 0x03
            if (haodaai_camera_white_balance_e.kLockWhiteBalance == awb) {
                camera_reg_value &= 0x1f
                camera_reg_value |= (awb & 0x03) << 5
                let err = this._stream.Set(kRegCameraConfig1, camera_reg_value);
                if (err) return err;
                while ((camera_reg_value >> 7) == 0) {
                    camera_reg_value = this._stream.Get(kRegCameraConfig1);
                }
            }
            else if (white_balance != awb) {
                camera_reg_value &= 0x1f
                camera_reg_value |= (awb & 0x03) << 5
                return this._stream.Set(kRegCameraConfig1, camera_reg_value);
            }
            return HAODAAI_OK;
        }
    }

    let pHaodaAI: HaodaAIMethod = null;

    /**
     * Begin HaodaAI.
     */
    //% blockId=HaodaAI_begin block="initialize HaodaAI mode%mode |addr%addr"
    //% mode.defl=haodaai_mode_e.kI2CMode
    //% group="Settings"
    export function Begin(mode: haodaai_mode_e, addr: haodaai_addr_e) {
        if (pHaodaAI == null) {
            pHaodaAI = new HaodaAIMethod(addr)
            while (pHaodaAI.Begin(mode) != HAODAAI_OK);
        }
    }

    /**
     * Reset HaodaAI.
     */
    //% blockId=HaodaAI_set_default block="restore  HaodaAI  default settings "
    //% group="Settings"
    export function SetDefault() {
        while (pHaodaAI.SensorSetDefault() != HAODAAI_OK);
    }

    /**
   * Set coordinate type.
   */
    //% blockId=HaodaAI_set_coordinate_type block="set coordinate type %coordinate "
    //% group="Settings"
    export function SeneorSetCoordinateType(coordinate: haodaai_coordinate_type_e) {
        while (pHaodaAI.SeneorSetCoordinateType(coordinate) != HAODAAI_OK);
    }

    /**
     * HaodaAI vision enable set.
    */
    //% blockId=HaodaAI_vision_Set block="set  HaodaAI %enable|algorithm%vision_type "
    //% group="Settings"
    export function VisionSetStatus(status: HaodaAIStatus, vision_type: haodaai_vision_e) {
        while (pHaodaAI.VisionSetStatus(vision_type, status) != HAODAAI_OK);
    }

    /**
    * set vision prama number.
    * @param vision_type: vision type.
    * @param max_num max prama number.
    */
    //% blockId=HaodaAI_vision_SetParamNum block="set  HaodaAI algorithm %vision_type|max number %max_num "
    //% max_num.min=1 max_num.max=25 max_num.defl=1
    //% group="AlgorithmSettings" advanced=true
    export function SetParamNum(vision_type: haodaai_vision_e, max_num: number) {
        while (pHaodaAI.SetParamNum(vision_type, max_num) != HAODAAI_OK);
    }

    /**
    * set vision prama.
    * @param vision_type vision type.
    * @param vision prama.
    * @param param_id vision prama id.
    */
    //% blockId=HaodaAI_vision_SetParam block="set  HaodaAI algorithm %vision_type|param %param index %param_id"
    //% inlineInputMode=inline
    //% param_id.min=0 param_id.max=24 param_id.defl=0
    //% group="AlgorithmSettings" advanced=true
    export function SetParam(vision_type: haodaai_vision_e, param: haodaai_object_t, param_id: number = 0) {
        while (pHaodaAI.SetParam(vision_type, param, param_id) != HAODAAI_OK);
    }

    /**
    * color prama.
    * @param x ROI centre x.
    * @param y ROI centre y.
    * @param w ROI weight.
    * @param h ROI height.
    */
    //% blockId=HaodaAI_vision_color_param block="Color ROI centre x%x| y%y| weight%w| height%h "
    //% inlineInputMode=inline
    //% group="AlgorithmSettings" advanced=true
    export function ColorParam(x: number, y: number, w: number, h: number): haodaai_object_t {
        let prama = new haodaai_object_t();
        prama.data1 = x;
        prama.data2 = y;
        prama.data3 = w;
        prama.data4 = h;
        return prama;
    }

    /**
    * blod prama.
    * @param w detecte min weight.
    * @param h detecte min height.
    * @param l detecte lable.
    */
    //% blockId=HaodaAI_vision_bold_param block="Bold min weight%w| height%h| lable%l "
    //% inlineInputMode=inline
    //% group="AlgorithmSettings" advanced=true
    export function BoldParam(w: number, h: number, l: color_label_e): haodaai_object_t {
        let prama = new haodaai_object_t();
        prama.data3 = w;
        prama.data4 = h;
        prama.data5 = l;
        return prama;
    }

    /**
    * face prama.
    * @param l detected lable.
    */
    //% blockId=HaodaAI_vision_face_param block="Face lable%l "
    //% inlineInputMode=inline
    //% group="AlgorithmSettings" advanced=true
    export function FaceParam(l: number): haodaai_object_t {
        let prama = new haodaai_object_t();
        prama.data5 = l;
        return prama;
    }

    /**
    * set led color.
    * @param detected_color led color while sensor detected target.
    * @param undetected_color led color while sensor undetected target.
    * @param level led light level.
    */
    //% blockId=HaodaAI_led_set_color block="set  HaodaAI LED when detected %detected_color|when undetected %undetected_color||level %level "
    //% detected_color.defl=haodaai_led_color_e.kLedBlue
    //% undetected_color.defl=haodaai_led_color_e.kLedGreen
    //% level.min=0 level.max=15 level.defl=1
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% group="Settings" advanced=true
    export function LedSetColor(detected_color: haodaai_led_color_e, undetected_color: haodaai_led_color_e, level: number = 1) {
        while (pHaodaAI.LedSetColor(detected_color, undetected_color, level) != HAODAAI_OK);
    }

    /**
     * set camera zoom.
     * @param zoom zoom value.
     */
    //% blockId=HaodaAI_camera_set_zoom block="set  HaodaAI camera digital zoom%zoom " color="#1098C9"
    //% group="CameraSettings" advanced=true
    export function CameraSetZoom(zoom: haodaai_camera_zoom_e) {
        while (pHaodaAI.CameraSetZoom(zoom) != HAODAAI_OK);
    }

    /**
    * set camera white balance.
    * @param wb white balance type.
    */
    //% blockId=HaodaAI_camera_set_awb block="set  HaodaAI camera white balance%wb " color="#1098C9"
    //% group="CameraSettings" advanced=true
    export function CameraSetAwb(wb: haodaai_camera_white_balance_e) {
        while (pHaodaAI.CameraSetAwb(wb) != HAODAAI_OK);
    }

    /**
     * set camera FPS.
     * @param on FPS type.
     */
    //% blockId=HaodaAI_camera_set_fps block="set  HaodaAI camera high FPS mode$on " color="#1098C9"
    //% on.shadow="toggleOnOff" on.defl="true"
    //% group="CameraSettings" advanced=true
    export function CameraSetFPS(on: boolean) {
        let fps = on ? haodaai_camera_fps_e.kFPSHigh : haodaai_camera_fps_e.kFPSNormal;
        while (pHaodaAI.CameraSetFPS(fps) != HAODAAI_OK);
    }
    /**
     * Get vision detected number
     * @param type vision type
     */
    //% blockId=HaodaAI_detected block=" HaodaAI  algorithm %vision_type detected number " color="#2E8B57"
    //% group="Functions"
    export function Detected(vision_type: haodaai_vision_e): number {
        return pHaodaAI.GetValue(vision_type, haodaai_obj_info_e.kStatus)
    }

    /**
    * get vision haodaai_object_t data, this function will update vision haodaai_object_t automatically.
    * @param vision_type: vision type.
    * @param object_inf:  object information
    * @param obj_id:  object index
    */
    //% blockId=HaodaAI_get_value block=" HaodaAI  algorithm%vision_type| Recognition%object_inf|| index %obj_id " color="#2E8B57"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function GetValue(vision_type: haodaai_vision_e, object_info: haodaai_gen_info_e, obj_id: number = 0): number {
        return <number>pHaodaAI.GetValue(<number>vision_type, <number>object_info, obj_id);
    }

    /**
     * Get the result of vision color recognition.
     * @param obj_info Paramters type
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_get_color_value block=" HaodaAI  algorithm Color| Recognition%obj_info|| index %obj_id " color="#2E8B57"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function ColorRcgValue(obj_info: haodaai_color_info_e, obj_id: number = 0): number {
        return pHaodaAI.GetValue(haodaai_vision_e.kVisionColor, <number>obj_info, obj_id)
    }

    /**
     * Get the result of vision Line value.
     * @param obj_info Paramters type
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_get_Line_value block=" HaodaAI  algorithm Line| %obj_info|| index %obj_id " color="#2E8B57"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function LineValue(obj_info: haodaai_Line_info_e, obj_id: number = 0): number {
        return pHaodaAI.GetValue(haodaai_vision_e.kVisionLine, <number>obj_info, obj_id)
    }

    /**
     * Get the result of vision color recognition.
     * @param obj_info Paramters type
     */
    //% blockId=HaodaAI_get_qrRcg_value  block=" HaodaAI QrCode Recognition|%obj_info " color="#2E8B57"
    //% group="Functions"
    export function QrRcgValue(obj_info: haodaai_qr_info_e): number {
        return pHaodaAI.GetValue(haodaai_vision_e.kVisionQrCode, <number>obj_info, 0)
    }

    /**
     * Get the result of vision QrCode value
     */
    //% blockId=HaodaAI_get_qr_value block=" HaodaAI QrCode value " color="#2E8B57"
    //% group="Functions"
    export function GetQrCodeValue(): string {
        return pHaodaAI.GetQrCodeValue()
    }

    /**
     * Detected Color
     * @param lable Color lable
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_detected_color block=" HaodaAI  detected Color %lable detected || index %obj_id " color="#2E8B57"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function DetectedColor(lable: color_label_e, obj_id: number = 0): boolean {
        return (pHaodaAI.GetValue(haodaai_vision_e.kVisionColor, haodaai_obj_info_e.kLabel, obj_id) == lable)
    }

    /**
     * Detected Blob
     * @param lable Blob lable
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_detected_blob block=" HaodaAI  detected Blob %lable detected || index %obj_id " color="#2E8B57"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function DetectedBlob(lable: color_label_e, obj_id: number = 0): boolean {
        return (pHaodaAI.GetValue(haodaai_vision_e.kVisionBlob, haodaai_obj_info_e.kLabel, obj_id) == lable)
    }

    /**
     * Detected Card
     * @param lable Card lable
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_detected_card block=" HaodaAI  detected card %lable detected || index %obj_id " color="#2E8B57"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function DetectedCard(lable: card_label_e, obj_id: number = 0): boolean {
        return (pHaodaAI.GetValue(haodaai_vision_e.kVisionCard, haodaai_obj_info_e.kLabel, obj_id) == lable)
    }

    /**
     * Detected class20
     * @param lable 20Class lable
     * @param obj_id:  object index
     */
    //% blockId=HaodaAI_detected_class20 block=" HaodaAI  detected 20Class %lable detected || index %obj_id " color="#2E8B57"
    //% obj_id.min=0 obj_id.max=24 obj_id.defl=0
    //% group="Functions"
    export function Detected20Class(lable: class20_label_e, obj_id: number = 0): boolean {
        return (pHaodaAI.GetValue(haodaai_vision_e.kVision20Classes, haodaai_obj_info_e.kLabel, obj_id) == lable)
    }

    /**
     * image weight
     */
    //% blockId=HaodaAI_get_img_h block="HaodaAI image weight " color="#2E8B57"
    //% group="Functions"
    export function Rows() {
        return pHaodaAI.img_h;
    }

    /**
     * image height
     */
    //% blockId=HaodaAI_get_img_w block="HaodaAI image height " color="#2E8B57"
    //% group="Functions"
    export function Cols() {
        return pHaodaAI.img_w;
    }
}

