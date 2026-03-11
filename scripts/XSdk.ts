import { iframeSDK } from "../iframeSDK/iframeSDK";
import { isHJ } from "./else/myData";
import SdkFactory from "./SdkCenter";
import { TAG } from "./utils/Enums";

/*
 * @Author: Vae 
 * @Date: 2023-10-09 09:36:39 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 16:08:27
 */
export default class XSdk {
    /**
     * 单例对象
     */
    private static instance: XSdk;

    /**
     * 私有构造方法 不允许在子类和外部实例化对象（new一下）
     */
    private constructor() { }

    /** 使用 🎈：用懒加载形式实现单例模式 */
    // 前面加个static，变成静态方法，可以直接通过类来调用该方法
    static getInstance() {
        // 判断当前单例是否产生
        // 懒加载：需要用到对象时，再实例化对象
        if (!XSdk.instance) {
            // 实例化对象 new一下
            XSdk.instance = new XSdk();
        }
        return XSdk.instance;
    }

    /**
     * 初始化sdk,回调各个阶段的数据
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "initSDK");
        SdkFactory.getInstance().initSDK(params, callback);
    }

    /**
     * 安卓设置onResult监听
     * @param callback 
     * code: 105-创建订单成功 106-创建订单失败
     * res: 1、需要判断res是否为空 2、将res JSON.parse 需要try catch 防止转换异常
     */
    setOnResultListener(callback: (code: number, res: string) => void): void {
        console.log(TAG, "setOnResultListener");
        SdkFactory.getInstance().setOnResultListener(callback);
    }

    /**
     * 获取用户信息 
     * @param callback (ret:是否获取成功,userInfo:用户信息,包含用户id等数据)
     */
    getUserInfo(callback: (userInfo: { ret: boolean, userInfo: object }) => void): void {
        console.log(TAG, "getUserInfo");
        SdkFactory.getInstance().getUserInfo(callback);
    }

    /**
     * 强制登录，如必须服务端登录成功且在initSDK回调出现serverLoginFail阶段则调用该方法
     * @param callback (ret:是否获取成功,userInfo:用户信息,包含用户id等数据)
     */
    forceLogin(callback: (userInfo: { ret: boolean, userInfo: object }) => void): void {
        console.log(TAG, "forceLogin");
        // 当前版本未打通统一“强制重新登录”流程，避免误导调用方。
        // 需要强制重登时，请按渠道策略重新走 initSDK/登录流程。
        callback && callback({ ret: false, userInfo: { msg: "forceLogin not supported in this version" } });
    }

    /**
     * 展示banner广告
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "showBanner");
        SdkFactory.getInstance().showBanner(params, callback);
    }
    /**
     * 隐藏banner广告
     */
    hideBanner(): void {
        console.log(TAG, "hideBanner");
        SdkFactory.getInstance().hideBanner();
    }

    /**
     * 判断插屏广告能否展示
     */
    getIntersFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getIntersFlag();
        console.log(TAG, "getIntersFlag", flag);
        return flag;
    }
    /**
     * 展示插屏广告
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "showInters");
        SdkFactory.getInstance().showInters(params, callback);
    }
//#region "激励"
    /**
     * 判断激励视频广告能否展示
     */
    getVideoFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getVideoFlag();
        if(cc.sys.isBrowser) flag = true;//*********************************************************************** */
        console.log(TAG, "getVideoFlag", flag);
        return flag;
    }
    /**
     * 展示激励视频广告
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "showVideo");
        SdkFactory.getInstance().showVideo(params, callback);
    }

    /**
     * 判断{weixin:原生单格子}广告能否展示
     */
    getNativeIconFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getNativeIconFlag();
        console.log(TAG, "getNativeIconFlag", flag);
        return flag;
    }
    /**
     * 展示{weixin:原生单格子}广告
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "showNativeIcon");
        SdkFactory.getInstance().showNativeIcon(params, callback);
    }
    /**
     * 隐藏{weixin:原生单格子}广告
     */
    hideNativeIcon(): void {
        console.log(TAG, "hideNativeIcon");
        SdkFactory.getInstance().hideNativeIcon();
    }

    /**
     * 判断{weixin:原生单格子}广告能否展示
     */
    getNativeIconFlag2(): boolean {
        let flag: boolean = SdkFactory.getInstance().getNativeIconFlag2();
        console.log(TAG, "getNativeIconFlag2", flag);
        return flag;
    }
    /**
     * 展示{weixin:原生单格子}广告
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "showNativeIcon2");
        SdkFactory.getInstance().showNativeIcon2(params, callback);
    }
    /**
     * 隐藏{weixin:原生单格子}广告
     */
    hideNativeIcon2(): void {
        console.log(TAG, "hideNativeIcon2");
        SdkFactory.getInstance().hideNativeIcon2();
    }

    /**
     * 判断{weixin:原生多格子}广告能否展示
     */
    getBlockFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getBlockFlag();
        console.log(TAG, "getBlockFlag", flag);
        return flag;
    }
    /**
     * 展示{weixin:原生多格子}广告
     * @param params 自定义参数
     * @param callback phases:各个阶段,res:阶段响应数据
     */
    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "showBlock");
        SdkFactory.getInstance().showBlock(params, callback);
    }
    /**
     * 隐藏{weixin:原生多格子}广告
     */
    hideBlock(): void {
        console.log(TAG, "hideBlock");
        SdkFactory.getInstance().hideBlock();
    }

    /**
     * 手机震动
     * @param type short:短震动,long:长震动
     */
    phoneVibrate(type: string): void {
        console.log(TAG, "phoneVibrate", type);
        if(!cc.sys.isBrowser) SdkFactory.getInstance().phoneVibrate(type);
    }

    /**
     * 拉起{weixin:分享小程序}弹窗
     */
    shareApp(): void {
        console.log(TAG, "shareApp");
        SdkFactory.getInstance().shareApp();
    }

    /**
     * 设置支付成功监听
     */
    setPaySuccessListener(callback: (res: object[]) => void): void {
        console.log(TAG, "setPaySuccessListener");
        SdkFactory.getInstance().setPaySuccessListener(callback);
    }
    /**
     * 支付
     */
    pay(params: object, callback: (phases: string, res: object) => void) {
        console.log(TAG, "pay");
        SdkFactory.getInstance().pay(params, callback);
    }
    /**
     * 订单完成
     * @param orderNo 订单号
     */
    orderComplete(orderNo: string): void {
        console.log(TAG, "orderComplete");
        SdkFactory.getInstance().orderComplete(orderNo);
    }
    /**
     * 礼包兑换
     * @param exchangeCode 
     */
    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "giftExchange");
        SdkFactory.getInstance().giftExchange(exchangeCode, callback);
    }

    /**
     * 获取游戏存档
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getArchive");
        SdkFactory.getInstance().getArchive(params, callback);
    }

    /**
     * 设置游戏存档
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "setArchive", JSON.stringify(params));
        SdkFactory.getInstance().setArchive(params, callback);
    }

    /**
     * 清除游戏存档
     */
    clearArchive(): void {
        console.log(TAG, "clearArchive");
        SdkFactory.getInstance().clearArchive();
    }

    /**
     * 监听点击隐私协议按钮
     */
    onClickPrivacyAgreementBtn(): void {
        console.log(TAG, "onClickPrivacyAgreementBtn");
        if(!cc.sys.isBrowser) SdkFactory.getInstance().onClickPrivacyAgreementBtn();
    }

    /**
     * 监听点击用户协议按钮
     */
    onClickUserAgreementBtn(): void {
        console.log(TAG, "onClickUserAgreementBtn");
        if(!cc.sys.isBrowser) SdkFactory.getInstance().onClickUserAgreementBtn();
    }

    /**
     * 上报事件(暂时只微信小游戏使用)
     * @param eventName 事件名
     * @param eventParams 事件参数
     * @param level 事件等级
     */
    reportEvent(eventName: string, eventParams: object, level: number = 5): void {
        console.log(TAG, "reportEvent", eventName);
        SdkFactory.getInstance().reportEvent(eventName, eventParams, level);
    }

    /**
     * 上报TA事件(腾讯广告归因 暂时只微信小游戏使用)
     * @param type 1-代码主动拉起分享时上报 2-完成新手引导时上报
     */
    reportTaEvent(type: number): void {
        console.log(TAG, "reportTaEvent", type);
        SdkFactory.getInstance().reportTaEvent(type);
    }

    /**
     * 根据自定义参数获取排行榜数据
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    getRankData(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getRank");
        SdkFactory.getInstance().getRankData(params, callback);
    }

    /**
     * 上传用户排行数据
     * @param params 自定义参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "uploadUserRankData");
        SdkFactory.getInstance().uploadUserRankData(params, callback);
    }

    /**
     * 获取rawData签名参数(暂时仅微信小游戏使用)
     * @param params rawData参数
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getRawDataSignature");
        SdkFactory.getInstance().getRawDataSignature(params, callback);
    }

    /**
     * 解密数据(暂时仅微信小游戏使用)
     * @param params { iv:加密算法的初始向量 string, encryptedData:包括GameClubData在内的加密数据 string }
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "decryptionData");
        SdkFactory.getInstance().decryptionData(params, callback);
    }

    /**
     * 获取游戏json
     * @param params 包含版本号 调试模式
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getGameJson");
        SdkFactory.getInstance().getGameJson(params, callback);
    }

    /**
     * 上传分享任务(暂时仅微信小游戏使用)
     * @param params { taskId: 任务id string, fromUid: 分享者id string, ext: 扩展数据 string }
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "uploadShareTask");
        SdkFactory.getInstance().uploadShareTask(params, callback);
    }

    /**
     * 获取分享任务详情(暂时仅微信小游戏使用)
     * @param params { taskId: 分享任务id string }
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getShareTaskDetail");
        SdkFactory.getInstance().getShareTaskDetail(params, callback);
    }

    /**
     * 下一个激励视频广告是否适合分享(暂时仅微信小游戏使用)
     * @returns true-适合分享, false-适合激励视频
     */
    isNextVideoFitShare(): boolean {
        let flag: boolean = SdkFactory.getInstance().isNextVideoFitShare();
        console.log(TAG, "isNextVideoFitShare", flag);
        return flag;
    }

    /**
     * 判断激励盒子能否展示
     */
    getRewardBoxFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getRewardBoxFlag();
        console.log(TAG, "getRewardBoxFlag", flag);
        return flag;
    }

    /**
     * 展示激励盒子
     * @param params 暂无参数 传{}
     * @param callback (phases:各个阶段,res:阶段响应数据)
     */
    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "showRewardBox");
        SdkFactory.getInstance().showRewardBox(params, callback);
    }

    /**
     * 判断本次点击操作是否可触发激励视频
     */
    getVideoCLFlag(): boolean {
        let flag: boolean = SdkFactory.getInstance().getVideoCLFlag();
        console.log(TAG, "getVideoCLFlag", flag);
        return flag;
    }

    /**
     * 根据层名称获取AB实验信息
     */
    getABInfoByName(name: string): object {
        let info: object = SdkFactory.getInstance().getABInfoByName(name);
        console.log(TAG, "getABInfoByName", JSON.stringify(info));
        return info;
    }

    /**
     * 根据key获取广告开关
     */
    getAdSwitchByKey(key: string): boolean {
        let flag: boolean = SdkFactory.getInstance().getAdSwitchByKey(key);
        console.log(TAG, "getAdSwitchByKey, key:" + key, flag);
        return flag;
    }

    /**
     * 创建并展示广告
     */
    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "createToShowAd");
        SdkFactory.getInstance().createToShowAd(params, callback);
    }

    /**
     * 是否支持侧边栏
     * @param callback true-支持 false-不支持(可能抖音应用版本过低等原因)
     */
    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        console.log(TAG, "isSupportSidebar");
        SdkFactory.getInstance().isSupportSidebar(callback);
    }
    /**
     * 跳转到侧边栏
     */
    gotoSidebar(): void {
        console.log(TAG, "gotoSidebar");
        SdkFactory.getInstance().gotoSidebar();
    }
    /**
     * 是否从侧边栏进入游戏
     * @param callback true-是(下发奖励等操作) false-否
     */
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        console.log(TAG, "intoGameFromSidebar");
        SdkFactory.getInstance().intoGameFromSidebar(callback);
    }

    /**
     * 是否支持添加桌面
     * @param callback true-支持 false-不支持(可能已存在桌面图标或频繁调用等原因)
     */
    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        console.log(TAG, "isSupportAddDesktop");
        SdkFactory.getInstance().isSupportAddDesktop(callback);
    }
    /**
     * 添加桌面
     */
    addDesktop(callback: (isSuccess: boolean) => void): void {
        console.log(TAG, "addDesktop");
        SdkFactory.getInstance().addDesktop(callback);
    }

    /**
     * 抖音小游戏、快手小游戏支持以下录屏方法
     */
    /**
     * 开始录屏
     * @param duration 录屏时长(秒) 必须大于3s，最大值300s
     */
    startGameVideo(duration: number): void {
        console.log(TAG, "startGameVideo");
        SdkFactory.getInstance().startGameVideo(duration);
    }
    /**
     * 暂停录屏
     */
    pauseGameVideo(): void {
        console.log(TAG, "pauseGameVideo");
        SdkFactory.getInstance().pauseGameVideo();
    }
    /**
     * 暂停后继续录屏
     */
    resumeGameVideo(): void {
        console.log(TAG, "resumeGameVideo");
        SdkFactory.getInstance().resumeGameVideo();
    }
    /**
     * 结束录屏
     */
    stopGameVideo(callback: (videoPath: string) => void): void {
        console.log(TAG, "stopGameVideo");
        SdkFactory.getInstance().stopGameVideo(callback);
    }
    /**
     * 分享录屏
     * @param title 这是抖音分享录屏的标题 快手可在快手后台申请样式添加样式ID,无样式ID需为""
     * @param desc 这是头条分享录屏的描述 快手可填任意
     * @param topics 这是抖音分享录屏的话题 快手可填任意
     * @param videoPath 抖音-视频地址 快手-录屏ID 停止录屏返回的地址或ID
     * @param callback 分享录屏回调 true-成功 false-失败 失败时查看XSDK日志错误码
     */
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        console.log(TAG, "shareGameVideo");
        SdkFactory.getInstance().shareGameVideo(title, desc, topics, videoPath, callback);
    }

    /**
     * 分享图片/录屏到游戏圈
     * @param type 1-分享图片 2-分享录屏
     * @param path 分享图片则为图片链接 分享录屏则为停止录屏返回的ID
     * @param mouldId 默认分享文案模板id，内容在开放平台设置，非必填
     * @param callback 分享的结果回调 true-成功 false-失败
     */
    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {
        console.log(TAG, "shareToGameClub");
        SdkFactory.getInstance().shareToGameClub(type, path, mouldId, callback);
    }

    /**
     * 跳转到游戏圈
     * @param callback 跳转成功/失败的回调
     */
    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        console.log(TAG, "jumpToGameClub");
        SdkFactory.getInstance().jumpToGameClub(callback);
    }

    /**
     * 写入排行榜数据(抖音官方排行榜)
     * @param params 参考https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/open-capacity/game-rank/setImRankData#%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E
     */
    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "setImRankData");
        SdkFactory.getInstance().setImRankData(params, callback);
    }
    /**
     * 获取排行榜数据，用作自定义绘制排行榜，推荐使用getImRankList接口(抖音官方排行榜)
     * @param params 参考https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/open-capacity/game-rank/getImRankData#%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E
     */
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getImRankData");
        SdkFactory.getInstance().getImRankData(params, callback);
    }
    /**
     * 根据参数自动绘制游戏好友排行榜(抖音官方排行榜)
     * @param params 参考https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/open-capacity/game-rank/getImRankList#%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E
     */
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "getImRankList");
        SdkFactory.getInstance().getImRankList(params, callback);
    }

    /**
     * 上报快手游戏事件
     * @param eventType 
     * @param eventValue 
     * @param callback 
     */
    reportKSGameEvent(eventType: string, eventValue: number, callback: (phases: string, res: object) => void): void {
        console.log(TAG, "reportKSGameEvent");
        SdkFactory.getInstance().reportKSGameEvent(eventType, eventValue, callback);
    }

    /**
     * 国内安卓常用接口
     */
    /**
     * 设置用户属性
     * @param params 用户属性
     */
    setUserProperty(params: object): void {
        console.log(TAG, "setUserProperty");
        SdkFactory.getInstance().setUserProperty(params);
    }

    /**
     * 获取渠道ID
     * @returns 渠道id
     */
    getChannelId(): number {
        if(isHJ&&cc.sys.isBrowser){
            let num =  iframeSDK.getChannelId()
            console.log(TAG, "getChannelId:" + num);
            return num
        }
        let num = SdkFactory.getInstance().getChannelId();
        console.log(TAG, "getChannelId:" + num);
        return num;
    }

    /**
     * 安卓-oppo渠道选接
     * 跳转oppo游戏中心
     */
    gotoOppoGameCenter(): void {
        if(isHJ&&cc.sys.isBrowser){
            iframeSDK.showOPPOMoreGame()
            return
        }
        console.log(TAG, "gotoOppoGameCenter");
        if(!cc.sys.isBrowser) SdkFactory.getInstance().gotoOppoGameCenter();
    }

}