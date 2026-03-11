import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Qq";
/*
 * @Author: Vae 
 * @Date: 2023-10-31 15:27:14 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 15:54:47
 */
export default class QqSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "qq": {
            "jsCode": ""
        }
    }

    private initSdkPhasesCallback: (phases: string, res: object) => void;
    private showBannerPhasesCallback: (phases: string, res: object) => void;
    private showIntersPhasesCallback: ((phases: string, res: object) => void) | null;
    private showVideoPhasesCallback: (phases: string, res: object) => void;

    // 广告开关
    private switch_banner: boolean = false;
    private switch_screen: boolean = false;
    private switch_video: boolean = false;

    // 广告id
    private id_banner: string = "";
    private id_screen: string = "";
    private id_video: string = "";

    // banner控制
    private time_banner_refresh: number = 30;
    private num_banner_max_close: number = 999;
    private time_close_show_interval: number = 0;

    // 插屏控制
    private number_inters_start_show: number = 0;
    private num_inters_interval: number = 0;
    private time_inters_interval: number = 0;
    private probability_inters_delay: number = 0;
    private time_inters_delay: number = 0;

    // 插屏多合一
    private probability_inters: number = 100;
    private probability_native_inters: number = 0;
    private probability_native_template_inters: number = 0;
    private probability_navigate_inters: number = 0;
    private probability_video: number = 0;

    // banner
    private bannerAd: any = null;
    private load_success_system_banner: boolean = false;
    private timeout_retry_load_banner: number = -1;
    private load_success_banner: boolean = false;
    private timeout_check_banner_load: number = -1;
    private num_check_banner_load: number = 0;
    private num_max_check_banner_load: number = 5;
    private num_banner_be_close: number = 0;
    private hasShowBanner: boolean = false;
    private timeout_refresh_banner: number = -1;
    private timestamp_last_hide_banner: number = 0;

    // system inters
    private systemIntersAd: any = null;
    private load_success_system_inters: boolean = false;
    private timestamp_last_hide_inters: number = 0;
    private num_inters_now_show: number = 0;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private hasShowVideo: boolean = false;
    private timeout_retry_load_video: number = -1;

    // desktop
    private num_desktop_auto_appear: number = 0;
    private number_inters_to_desktop: number = 0;

    // pay
    private payCallback: (res: object[]) => void;
    private isReLogin: boolean = false;
    private switch_pay: boolean = false;

    private systemInfo: { isStand: boolean, platform: string, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
        windowWidth: 0,
        windowHeight: 0
    };

    // 同步存档定时器
    private syncArchiveTimeout: number = -1;
    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 广告开关参数
    private switch_ad: object;


    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.checkUpdate();
        this.getSystemInfo();
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin();
        });
        this.addOnHideListener();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    checkUpdate(): void {
        // @ts-ignore
        let updateManager = qq.getUpdateManager();
        updateManager.onCheckForUpdate((res) => {
            // 请求完新版本信息的回调
            console.log(res.hasUpdate)
        });
        // @ts-ignore
        updateManager.onUpdateReady(() => {
            // @ts-ignore
            qq.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })
        });

        updateManager.onUpdateFailed(() => {
            // 新版本下载失败
        });
    }

    private addOnHideListener(): void {
        // @ts-ignore
        qq.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        callback({ ret: false, userInfo: {} });
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private onAppShow(): void {
        this.xLog("启用onShow监听");
        let reqNum: number = 0;
        let interval: number = -1;
        let reqFunc = () =>
            this.reqNotConsumeOrders((ret: boolean, res: object) => {
                this.xLog("reqNotConsumeOrders..." + ++reqNum);
                let orderList: object[] = [];
                if (ret && res["data"] && res["data"].length > 0) {
                    orderList = res["data"];
                    setTimeout(() => {
                        this.payCallback && this.payCallback(orderList);
                    }, 300);
                }
                if ((reqNum >= 3)) {
                    clearInterval(interval);
                    interval = -1;
                }
            });
        // @ts-ignore
        qq.onShow((res) => {
            reqNum = 0;
            reqFunc();
            if (interval != -1) return;
            interval = setInterval(reqFunc, 4000);
        })
    }

    private reqNotConsumeOrders(callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.NOT_CONSUME_LIST, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") }, {},
            (ret: boolean, res: object) => {
                callback(ret, res);
            });
    }

    private consumeOrder(orderNo: string): void {
        HttpRequest.getInstance().request(RequestUrl.CONSUME_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { orderNo: orderNo }, (ret: boolean, res: object) => {
                if (ret) {
                    this.xLog("orderNo:" + orderNo + " 订单完成");
                } else {
                    this.xLog("orderNo:" + orderNo + " 订单提交错误", JSON.stringify(res));
                }
            });
    }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = qq.getSystemInfoSync();
        this.systemInfo.platform = info.platform;
        this.loginParams["platformType"] = info.platform == "ios" ? "IOS" : "ANDROID";
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
    }

    private phasesCallbackToInitSdk(phases: string, res: object): void {
        if (this.isReLogin) return;
        this.initSdkPhasesCallback && this.initSdkPhasesCallback(phases, res);
    }

    private getInitContent(callback: (phases: string, res: object) => void): void {
        let gameChannelCodeNo: string = sdkConfig.gameChannelCodeNo;
        HttpRequest.getInstance().request(RequestUrl.INIT_CONTENT, "GET", { "content-type": "application/json" },
            { gameChannelCodeNo: gameChannelCodeNo }, (ret, res) => {
                this.xLog("getInitContent ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("getInitContentSuccess", res);
                } else {
                    callback("getInitContentFail", res);
                }
            });
    }

    private channelLogin(): void {
        // @ts-ignore
        qq.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["qq"]["jsCode"] = res["code"];
                    this.phasesCallbackToInitSdk("channelLoginSuccess", res);
                } else {
                    this.xLog("登录失败：", res);
                    this.loginParams["type"] = "GUEST";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                    this.phasesCallbackToInitSdk("channelLoginFail", res);
                }
                this.serverLogin();
            },
            fail: (res) => {
                this.xLog("登录失败：", res);
                this.loginParams["type"] = "GUEST";
                this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                this.serverLogin();
            }
        })
    }

    private serverLogin(): void {
        HttpRequest.getInstance().request(RequestUrl.SIGN_IN_URL, "POST", { "content-type": "application/json" }, this.loginParams, (ret: boolean, res: object) => {
            if (ret) {
                if (res && res["data"]["token"]) LocalStorage.setStringData("token", res["data"]["token"]);
                if (res && res["data"]["gameUserId"]) LocalStorage.setStringData("gameUserId", res["data"]["gameUserId"]);
                if (res && res["data"]["blockCity"]) {
                    EngineUtils.showToast("游戏暂停服务，维护中！");
                    return;
                }
                if (res && res["data"]["inBlacklist"]) {
                    let uid: string = res["data"]["uid"];
                    EngineUtils.showToast("您的账号：" + uid + " 已被永久封禁，如有疑问请联系客服QQ：3605292392");
                    return;
                }
                this.phasesCallbackToInitSdk("serverLoginSuccess", res);
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
            }
            this.reqAdParams();
        })
    }

    private reqAdParams(): void {
        HttpRequest.getInstance().request(RequestUrl.GAME_CONTENT, "GET", { "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { gameChannelCodeNo: sdkConfig.gameChannelCodeNo }, (ret: boolean, adParams: object) => {
                if (adParams) LocalStorage.setJsonData("adParams", adParams);
                if (ret) {
                    this.phasesCallbackToInitSdk("getAdParamsSuccess", adParams);
                } else {
                    this.phasesCallbackToInitSdk("getAdParamsFail", adParams);
                }
                this.parseAdParams();
            });
    }

    private parseAdParams(): void {
        let adParams: object = LocalStorage.getJsonData("adParams");
        if (!adParams || !adParams["data"]) {
            this.xLog("#####广告参数为空#####");
            this.phasesCallbackToInitSdk("createAdFail", adParams);
            return;
        }
        this.phasesCallbackToInitSdk("startCreateAd", adParams);
        if (!adParams["data"]["paymentStatus"] || !adParams["data"]["paymentAndroidStatus"]) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
        } else {
            if (this.loginParams["qq"]["jsCode"]) {
                this.switch_pay = true;
                this.onAppShow();
            } else {
                this.xLog("#####渠道登录未成功,不开启onShow监听#####");
            }
        }
        if (!adParams["data"]["adStatus"]) {
            this.xLog("#####广告总开关未开启#####");
            this.phasesCallbackToInitSdk("createAdFail", adParams);
            return;
        }

        let switch_ad: object = adParams["data"]["ad"];
        if (switch_ad) {
            this.switch_ad = switch_ad;
            this.switch_banner = switch_ad["banner"] ? switch_ad["banner"] : false;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_screen = switch_ad["screen"] ? switch_ad["screen"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
            this.id_screen = id_ad["screen"] ? id_ad["screen"] : "";
        }
        let params_banner_control: object = adParams["data"]["banner"];
        if (params_banner_control && params_banner_control["status"]) {
            this.time_banner_refresh = params_banner_control["refreshSeconds"] ?
                (params_banner_control["refreshSeconds"] <= 0 ?
                    30 : params_banner_control["refreshSeconds"]) : 30;
            this.num_banner_max_close = params_banner_control["maxCloseQty"] ?
                (params_banner_control["maxCloseQty"] <= 0 ?
                    999 : params_banner_control["maxCloseQty"]) : 999;
            this.time_close_show_interval = params_banner_control["loadIntervalSeconds"] ?
                (params_banner_control["loadIntervalSeconds"] <= 0 ?
                    0 : params_banner_control["loadIntervalSeconds"]) : 0;
        }
        let params_inters_control: object = adParams["data"]["screen"];
        if (params_inters_control && params_inters_control["status"]) {
            this.number_inters_start_show = params_inters_control["beginQty"] ?
                (params_inters_control["beginQty"] <= 0 ?
                    0 : params_inters_control["beginQty"]) : 0;
            this.num_inters_interval = params_inters_control["intervalQty"] ?
                (params_inters_control["intervalQty"] <= 0 ?
                    0 : params_inters_control["intervalQty"]) : 0;
            this.time_inters_interval = params_inters_control["intervalSeconds"] ?
                (params_inters_control["intervalSeconds"] <= 0 ?
                    0 : params_inters_control["intervalSeconds"]) : 0;
            this.probability_inters_delay = params_inters_control["delayRate"] ?
                (params_inters_control["delayRate"] <= 0 ?
                    0 : params_inters_control["delayRate"]) : 0;
            this.time_inters_delay = params_inters_control["delaySeconds"] ?
                (params_inters_control["delaySeconds"] <= 0 ?
                    0 : params_inters_control["delaySeconds"]) : 0;
        }
        let params_desktop: object = adParams["data"]["icon"];
        if (params_desktop && params_desktop["status"]) {
            if (params_desktop["tipIconStatus"]) {
                this.num_desktop_auto_appear = params_desktop["tipQty"] ?
                    (params_desktop["tipQty"] <= 0 ?
                        0 : params_desktop["tipQty"]) : 0;
            }
            this.number_inters_to_desktop = params_desktop["tipIndex"] ?
                (params_desktop["tipIndex"] <= 0 ?
                    0 : params_desktop["tipIndex"]) : 0;
        }

        let params_inters_more: object = adParams["data"]["screens"];
        if (params_inters_more && params_inters_more["status"]) {
            this.probability_inters = params_inters_more["screenRate"] ? params_inters_more["screenRate"] : 0;
            this.probability_native_inters = params_inters_more["screenNativeRate"] ? params_inters_more["screenNativeRate"] : 0;
            this.probability_native_template_inters = params_inters_more["screenNativeTemplateRate"] ? params_inters_more["screenNativeTemplateRate"] : 0;
            this.probability_video = params_inters_more["videoRate"] ? params_inters_more["videoRate"] : 0;
        }

        this.createAd();
    }

    private xLog(msg: string, msg2?: string): void {
        if (msg2) {
            console.log(TAG_CHANNEL, msg, msg2);
        }
        else {
            console.log(TAG_CHANNEL, msg);
        }
    }

    private createAd(): void {
        this.phasesCallbackToInitSdk("createAd", {});
        if (this.switch_banner && this.id_banner) {
            this.createSystemBanner();
        }
        if (this.switch_screen && this.id_screen) {
            this.createSystemInters();
        }
        if (this.switch_video && this.id_video) {
            this.createVideo();
        }
        setTimeout(() => {
            this.phasesCallbackToInitSdk("createAdFinish", {});
        }, 1000);
    }

    private createSystemBanner(): void {
        this.xLog("*****createSystemBanner*****");
        if (StringUtil.containSpace(this.id_banner)) {
            this.xLog("#####banner广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.bannerAd = qq.createBannerAd({
            adUnitId: this.id_banner,
            style: {
                left: 0,
                top: 0,
                width: this.systemInfo.isStand ? this.systemInfo.windowWidth : 400,//iOS似乎无法通过onResize重设banner宽高
                height: 120
            },
            testDemoType: "65"
        });
        this.bannerAd.onResize((size) => {
            this.bannerAd.style.width = this.systemInfo.isStand ? this.systemInfo.windowWidth : this.systemInfo.windowWidth * 0.5;
            this.bannerAd.style.height = this.systemInfo.isStand ? this.systemInfo.windowWidth : this.systemInfo.windowWidth * 0.5;
            this.bannerAd.style.top = this.systemInfo.windowHeight - size.height;
            this.bannerAd.style.left = (this.systemInfo.windowWidth - size.width) * 0.5;
        });
        this.bannerAd.onLoad(() => {
            this.xLog("@@@@@banner广告加载成功@@@@@");
            this.load_success_system_banner = true;
            if (this.hasShowBanner) {
                this.showSystemBanner();
            }
        });
        this.bannerAd.onError((err) => {
            this.xLog("#####banner广告加载失败#####", JSON.stringify(err));
        });
    }

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_screen)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.systemIntersAd = qq.createInterstitialAd({
            adUnitId: this.id_screen
        });
        this.systemIntersAd.onLoad(() => {
            this.xLog("@@@@@系统插屏广告加载成功@@@@@")
            this.load_success_system_inters = true
        });
        this.systemIntersAd.onError((err) => {
            this.xLog("#####系统插屏广告加载失败#####", JSON.stringify(err));
            this.load_success_system_inters = false;
            setTimeout(() => {
                this.systemIntersAd && this.systemIntersAd.load()
            }, 30 * 1000)
        });
        this.systemIntersAd.onClose(() => {
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
        });
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = qq.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.videoAd.onLoad(() => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
        });
        this.videoAd.onError((err) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(err));
            this.load_success_video = false;
            setTimeout(() => {
                this.videoAd && this.videoAd.load()
            }, 30 * 1000)
        });
        this.videoAd.onClose((res) => {
            setTimeout(() => {
                if (res.isEnded) {
                    this.xLog("视频广告播放完成");
                    if (this.showVideoPhasesCallback) {
                        this.showVideoPhasesCallback("videoPlayFinish", {});
                        this.videoAd.load();
                    }
                } else {
                    this.xLog("视频广告取消播放");
                    if (this.showVideoPhasesCallback) {
                        this.showVideoPhasesCallback("videoPlayBreak", {});
                        this.videoAd.load();
                    }
                }
            }, 500);
        });
        this.videoAd.load();
    }

    private refreshBanner(): void {
        if (this.timeout_refresh_banner != -1) {
            clearInterval(this.timeout_refresh_banner);
            this.timeout_refresh_banner = -1;
        }
        this.timeout_refresh_banner =
            setInterval(() => {
                this.xLog("refreshBanner");
                this.bannerAd && this.bannerAd.destroy();
                this.bannerAd = null;
                this.createSystemBanner();
            }, this.time_banner_refresh * 1000);
    }

    private checkBannerLoad(): void {
        this.load_success_banner = this.load_success_system_banner;
        this.xLog("banner加载成功?:" + this.load_success_banner, ++this.num_check_banner_load + "");
        if (this.timeout_check_banner_load != -1) {
            clearTimeout(this.timeout_check_banner_load);
            this.timeout_check_banner_load = -1;
        }
        if (this.load_success_banner) {
            this.interiorShowBanner();
        } else {
            if (this.num_check_banner_load >= this.num_max_check_banner_load) return;
            this.timeout_check_banner_load =
                setTimeout(() => {
                    this.checkBannerLoad();
                }, 5 * 1000);
        }
    }

    private interiorShowBanner(): void {
        this.showBanner({}, this.showBannerPhasesCallback);
    }

    private showSystemBanner(): void {
        if (this.bannerAd && this.load_success_system_banner) {
            this.xLog("showSystemBanner");
            this.bannerAd.show();
        }
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        if (callback) this.showBannerPhasesCallback = callback;
        if (!this.load_success_banner) {
            this.checkBannerLoad();
            return;
        }

        if (this.num_banner_max_close > 0 && this.num_banner_be_close >= this.num_banner_max_close) {
            this.xLog("banner已达到最大关闭次数" + this.num_banner_max_close);
            if (this.timeout_refresh_banner != -1) {
                clearInterval(this.timeout_refresh_banner);
                this.timeout_refresh_banner = -1;
            }
            return;
        }
        if (this.time_close_show_interval > 0 && (new Date().getTime() - this.timestamp_last_hide_banner < this.time_close_show_interval * 1000)) {
            this.xLog("banner关闭展示间隔未达到,当前关闭展示间隔:" + (new Date().getTime() - this.timestamp_last_hide_banner) / 1000 + ",banner关闭展示间隔时间:" + this.time_close_show_interval);
            return;
        }

        if (this.hasShowBanner) return;
        this.hasShowBanner = true;

        this.showSystemBanner();
        this.refreshBanner();
    }

    private hideSystemBanner(): void {
        if (this.bannerAd && this.hasShowBanner) {
            this.xLog("hideSystemBanner");
            this.bannerAd.hide();
        }
    }

    hideBanner(): void {
        this.hideSystemBanner();
        this.hasShowBanner = false;
        if (this.timeout_refresh_banner != -1) {
            clearInterval(this.timeout_refresh_banner);
            this.timeout_refresh_banner = -1;
        }
        if (this.timeout_check_banner_load != -1) {
            clearTimeout(this.timeout_check_banner_load);
            this.timeout_check_banner_load = -1;
        }
    }

    private showSystemInters(): void {
        if (this.systemIntersAd && this.load_success_system_inters) {
            this.xLog("showSystemInters");
            this.systemIntersAd.show();
        }
    }

    getIntersFlag(): boolean {
        return this.load_success_system_inters;
    }

    private intersPhasesCallback(phases: string): void {
        if (this.showIntersPhasesCallback) this.showIntersPhasesCallback(phases, {});
    }

    private isAttainIntersLimit(): boolean {
        // 未达到插屏开始次数
        if (!this.hasAttachIntersStart) {
            // 开始展示次数大于0
            if (this.number_inters_start_show > 0) {
                if (this.num_inters_now_show >= this.number_inters_start_show) {
                    this.hasAttachIntersStart = true;
                    return true;
                } else {
                    this.xLog("插屏开始次数未达到,当前次数:" + this.num_inters_now_show + ",插屏开始次数:" + this.number_inters_start_show);
                    this.intersPhasesCallback("intersShowFail");
                    return false;
                }
            } else {
                this.hasAttachIntersStart = true;
            }
        }

        if (this.num_inters_interval > 0 && this.num_inters_now_interval < this.num_inters_interval) {
            this.num_inters_now_interval++;
            this.xLog("插屏间隔次数未达到,当前次数:" + this.num_inters_now_interval + ",插屏间隔次数:" + this.num_inters_interval);
            this.intersPhasesCallback("intersShowFail");
            return false;
        }
        if (new Date().getTime() - this.timestamp_last_hide_inters < this.time_inters_interval * 1000) {
            this.xLog("插屏间隔时间未达到,当前时间:" + (new Date().getTime() - this.timestamp_last_hide_inters) / 1000 + ",插屏间隔时间:" + this.time_inters_interval);
            this.intersPhasesCallback("intersShowFail");
            return false;
        }
        this.num_inters_now_interval = 0;
        return true;
    }

    showInters(params?: object, callback?: (phases: string, res: object) => void): void {
        if (callback) this.showIntersPhasesCallback = callback;
        else this.showIntersPhasesCallback = null;
        if (!this.getIntersFlag()) {
            this.intersPhasesCallback("intersNotLoad");
            return;
        }
        this.num_inters_now_show++;
        if (!this.isAttainIntersLimit()) {
            return;
        }

        if (this.probability_inters_delay > 0 && this.time_inters_delay > 0) {
            let ran: number = Math.random() * 100;
            if (ran < this.probability_inters_delay) {
                setTimeout(() => {
                    this.showSystemInters();
                }, this.time_inters_delay);
            } else {
                this.showSystemInters();
            }
        } else {
            this.showSystemInters();
        }
    }

    getVideoFlag(): boolean {
        return this.load_success_video;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        this.showVideoPhasesCallback = callback;
        if (!this.getVideoFlag()) {
            callback("videoNotLoad", {});
            return;
        }
        if (this.videoAd) {
            callback = callback;
            this.load_success_video = false;
            this.videoAd.show()
                .then(() => {
                    this.xLog("激励视频广告展示成功");
                })
                .catch((err) => {
                    this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
                    // 可以手动加载一次
                    this.videoAd.load().then(() => {
                        this.xLog("@@@@@激励视频广告手动加载成功@@@@@");
                        // 加载成功后需要再显示广告
                        this.videoAd.show().catch((err) => {
                            this.xLog("@@@@@激励视频广告手动加载展示失败@@@@@");
                            callback("videoPlayBreak", {});
                        });
                    }).catch((err) => {
                        this.xLog("#####激励视频广告手动加载失败#####", JSON.stringify(err));
                        callback("videoPlayBreak", {});
                        this.videoAd.load();
                    });
                });
        } else {
            callback("videoPlayBreak", {});
        }
    }

    getNativeIconFlag(): boolean {
        return false;
    }

    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
    }

    hideNativeIcon(): void {
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
        if (type == "long") {
            // @ts-ignore
            qq.vibrateLong({
                success: (res) => {
                },
                fail: (res) => {
                    this.xLog("vibrateLong fail" + JSON.stringify(res));
                }
            });
        } else {
            // @ts-ignore
            qq.vibrateShort({
                success: (res) => {
                },
                fail: (res) => {
                    this.xLog("vibrateShort fail" + JSON.stringify(res));
                }
            });
        }
    }

    shareApp(): void {
    }

    private preMidasOrder(productExternalId: string, callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.QQ_PRE_ORDER_MIDAS, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                this.xLog("preMidasOrder ret:" + ret + " res:" + JSON.stringify(res));
                callback(ret, res);
            })
    }

    private preJsPayOrder(productExternalId: string, callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.QQ_PRE_ORDER_JSPAY, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                this.xLog("preJsPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                callback(ret, res);
            })
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.switch_pay) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
            callback("payError", { msg: CallbackMsg.PAY_SWITCH_NOT_ENABLE });
            return;
        }
        if (!this.loginParams["qq"]["jsCode"]) {
            this.xLog(CallbackMsg.USER_NOT_LOGIN.toString());
            callback("payError", { msg: CallbackMsg.USER_NOT_LOGIN });
            this.isReLogin = true;
            this.channelLogin();
            return;
        }
        let productExternalId: string = params["productExternalId"];
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // 预下单
        if (this.systemInfo.platform === "android") {
            this.preMidasOrder(productExternalId, (ret: boolean, res: object) => {
                // 下单成功
                if (ret && res && res["data"] && res["data"]["prepayId"] && res["data"]["starCurrency"]) {
                    // @ts-ignore
                    qq.requestMidasPayment({
                        prepayId: res["data"]["prepayId"],
                        starCurrency: res["data"]["starCurrency"],
                        setEnv: 0,
                        success: (res0) => {
                            this.xLog("requestMidasPayment pay success:" + JSON.stringify(res0));
                            callback("orderPayFinish", {});
                        },
                        fail: (res0) => {
                            this.xLog("requestMidasPayment pay fail:" + JSON.stringify(res0));
                            callback("orderPayFail", res0);
                        }
                    })
                } else {
                    callback("preOrderFail", res);
                }
            });
        } else {
            this.preJsPayOrder(productExternalId, (ret: boolean, res: object) => {
                // 下单成功
                if (ret && res["data"] && res["data"]["url"]) {
                    // @ts-ignore
                    qq.setClipboardData({ data: res["data"]["url"] })
                    // @ts-ignore
                    qq.showModal({
                        title: "下单成功",
                        content: "链接已复制，请粘贴到微信聊天后点击支付",
                        showCancel: false,
                    })
                } else {
                    callback("preOrderFail", res);
                }
            });
        }
    }

    orderComplete(orderNo: string): void {
        this.consumeOrder(orderNo);
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        let platform: string = this.systemInfo.platform === "android" ? "ANDROID" : "IOS";
        HttpRequest.getInstance().request(RequestUrl.GIFT_EXCHANGE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { exchangeCode: exchangeCode, platform: platform }, (ret, res) => {
                this.xLog("giftExchange ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("giftExchangeSuccess", res);
                } else {
                    callback("giftExchangeFail", res);
                }
            });
    }

    getArchive(params: object, callback: (phases: string, res: object) => void): void {
        let versionCode = params["versionCode"] ? params["versionCode"] : 0;
        if (typeof versionCode === "string") {
            versionCode = isNaN(Number(versionCode)) ? 0 : Number(versionCode);
        }
        HttpRequest.getInstance().request(RequestUrl.GET_ARCHIVE, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { version: versionCode }, (ret, res) => {
                this.xLog("getArchive ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("getArchiveSuccess", res);
                } else {
                    callback("getArchiveFail", res);
                }
            });
    }

    setArchive(params: object, callback: (phases: string, res: object) => void): void {
        // // 500毫秒内已存在同步存档请求
        // if (this.syncArchiveTimeout != -1) {
        //     if (this.lastSyncArchiveCallback != null) {
        //         this.lastSyncArchiveCallback("setArchiveSuccess", { msg: "存在重复请求，响应上一次同步存档成功" });
        //         this.lastSyncArchiveCallback = callback;
        //     }
        //     // 清理定时器
        //     clearTimeout(this.syncArchiveTimeout);
        //     this.syncArchiveTimeout = -1;
        //     // 延时调用
        //     this.syncArchiveTimeout =
        //         setTimeout(() => {
        //             this.doSyncArchive(params, callback);
        //             this.syncArchiveTimeout = -1;
        //         }, 500);
        // } else {
        //     // 保留之前的最后一次回调
        //     this.lastSyncArchiveCallback = callback;
        //     // 不存在
        //     this.syncArchiveTimeout =
        //         setTimeout(() => {
        //             this.doSyncArchive(params, callback);
        //             this.syncArchiveTimeout = -1;
        //         }, 500);
        // }

        // 3.0版本存档接口优化
        // 没有params或者params中没有sdkCall字段，则跳过这次同步存档接口直接返回成功
        if (!params || !params["sdkCall"]) {
            this.lastSyncArchiveParams = params;
            if (callback) {
                callback("setArchiveSuccess", {
                    "succeed": true, "code": 0, "codeMsg": "string", "data": {}
                });
            }
            return;
        }

        let versionCode = params["versionCode"] ? params["versionCode"] : 0;
        let archive: string = params["archive"] ? params["archive"] : "";
        if (typeof versionCode === "string") {
            versionCode = isNaN(Number(versionCode)) ? 0 : Number(versionCode);
        }
        HttpRequest.getInstance().request(RequestUrl.SYNC_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { version: versionCode, archive: archive }, (ret, res) => {
                this.xLog("setArchive ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    if (callback) callback("setArchiveSuccess", res);
                } else {
                    if (callback) callback("setArchiveFail", res);
                }
            });
    }

    doSyncArchive(params: object, callback: (phases: string, res: object) => void): void {
        let versionCode = params["versionCode"] ? params["versionCode"] : 0;
        let archive: string = params["archive"] ? params["archive"] : "";
        if (typeof versionCode === "string") {
            versionCode = isNaN(Number(versionCode)) ? 0 : Number(versionCode);
        }
        HttpRequest.getInstance().request(RequestUrl.SYNC_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { version: versionCode, archive: archive }, (ret, res) => {
                this.xLog("setArchive ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("setArchiveSuccess", res);
                } else {
                    callback("setArchiveFail", res);
                }
            });
    }

    clearArchive(): void {
        HttpRequest.getInstance().request(RequestUrl.CLEAR_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            {}, (ret, res) => {
                this.xLog("clearArchive ret:" + ret + " res:" + JSON.stringify(res));
            });
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
        let rankId: string = params["rankId"];
        let maxRank: number = params["maxRank"];
        let groupId: string = params["groupId"];
        let rankCategory: string = params["rankCategory"] ? params["rankCategory"] : "";


        if (!rankCategory) {
            let reqData: object = { rankId: rankId, maxRank: maxRank, groupId: groupId };
            HttpRequest.getInstance().request(RequestUrl.GET_RANK_DATA, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                reqData, (ret, res) => {
                    this.xLog("getRankData ret:" + ret + " res:" + JSON.stringify(res));
                    if (ret) {
                        callback("getRankDataSuccess", res);
                    } else {
                        callback("getRankDataFail", res);
                    }
                });
        } else {
            let reqData: object = { rankId: rankId, rankCategory: rankCategory, maxRank: maxRank, groupId: groupId };
            HttpRequest.getInstance().request(RequestUrl.GET_RANK_DATA_V2, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                reqData, (ret, res) => {
                    this.xLog("getRankData ret:" + ret + " res:" + JSON.stringify(res));
                    if (ret) {
                        callback("getRankDataSuccess", res);
                    } else {
                        callback("getRankDataFail", res);
                    }
                });
        }
    }

    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        let rankId: string = params["rankId"];
        let score: number = params["score"];
        let groupId: string = params["groupId"];
        let extra: string = params["extra"];
        let rankCategory: string = params["rankCategory"] ? params["rankCategory"] : "";

        if (!rankCategory) {
            let reqData: object = { rankId: rankId, score: score, groupId: groupId, extra: extra };
            HttpRequest.getInstance().request(RequestUrl.UPLOAD_USER_RANK_DATA, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                reqData, (ret, res) => {
                    this.xLog("uploadUserRankData ret:" + ret + " res:" + JSON.stringify(res));
                    if (ret) {
                        callback("uploadUserRankDataSuccess", res);
                    } else {
                        callback("uploadUserRankDataFail", res);
                    }
                });
        } else {
            let reqData: object = { rankId: rankId, score: score, groupId: groupId, rankCategory: rankCategory, extra: extra };
            HttpRequest.getInstance().request(RequestUrl.UPLOAD_USER_RANK_DATA_V2, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                reqData, (ret, res) => {
                    this.xLog("uploadUserRankData ret:" + ret + " res:" + JSON.stringify(res));
                    if (ret) {
                        callback("uploadUserRankDataSuccess", res);
                    } else {
                        callback("uploadUserRankDataFail", res);
                    }
                });
        }
    }

    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        callback("getRawDataSignatureFail", {});
    }

    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        callback("decryptionDataFail", {});
    }

    getGameJson(params: object, callback: (phases: string, res: object) => void): void {
        let matchVersion: string = params["matchVersion"];
        let debugFlag: string = params["debugFlag"];
        let gameChannelCodeNo: string = params["gameChannelCodeNo"];
        if (!gameChannelCodeNo) {
            gameChannelCodeNo = sdkConfig.gameChannelCodeNo;
        }
        let reqData: object = {
            matchVersion: matchVersion,
            debugFlag: debugFlag ? debugFlag : "N",
            gameChannelCodeNo: gameChannelCodeNo,
        }
        HttpRequest.getInstance().request(RequestUrl.GAME_JSON, "GET", { "content-type": "application/json" },
            reqData, (ret, res) => {
                this.xLog("getGameJson ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("getGameJsonSuccess", res);
                } else {
                    callback("getGameJsonFail", res);
                }
            });
    }

    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void {
        let taskId: string = params["taskId"];
        let fromUid: string = params["fromUid"];
        let ext: string = params["ext"];
        HttpRequest.getInstance().request(RequestUrl.UPLOAD_SHARE_TASK, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { taskId: taskId, fromUid: fromUid, ext: ext }, (ret, res) => {
                this.xLog("uploadShareTask ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("uploadShareTaskSuccess", res);
                } else {
                    callback("uploadShareTaskFail", res);
                }
            });
    }

    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        let taskId: string = params["taskId"];
        HttpRequest.getInstance().request(RequestUrl.GET_SHARE_TASK_DETAIL, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { taskId: taskId }, (ret, res) => {
                this.xLog("getShareTaskDetail ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("getShareTaskDetailSuccess", res);
                } else {
                    callback("getShareTaskDetailFail", res);
                }
            });
    }

    isNextVideoFitShare(): boolean {
        return false;
    }

    getRewardBoxFlag(): boolean {
        return false;
    }

    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        callback("showRewardBoxBreak", {});
    }

    getVideoCLFlag(): boolean {
        return false;
    }

    getABInfoByName(name: string): object {
        return {};
    }

    getAdSwitchByKey(key: string): boolean {
        if (this.switch_ad) {
            return this.switch_ad[key];
        }
        return false;
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {

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
        callback(true);
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        qq.saveAppToDesktop({
            success: () => {
                this.xLog("QQ 创建桌面图标成功")
                // 执行用户创建图标奖励
                callback(true);
            },
            fail: (err) => {
                this.xLog("QQ 创建桌面图标失败：", JSON.stringify(err));
                callback(false);
            },
            complete: () => { }
        });
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
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {

    }
}