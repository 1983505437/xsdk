import IXSdk from "../IXSdk";
import { TAG } from "../utils/Enums";

let initSdkPhasesCallback: (phases: string, res: object) => void;
let videoCallback: (phases: string, res: object) => void;
let intersCallback: (phases: string, res: object) => void;
let payCallback: (phases: string, res: { paySuccess: boolean, orderNo: string, productExternalId: string }) => void;
let giftExchangeCallback: (phases: string, res: object) => void;
let onResultCallback: (code: number, res: string) => void;
let setArchiveCallback: (phases: string, res: object) => void;
let getArchiveCallback: (phases: string, res: object) => void;

let initPhases: string = "";
let initRes: object = {};
export default class LightAndroidSdk implements IXSdk {

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log("LightAndroidSdk initSDK");
        if (callback) {
            initSdkPhasesCallback = callback;
            if (initPhases != "") {
                callback(initPhases, initRes);
            }
        }
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "initSDK", "(Ljava/lang/String;)V", str);
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
        if (!callback) {
            console.error(TAG, "未设置回调");
            return;
        }
        onResultCallback = callback;
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        callback({ ret: false, userInfo: {} });
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "showBanner", "(Ljava/lang/String;)V", str);
    }

    hideBanner(): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "hideBanner", "()V");
    }

    getIntersFlag(): boolean {
        if(!cc.sys.isBrowser)return jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "getIntersFlag", "()Z");
    }

    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        if (callback) intersCallback = callback;
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "showInters", "(Ljava/lang/String;)V", str);
    }

    getVideoFlag(): boolean {
        if(!cc.sys.isBrowser)return jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "getVideoFlag", "()Z");
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        videoCallback = callback;
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "showVideo", "(Ljava/lang/String;)V", str);
        else console.log("浏览器直接给奖励"),callback("",{});
    }

    getNativeIconFlag(): boolean {
        if(!cc.sys.isBrowser)return jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "getFloatIconFlag", "()Z");
    }

    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "showFloatIcon", "(Ljava/lang/String;)V", str);
    }

    hideNativeIcon(): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "hideFloatIcon", "()V");
    }

    getNativeIconFlag2(): boolean {
        return false;
    }

    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
    }

    hideNativeIcon2(): void {
    }

    getBlockFlag(): boolean {
        return false;
    }

    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
    }

    hideBlock(): void {
    }

    phoneVibrate(type: string): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "phoneVibrate", "(Ljava/lang/String;)V", type);
    }

    shareApp(): void {
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        // payCallback = callback;
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        if (!callback) {
            console.error(TAG, "未设置支付回调");
            return;
        }
        payCallback = callback;
        let str = params ? JSON.stringify(params) : "";
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "pay", "(Ljava/lang/String;)V", str);
    }

    orderComplete(orderNo: string): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "orderComplete", "(Ljava/lang/String;)V", orderNo);
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        if (!callback) {
            console.error(TAG, "未设置兑换礼包回调");
            return;
        }
        giftExchangeCallback = callback;
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "giftExchange", "(Ljava/lang/String;)V", exchangeCode);
    }

    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        if (callback) setArchiveCallback = callback;
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "setArchive", "(Ljava/lang/String;)V", JSON.stringify(params));
    }

    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        if (callback) getArchiveCallback = callback;
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "getArchive", "(Ljava/lang/String;)V", JSON.stringify(params));
    }

    clearArchive(): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "clearArchive", "()V");
    }

    onClickPrivacyAgreementBtn(): void {
    }

    onClickUserAgreementBtn(): void {
    }

    reportEvent(eventName: string, eventParams: object, level: number): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "reportEvent", "(ILjava/lang/String;Ljava/lang/String;)V", level, eventName, JSON.stringify(eventParams));
    }

    reportTaEvent(type: number): void {
    }

    getRankData(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("getRankDataFail", {});
    }

    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("uploadUserRankDataFail", {});
    }

    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("getRawDataSignatureFail", {});
    }

    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("decryptionDataFail", {});
    }

    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("getGameJsonFail", {});
    }

    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        callback("uploadShareTaskFail", {});
    }

    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        callback("getShareTaskDetailFail", {});
    }

    isNextVideoFitShare(): boolean {
        return false;
    }

    getRewardBoxFlag(): boolean {
        return false;
    }

    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {

    }

    getVideoCLFlag(): boolean {
        return false;
    }

    getABInfoByName(name: string): object {
        return {};
    }

    getAdSwitchByKey(key: string): boolean {
        return false;
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {

    }

    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        callback(true);
    }
    gotoSidebar(): void {
        console.log("安卓 gotoSidebar")
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {   
        console.log("安卓 intoGameFromSidebar")
        callback(true);
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        console.log("安卓 isSupportAddDesktop")
        callback(false);
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        console.log("安卓 addDesktop")
        callback(true);
    }

    startGameVideo(duration: number): void {

    }
    pauseGameVideo(): void {

    }
    resumeGameVideo(): void {

    }
    stopGameVideo(callback: (videoPath: string) => void): void {
        callback("");
    }
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        callback(false);
    }

    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {

    }

    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        callback && callback("jumpToGameClubFail", { msg: "不存在游戏圈" })
    }

    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
        callback("setImRankDataFail", {});
    }
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
        callback("getImRankDataFail", {});
    }
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
        callback("getImRankListFail", {});
    }

    reportKSGameEvent(eventType: string, eventValue: number, callback: (phases: string, res: object) => void): void {
        callback("reportKSGameEventFail", {});
    }

    setUserProperty(params: object): void {
        if (!params) {
            console.error(TAG, "setUserProperty params is null");
            return;
        }
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "setUserProperty", "(Ljava/lang/String;)V", JSON.stringify(params));
    }

    getChannelId(): number {
        if(!cc.sys.isBrowser)return jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "getChannelId", "()I");
    }

    gotoOppoGameCenter(): void {
        if(!cc.sys.isBrowser)jsb.reflection.callStaticMethod("com/lt/sdk/cocos/MainClass", "gotoOppoGameCenter", "()V");
    }
}


{
    // onResult回调
    {
        (<any>window).LightAndroidOnResultCallback = (code: number, res: string) => {
            console.log(TAG, "onResult回调", code, res);
            onResultCallback && onResultCallback(code, res);
        }
    };

    //初始化回调
    {
        (<any>window).LightAndroidInitCallback = (phases: string, res: object) => {
            console.log(TAG, "初始化回调", phases);
            initPhases = phases;
            initRes = res;
            initSdkPhasesCallback && initSdkPhasesCallback(phases, res);
        }
    };

    //视频回调
    {
        (<any>window).LightAndroidVideoCallback = (result: boolean) => {
            console.log(TAG, "视频是否播放完成?", result);
            videoCallback && videoCallback(result ? "videoPlayFinish" : "videoPlayBreak", {});
            videoCallback = null;
        }
    };

    //插屏回调
    {
        (<any>window).LightAndroidIntersCallBack = () => {
            //do something 视频播放完成所做的操作 恢复游戏
            console.log(TAG, "插屏关闭回调");
            intersCallback && intersCallback("intersClose", {});
            intersCallback = null;
        }
    };

    //订单支付回调
    {
        (<any>window).LightAndroidPayCallback = (paySuccess: boolean, orderNo: string, productExternalId: string) => {
            console.log(TAG, "订单支付回调 orderNo:" + orderNo, "productExternalId:" + productExternalId, "该订单是否支付成功?", paySuccess);
            payCallback && payCallback("orderPayFinish", { "paySuccess": paySuccess, "orderNo": orderNo, "productExternalId": productExternalId });
            // 补单需要点击一笔商品，所以此处不重置payCallback
        }
    };

    //礼包兑换回调
    {
        (<any>window).LightAndroidGiftExchangeCallback = (jsonString: string) => {
            console.log(TAG, "礼包兑换回调 jsonString:" + jsonString);
            giftExchangeCallback && giftExchangeCallback("giftExchangeFail", {});
        }
    };

    //存档回调
    {
        (<any>window).LightAndroidSetArchiveCallback = (jsonString: string) => {
            console.log(TAG, "存档结果回调");
            let json = JSON.parse(jsonString);
            let resultJson = {
                "succeed": true, "code": 0, "codeMsg": "success", "data": {}
            }
            if (!json["success"]) {
                resultJson["succeed"] = false;
                resultJson["codeMsg"] = "fail";
            }
            if (resultJson["succeed"]) {
                setArchiveCallback && setArchiveCallback("setArchiveSuccess", resultJson);
            } else {
                setArchiveCallback && setArchiveCallback("setArchiveFail", resultJson);
            }
            setArchiveCallback = null;
        }
    };

    //取档回调
    {
        (<any>window).LightAndroidGetArchiveCallback = (jsonString: string) => {
            let json = JSON.parse(jsonString);
            console.log(TAG, "取档结果回调", json);
            let resultJson = {
                "succeed": true, "code": 0, "codeMsg": "success", "data": { archive: '', version: '', hasArchive: false }
            }
            if (!json["success"]) {
                resultJson["succeed"] = false;
                resultJson["codeMsg"] = "fail";
            }
            if (resultJson["succeed"]) {
                resultJson.data.archive = json.data&&json.data.archive
                resultJson.data.version = json.data&&json.data.version
                if (json.data&&json.data.archive) {
                    resultJson.data.hasArchive = true
                }
                getArchiveCallback && getArchiveCallback("getArchiveSuccess", resultJson);
            } else {
                getArchiveCallback && getArchiveCallback("getArchiveFail", resultJson);
            }
            getArchiveCallback = null;
        }
    };
}