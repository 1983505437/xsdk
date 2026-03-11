import IXSdk from "../IXSdk";

let initSdkPhasesCallback: (phases: string, res: object) => void;
let intersCallback: (phases: string, res: object) => void;
let videoCallback: (phases: string, res: object) => void;
let payCallback: (phases: string, res: object) => void;
let redeemCallback: (res: object) => void;

const TAG = "XSDK-HarmonySdk";
export default class HarmonySdk implements IXSdk {

    /**
     * 单例对象
     */
    private static instance: HarmonySdk;

    /**
     * 私有构造方法 不允许在子类和外部实例化对象（new一下）
     */
    //private constructor() { }

    /** 使用 🎈：用懒加载形式实现单例模式 */
    // 前面加个static，变成静态方法，可以直接通过类来调用该方法
    static getInstance() {
        // 判断当前单例是否产生
        // 懒加载：需要用到对象时，再实例化对象
        if (!HarmonySdk.instance) {
            // 实例化对象 new一下
            HarmonySdk.instance = new HarmonySdk();
        }
        return HarmonySdk.instance;
    }

    private VERSION: string = "1.0.1";

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "initSDK version:" + this.VERSION);
        if (callback) initSdkPhasesCallback = callback;
        else initSdkPhasesCallback = null;
        // native.reflection.callStaticMethod(true, "entry/src/main/ets/workers/cocos_worker", "entry/test",JSON.stringify(["initSDK", ""]));
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("initSDK", 0);
    }

    getIntersFlag(): boolean {
        // return jsb.reflection.callStaticMethod(true, "entry/src/main/ets/helper/CocosHelper", "getIntersFlag", "");
        return true;
    }

    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        if (callback) intersCallback = callback;
        else intersCallback = null;
        // jsb.reflection.callStaticMethod(true, "entry/src/main/ets/helper/CocosHelper", "showInters", "");
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("showInters", 0);
    }

    getVideoFlag(): boolean {
        // return jsb.reflection.callStaticMethod(true, "entry/src/main/ets/helper/CocosHelper", "getVideoFlag", "");
        return true;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        if (callback) videoCallback = callback;
        else videoCallback = null;
        // jsb.reflection.callStaticMethod(true, "entry/src/main/ets/helper/CocosHelper", "showVideo", "");
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("showVideo", "");
        else {
            console.log("浏览器")
            callback("",{});
        }
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        if (callback) payCallback = callback;
        else payCallback = null;
        // jsb.reflection.callStaticMethod(true, "entry/src/main/ets/helper/CocosHelper", "pay", JSON.stringify(params));
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("pay", JSON.stringify(params));
    }

    copyText(text: string) {
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("copyText", text);
    }

    openUrl(url: string) {
        console.log("openUrl",url);
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("openUrl", url);
    }


    setRedeemCallback(callback: (res: object) => void): void {
        if (callback) redeemCallback = callback;
        else redeemCallback = null;
    }

    consumeOrder(orderId: string): void {
        if (!orderId) return;
        if(!cc.sys.isBrowser) globalThis.oh.postMessage("consumeOrder", orderId);
    }
    setOnResultListener(callback: (code: number, res: string) => void): void {
        
    }
    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        
    }
    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        
    }
    hideBanner(): void {
        
    }
    getNativeIconFlag(): boolean {
        return false
    }
    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        
    }
    hideNativeIcon(): void {
        
    }
    getNativeIconFlag2(): boolean {
        return false
    }
    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
        
    }
    hideNativeIcon2(): void {
        
    }
    getBlockFlag(): boolean {
        return false
    }
    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
        
    }
    hideBlock(): void {
        
    }
    phoneVibrate(type: string): void {
        
    }
    shareApp(): void {
        
    }
    setPaySuccessListener(callback: (res: object[]) => void): void {
        
    }
    orderComplete(orderNo: string): void {
        
    }
    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        
    }
    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    clearArchive(): void {
        
    }
    onClickPrivacyAgreementBtn(): void {

    }
    onClickUserAgreementBtn(): void {
        
    }
    reportEvent(eventName: string, eventParams: object, level: number): void {
        
    }
    reportTaEvent(type: number): void {
        
    }
    getRankData(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    isNextVideoFitShare(): boolean {
        return false
    }
    getRewardBoxFlag(): boolean {
        return false
    }
    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    getVideoCLFlag(): boolean {
        return false
    }
    getABInfoByName(name: string): object {
        return null
    }
    getAdSwitchByKey(key: string): boolean {
        return false
    }
    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {
        
    }
    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        
    }
    gotoSidebar(): void {
        
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        
    }
    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        
    }
    startGameVideo(duration: number): void {
        
    }
    pauseGameVideo(): void {
        
    }
    resumeGameVideo(): void {
        
    }
    stopGameVideo(callback: (videoPath: string) => void): void {
        
    }
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        
    }
    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {
        
    }
    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        
    }    
    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
    }
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
    }
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
    }
    reportKSGameEvent(eventType: string, eventValue: number, callback: (phases: string, res: object) => void): void {
        throw new Error("Method not implemented.");
    }
    setUserProperty(params: object): void {
        
    }
    getChannelId(): number {
        return 0
    }
    gotoOppoGameCenter(): void {
        
    }
}

// 初始化回调
window["LightHarmonyInitCallback"] = (phases: string, res: object) => {
    console.log(TAG, "初始化回调", phases, JSON.stringify(res));
    initSdkPhasesCallback && initSdkPhasesCallback(phases, res);
}

// 视频回调
window["LightHarmonyVideoCallback"] = (res: string) => {
    console.log(TAG, "视频是否播放完成?", res == "1");
    videoCallback && videoCallback(res == "1" ? "videoPlayFinish" : "videoPlayBreak", {});
    videoCallback = null;
}

// 插屏回调
window["LightHarmonyIntersCallBack"] = () => {
    console.log(TAG, "插屏关闭回调");
    intersCallback && intersCallback("intersClose", {});
    intersCallback = null;
}

// 支付回调
window["LightHarmonyPayCallBack"] = (success: string, res: any) => {
    console.log(TAG, "支付结果回调:" + res);
    payCallback && payCallback(success == "1" ? "paySuccess" : "payFail", res);
    payCallback = null;
}

//补单回调
window["LightHarmonyRedeemCallBack"] = (res: any) => {
    console.log(TAG, "补单回调:" + res);
    redeemCallback && redeemCallback(res);
}

//OnResult回调
window["LightHarmonyOnResultCallBack"] = (code: string, res: any) => {
    console.log(TAG, "onResult回调, code:" + code + ";res:" + res);
}