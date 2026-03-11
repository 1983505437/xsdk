import IXSdk from "../IXSdk";
import EngineUtils from "../utils/EngineUtils";
import PrivacyAgreement from "../utils/PrivacyAgreement";

export default class TestSdk implements IXSdk {

    // 视频/支付依次成功
    private sequenceModel: boolean = true;
    private videoShowTimes: number = 1;
    private rewardBoxShowTimes: number = 1;
    private payTimes: number = 1;
    private initSdkPhasesCallback: (phases: string, res: object) => void;
    private payCallback: (res: object[]) => void;

    private phasesCallbackToInitSdk(phases: string, res: object): void {
        this.initSdkPhasesCallback && this.initSdkPhasesCallback(phases, res);
    }

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.sequenceModel = params ? (params["sequenceModel"] ? params["sequenceModel"] : false) : true;
        if (callback) this.initSdkPhasesCallback = callback;
        this.phasesCallbackToInitSdk("channelLoginSuccess", {});
        this.phasesCallbackToInitSdk("getAdParamsSuccess", {});
        this.phasesCallbackToInitSdk("startCreateAd", {});
        this.phasesCallbackToInitSdk("createAd", {});
        this.phasesCallbackToInitSdk("createAdFinish", {});
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
        EngineUtils.showPopup("setOnResultListener");
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        callback({ ret: false, userInfo: {} });
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showBanner");
    }

    hideBanner(): void {
        EngineUtils.showPopup("hideBanner");
    }

    getIntersFlag(): boolean {
        EngineUtils.showPopup("getIntersFlag");
        return true;
    }

    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showInters");
        callback && callback("intersClose", {});
    }

    getVideoFlag(): boolean {
        EngineUtils.showPopup("getVideoFlag");
        return true;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showVideo");
        if (this.sequenceModel) {
            this.videoShowTimes % 2 == 0 ? callback("videoPlayFinish", {}) : callback("videoPlayBreak", {});
            this.videoShowTimes++;
        } else {
            callback("videoPlayFinish", {});
        }
    }

    getNativeIconFlag(): boolean {
        EngineUtils.showPopup("getNativeIconFlag");
        return true;
    }

    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showNativeIcon");
    }

    hideNativeIcon(): void {
        EngineUtils.showPopup("hideNativeIcon");
    }

    getNativeIconFlag2(): boolean {
        EngineUtils.showPopup("getNativeIconFlag2");
        return true;
    }

    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showNativeIcon2");
    }

    hideNativeIcon2(): void {
        EngineUtils.showPopup("hideNativeIcon2");
    }

    getBlockFlag(): boolean {
        EngineUtils.showPopup("getBlockFlag");
        return true;
    }

    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showBlock");
    }

    hideBlock(): void {
        EngineUtils.showPopup("hideBlock");
    }

    phoneVibrate(type: string): void {
        EngineUtils.showPopup("phoneVibrate:" + type);
    }

    shareApp(): void {
        EngineUtils.showPopup("shareApp");
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
        EngineUtils.showPopup("setPaySuccessListener");
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.payCallback) {
            EngineUtils.showPopup("清先调用setPaySuccessListener设置支付成功回调");
            return;
        }
        EngineUtils.showPopup("pay");
        if (this.sequenceModel) {
            this.payTimes % 2 == 0 ? (callback("orderPayFinish", {}), this.payCallback([{ "orderNo": "testOrderNo", "productExternalId": "testProductExternalId" }])) : callback("orderPayFail", {});
            this.payTimes++;
        } else {
            callback("orderPayFinish", {});
        }
    }

    orderComplete(orderNo: string): void {
        EngineUtils.showPopup("orderComplete:" + orderNo);
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("giftExchange:" + exchangeCode);
        callback && callback("giftExchangeFail", {});
    }

    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("setArchive");
        callback && callback("setArchiveFail", {});
    }

    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("getArchive");
        callback && callback("getArchiveFail", {});
    }

    clearArchive(): void {
        EngineUtils.showPopup("clearArchive");
    }

    onClickPrivacyAgreementBtn(): void {
        PrivacyAgreement.getInstance().openPrivacyAgreement();
    }

    onClickUserAgreementBtn(): void {
        PrivacyAgreement.getInstance().openUserAgreement();
    }

    reportEvent(eventName: string, eventParams: object, level: number): void {
        EngineUtils.showPopup("eventName:" + eventName);
    }

    reportTaEvent(type: number): void {
        EngineUtils.showPopup("reportTaEvent:" + type);
    }

    getRankData(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("getRankData");
        callback && callback("getRankDataFail", {});
    }

    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("uploadUserRankData");
        callback && callback("uploadUserRankDataFail", {});
    }

    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("getRawDataSignature");
        callback && callback("getRawDataSignatureFail", {});
    }

    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("decryptionData");
        callback && callback("decryptionDataFail", {});
    }

    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("getGameJson");
        callback && callback("getGameJsonFail", {});
    }

    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("uploadShareTask");
        callback("uploadShareTaskFail", {});
    }

    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("getShareTaskDetail");
        callback("getShareTaskDetailFail", {});
    }

    isNextVideoFitShare(): boolean {
        return false;
    }

    getRewardBoxFlag(): boolean {
        EngineUtils.showPopup("getRewardBoxFlag");
        return true;
    }

    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("showRewardBox");
        if (this.sequenceModel) {
            this.rewardBoxShowTimes % 2 == 0 ? callback("showRewardBoxFinish", {}) : callback("showRewardBoxBreak", {});
            this.rewardBoxShowTimes++;
        } else {
            callback("showRewardBoxFinish", {});
        }
    }

    getVideoCLFlag(): boolean {
        EngineUtils.showPopup("getVideoCLFlag");
        return false;
    }

    getABInfoByName(name: string): object {
        EngineUtils.showPopup("getABInfoByName");
        return {};
    }

    getAdSwitchByKey(key: string): boolean {
        EngineUtils.showPopup("getAdSwitchByKey");
        return false;
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {
        EngineUtils.showPopup("createToShowAd");
    }

    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        callback(false);
    }
    gotoSidebar(): void {
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        callback(false);
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        callback(false);
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        callback(false);
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
        EngineUtils.showPopup("setUserProperty");
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {
        EngineUtils.showPopup("gotoOppoGameCenter");
    }
}