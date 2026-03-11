;

export enum IframeLevelReportEnum
{
    lv_show = "lv_show",
    lv_win = "lv_win",
    lv_lose = "lv_lose",
}

export class iframeSDK
{
    static _initFlag = false
    static VideoCallBack: any;
    static IntersCallBack: any;
    // static ShowNativeIconCall:any;
    static getOPPOShowMoreGameCallBack: any;
    static ShowNativeImageCallBack: any



    static postList: string[] = []
    static hallConfig: any = { offVoice: false, isAndorid: true };

    //初始化
    static init()
    {
              var e;
              this._initFlag ||
                ((this._initFlag = !0),
                //@ts-ignore
                null === (e = window.cymcc) ||
                  void 0 === e ||
                  e.webInit(this.getOrientation()),
                console.log("iframeSDK init"));
                return

        if (this._initFlag) return
        this._initFlag = true;

        console.log('iframeSDK init')


    }

    static getOrientation()
    {
        let orientation = cc.view.getDesignResolutionSize().width > cc.view.getDesignResolutionSize().height ? 'landscape' : 'portrait'
        return orientation
    }


    static noVideoTip()
    {


    }


    /**
     * 视频广告
     * @param callback
     * @param type
     */
    static showVideo(callback: (isSuccess: boolean) => void, scene: any)
    {
 
            var e;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e ||e.showVideo(callback)
 
    };

    static console(msg: string)
    {
        //EngineUtils.ShowText(msg)
    }

    static actionReport(data: Object | string)
    {


    }

    /**
     * 关卡行为上报
     * @param level
     * @param action show|end_win|end_lose|...
     */
    static levelReport(level: any, action: IframeLevelReportEnum)
    {

    }





    static interTime: number = 0

    /**
     * 插屏
     */
    static showInters(callback: Function, scene: any)
    {
            var e;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e ||e.showInters(callback)
            return
    }

    /**
   * 横幅banner
   * @param isShow
   */
    static showBanner(isShow: boolean)
    {
 
            var e;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e ||e.showBanner(isShow)
            return
        

    };


    /**
     * 震动
     * @param type short|long
     */
    static phoneVibrate(type: string | number)
    {
            var e;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e || e.phoneVibrate(type)  

    }

    /// 国内接口 ////////////////////////////////////////////////////////////////////////
    static showNativeIcon(x: number, y: number)
    {
        return

    }

    static hideNativeIcon()
    {
        return

    }

    static getOPPOShowMoreGameFlag(call: (flag: boolean) => void)
    {
        return 

    }

    static showOPPOMoreGame()
    {
 
            var e;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e || e.showOPPOMoreGame()


    }
    static getChannelId(){
            var e,num;
            //@ts-ignore
            null === (e = window.cymcc) || void 0 === e || (num =e.getChannelId())
            return num

    }
    static showNativeImage(callback: (showFlag: boolean) => void)
    {

    }

    static hideNativeImage()
    {

    }

}
//window['iframeSDK'] = iframeSDK