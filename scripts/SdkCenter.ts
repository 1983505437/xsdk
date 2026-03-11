import IXSdk from "./IXSdk";
import { sdkConfig, sdkVersion } from "./SdkConfig";
import BilibliSdk from "./channel/BilibliSdk";
import HuaweiSdk from "./channel/HuaweiSdk";
import KSSdk from "./channel/KSSdk";
import LightAndroidSdk from "./channel/LightAndroidSdk";
import OppoSdk from "./channel/OppoSdk";
import QqSdk from "./channel/QqSdk";
import TestSdk from "./channel/TestSdk";
import TiktokSdk from "./channel/TiktokSdk";
import { TAG } from "./utils/Enums";
import LocalStorage from "./utils/LocalStorage";
import PrivacyAgreement from "./utils/PrivacyAgreement";
import VivoSdk from "./channel/VivoSdk";
import WeixinSdk from "./channel/WeixinSdk";
import KSSdkOversea from "./channel/KSSdkOversea";
import ZfbSdk from "./channel/ZfbSdk";
import HarmonySdk from "./channel/HarmonySdk";
import TiktokSdkOversea from "./channel/TiktokSdkOversea";

/*
 * @Author: Vae 
 * @Date: 2023-10-09 11:00:12 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 15:37:26
 */
export default class SdkCenter {
    /**
     * 单例对象
     */
    private static instance: SdkCenter;

    /**
     * 私有构造方法 不允许在子类和外部实例化对象（new一下）
     */
    private constructor() { }

    /** 使用 🎈：用懒加载形式实现单例模式 */
    // 前面加个static，变成静态方法，可以直接通过类来调用该方法
    static getInstance() {
        // 判断当前单例是否产生
        // 懒加载：需要用到对象时，再实例化对象
        if (!SdkCenter.instance) {
            // 实例化对象 new一下
            SdkCenter.instance = new SdkCenter();
        }
        return SdkCenter.instance;
    }

    /**
     * xsdk代理对象 默认testSdk
     */
    private delegate: IXSdk;


    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        if (params && params["gameChannelCodeNo"]) {
            // 防止渠道号被修改成number类型
            sdkConfig.gameChannelCodeNo = params["gameChannelCodeNo"] + "";
        }
        let channelId: string = sdkConfig.gameChannelCodeNo.substring(sdkConfig.gameChannelCodeNo.length - 3, sdkConfig.gameChannelCodeNo.length);
        let channelName: string = "测试";
        let channelNameEn: string = "test";
        let hasPrivacy: boolean = false;
        let onlyPrivacy: boolean = true;
        switch (channelId) {
            case "142":
                channelName = "Oppo小游戏";
                channelNameEn = "oppo";
                this.delegate = new OppoSdk();
                hasPrivacy = true;
                break;
            case "108":
                channelName = "Vivo小游戏";
                channelNameEn = "vivo";
                this.delegate = new VivoSdk();
                hasPrivacy = true;
                break;
            case "154":
                channelName = "抖音小游戏";
                channelNameEn = "tiktok";
                this.delegate = new TiktokSdk();
                break;
            case "155":
                channelName = "Qq小游戏";
                channelNameEn = "qq";
                this.delegate = new QqSdk();
                hasPrivacy = true;
                onlyPrivacy = false;
                break;
            case "161":
                channelName = "微信小游戏";
                channelNameEn = "weixin";
                this.delegate = new WeixinSdk();
                break;
            case "163":
                channelName = "华为小游戏";
                channelNameEn = "huawei";
                this.delegate = new HuaweiSdk();
                hasPrivacy = true;
                break;
            case "164":
                channelName = "快手小游戏";
                channelNameEn = "kuaishou";
                this.delegate = new KSSdk();
                break;
            case "165":
                channelName = "bilibili小游戏";
                channelNameEn = "bilibili";
                this.delegate = new BilibliSdk();
                break;
            case "166":
                channelName = "支付宝小游戏";
                channelNameEn = "zfb";
                this.delegate = new ZfbSdk();
                break;
            case "300":
                channelName = "海外快手小游戏";
                channelNameEn = "kuaishou-oversea";
                this.delegate = new KSSdkOversea();
                break;
            case "301":
                channelName = "海外抖音小游戏";
                channelNameEn = "tiktok-oversea";
                this.delegate = new TiktokSdkOversea();
                break;
            case "666":
                channelName = "安卓游戏";
                channelNameEn = "lt_android";
                this.delegate = new LightAndroidSdk();
                hasPrivacy = false;
                break;
            case "668":
                channelName = "鸿蒙游戏";
                channelNameEn = "harmony";
                this.delegate = new HarmonySdk();
                hasPrivacy = false;
                break;
            default:
                this.delegate = new TestSdk();
                hasPrivacy = true;
                onlyPrivacy = false;
                break;
        }
        (params && params["group"]) ? LocalStorage.setStringData("group", params["group"]) : "";
        LocalStorage.setStringData("company", (params && params["company"]) ? params["company"] : "yx");
        if (params && params["versionName"]) LocalStorage.setStringData("versionName", params["versionName"]);
        PrivacyAgreement.getInstance().setPrivacyConfig(hasPrivacy, onlyPrivacy, callback);
        console.log(TAG, "渠道号:" + sdkConfig.gameChannelCodeNo);
        console.log(TAG, "渠道名:" + channelName);
        console.log(TAG, "版本名:" + sdkVersion);
        LocalStorage.setStringData("channelNameEn", channelNameEn);
        console.log(TAG, "initSDK params:" + JSON.stringify(params));
        this.delegate.initSDK(params, callback);
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
        this.delegate.setOnResultListener(callback);
    }

    getUserInfo(callback: (userInfo: { ret: boolean, userInfo: object }) => void): void {
        this.delegate.getUserInfo(callback);
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        this.delegate.showBanner(params, callback);
    }
    hideBanner(): void {
        this.delegate.hideBanner();
    }
    getIntersFlag(): boolean {
        return this.delegate.getIntersFlag();
    }
    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        this.delegate.showInters(params, callback);
    }
    getVideoFlag(): boolean {
        return this.delegate.getVideoFlag();
    }
    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.showVideo(params, callback);
    }
    getNativeIconFlag(): boolean {
        return this.delegate.getNativeIconFlag();
    }
    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        this.delegate.showNativeIcon(params, callback);
    }
    hideNativeIcon(): void {
        this.delegate.hideNativeIcon();
    }
    getNativeIconFlag2(): boolean {
        return this.delegate.getNativeIconFlag2();
    }
    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
        this.delegate.showNativeIcon2(params, callback);
    }
    hideNativeIcon2(): void {
        this.delegate.hideNativeIcon2();
    }
    getBlockFlag(): boolean {
        return this.delegate.getBlockFlag();
    }
    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
        this.delegate.showBlock(params, callback);
    }
    hideBlock(): void {
        this.delegate.hideBlock();
    }
    phoneVibrate(type: string): void {
        this.delegate.phoneVibrate(type);
    }
    shareApp(): void {
        this.delegate.shareApp();
    }
    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.delegate.setPaySuccessListener(callback);
    }
    pay(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.pay(params, callback);
    }
    orderComplete(orderNo: string): void {
        this.delegate.orderComplete(orderNo);
    }
    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        this.delegate.giftExchange(exchangeCode, callback);
    }
    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getArchive(params, callback);
    }
    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.setArchive(params, callback);
    }
    clearArchive() {
        this.delegate.clearArchive();
    }
    onClickPrivacyAgreementBtn(): void {
        this.delegate.onClickPrivacyAgreementBtn();
    }
    onClickUserAgreementBtn(): void {
        this.delegate.onClickUserAgreementBtn();
    }
    reportEvent(eventName: string, eventParams: object, level: number) {
        this.delegate.reportEvent(eventName, eventParams, level);
    }
    reportTaEvent(type: number): void {
        this.delegate.reportTaEvent(type);
    }
    getRankData(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getRankData(params, callback);
    }
    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.uploadUserRankData(params, callback);
    }

    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getRawDataSignature(params, callback);
    }

    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.decryptionData(params, callback);
    }

    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getGameJson(params, callback);
    }

    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.uploadShareTask(params, callback);
    }

    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getShareTaskDetail(params, callback);
    }

    isNextVideoFitShare(): boolean {
        return this.delegate.isNextVideoFitShare();
    }

    getRewardBoxFlag(): boolean {
        return this.delegate.getRewardBoxFlag();
    }
    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.showRewardBox(params, callback);
    }

    getVideoCLFlag(): boolean {
        return this.delegate.getVideoCLFlag();
    }

    getABInfoByName(name: string): object {
        return this.delegate.getABInfoByName(name);
    }

    getAdSwitchByKey(key: string): boolean {
        return this.delegate.getAdSwitchByKey(key);
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.createToShowAd(params, callback);
    }

    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        this.delegate.isSupportSidebar(callback);
    }
    gotoSidebar(): void {
        this.delegate.gotoSidebar();
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        this.delegate.intoGameFromSidebar(callback);
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        this.delegate.isSupportAddDesktop(callback);
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        this.delegate.addDesktop(callback);
    }

    startGameVideo(duration: number): void {
        this.delegate.startGameVideo(duration);
    }
    pauseGameVideo(): void {
        this.delegate.pauseGameVideo();
    }
    resumeGameVideo(): void {
        this.delegate.resumeGameVideo();
    }
    stopGameVideo(callback: (videoPath: string) => void): void {
        this.delegate.stopGameVideo(callback);
    }
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        this.delegate.shareGameVideo(title, desc, topics, videoPath, callback);
    }

    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {
        this.delegate.shareToGameClub(type, path, mouldId, callback);
    }

    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        this.delegate.jumpToGameClub(callback);
    }

    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.setImRankData(params, callback);
    }
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getImRankData(params, callback);
    }
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
        this.delegate.getImRankList(params, callback);
    }

    reportKSGameEvent(eventType: string, eventValue: number, callback: (phases: string, res: object) => void): void {
        this.delegate.reportKSGameEvent(eventType, eventValue, callback);
    }

    setUserProperty(params: object): void {
        this.delegate.setUserProperty(params);
    }

    getChannelId(): number {
        return this.delegate.getChannelId();
    }

    gotoOppoGameCenter(): void {
        this.delegate.gotoOppoGameCenter();
    }
}