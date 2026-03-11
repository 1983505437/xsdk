import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import PrivacyAgreement from "../utils/PrivacyAgreement";
import RewardBox from "../utils/RewardBox";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Vivo";
/*
 * @Author: Vae 
 * @Date: 2023-10-31 15:26:58 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-06-11 09:30:57
 */
export default class VivoSdk implements IXSdk {

    private useNormalLogin: boolean = false;
    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "type": "USER",
        "guestGameUserId": "",
        "vivo": {
            "token": ""
        }
    }

    private initSdkPhasesCallback: (phases: string, res: object) => void;
    private showBannerPhasesCallback: (phases: string, res: object) => void;
    private showIntersPhasesCallback: ((phases: string, res: object) => void) | null;
    private showVideoPhasesCallback: (phases: string, res: object) => void;

    // 广告开关
    private switch_banner: boolean = false;
    private switch_inters: boolean = false;
    private switch_video: boolean = false;
    private switch_float_banner: boolean = false;
    private switch_native_template_inters: boolean = false;
    private switch_native_inters: boolean = false;
    private switch_native_big: boolean = false;

    // 广告id
    private id_banner: string = "";
    private id_native_template_inters: string = "";
    private id_native_inters: string = "";
    private id_inters: string = "";
    private id_video: string = "";
    private id_float_banner: string = "";
    private id_native_big: string = "";

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

    // force 强弹广告
    private switch_force: boolean = false;
    private num_force_start: number = 1;
    private num_force_max: number = 0;
    private time_first_force_delay: number = 30;
    private time_force_interval: number = 30;
    private forceType: string = "SCREEN";

    // 激励盒子
    private switch_reward: boolean = false;
    private num_reward_start: number = 0;
    private num_reward_max: number = 0;
    private time_reward_interval: number = 0;

    // 视频误点
    private switch_video_cl: boolean = false;
    private time_video_cl_st: number = 0;
    private time_video_cl_it: number = 0;
    private num_video_cl_r: number = 0;

    // 特殊配置
    private switch_attribution: boolean = false;

    // 切入切出控制
    private switch_inout: boolean = false;
    private probability_inout_inters: number = 0;
    private probability_inout_template_inters: number = 100;
    private probability_inout_native_inters: number = 0;
    private probability_inout_video: number = 0;
    private number_inout_start_show: number = 0;
    private num_inout_interval: number = 0;
    private time_inout_interval: number = 0;

    // -------------------------------↑服务端参数--↓本地参数--------------------------------

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
    private isShowSystemBanner: boolean = false;
    private timeout_refresh_banner: number = -1;
    private timeout_delay_show_system_banner: number = -1;
    private timestamp_last_hide_banner: number = 0;

    // system inters
    private systemIntersAd: any = null;
    private load_success_system_inters: boolean = false;
    private num_system_inters_load_error: number = 0;
    private isShowSystemInters: boolean = false;

    // native template inters
    private nativeTemplateIntersAd: any = null;
    private load_success_native_template_inters: boolean = false;
    private timestamp_last_hide_inters: number = 0;
    private num_inters_now_show: number = 0;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;
    private isShowNativeTemplateInters: boolean = false;
    private time_native_template_inters_load_fail: number = -1;
    private timeout_reload_native_template_inters: number = -1;

    // native template inters2
    private nativeTemplateIntersAd2: any = null;

    // floatBanner
    private floatBannerAd: any = null;
    private load_success_float_banner: boolean = false;
    private isShowFloatBanner: boolean = false;
    private timeout_retry_load_float_banner: number = -1;
    private floatBannerAdParams: any;
    private timeout_refresh_float_banner: number = -1;
    private time_float_banner_refresh: number = 30;
    private ready2Show_float_banner: boolean = false;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private isShowVideo: boolean = false;
    private timeout_retry_load_video: number = -1;

    // force
    private time_now_force: number = 0;
    private num_now_force: number = 0;
    private achieveFirstForce: boolean = false;

    // 激励盒子
    private time_now_reward: number = 999;
    private num_now_reward: number = 0;
    private achieveFirstReward: boolean = false;

    // 视频误点
    private achieveFirstVc: boolean = false;
    private time_last_vc: number = 0;

    // 切入切出
    private num_now_inout: number = 0;
    private num_now_inout_interval: number = 0;
    private time_now_inout_interval: number = 999;
    private achieveFirstInout: boolean = false;

    // desktop
    private num_desktop_auto_appear: number = 0;
    private number_inters_to_desktop: number = 0;

    // pay
    private payCallback: (res: object[]) => void;
    private isReLogin: boolean = false;
    private switch_pay: boolean = false;
    private payResultCallback: any;
    private completeOrders: string[] = [];
    private tryReqNotConsumeOrdersIntervalId: number = -1;
    private tryReqNotConsumeOrdersTimes: number = 0;

    private systemInfo: { isStand: boolean, platformVersionCode: number, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platformVersionCode: 1060,
        windowWidth: 0,
        windowHeight: 0
    };
    private userInfo: object;

    // 同步存档定时器
    private syncArchiveTimeout: number = -1;
    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 是否是自然量
    private isNaturalFlow: boolean = false;

    // 进入游戏时的时间戳
    private time_into_game: number = 0;

    // 广告开关参数
    private switch_ad: object;


    private runPerSecond(): void {
        setInterval(() => {
            if (this.time_native_template_inters_load_fail >= 0) {
                this.time_native_template_inters_load_fail++;
                if (this.time_native_template_inters_load_fail > 10) {
                    this.createNativeTemplateInters();
                }
            }
            this.doForceHandle();
            this.doAutoShowFloatBanner();
            this.time_now_reward++;
            this.time_now_inout_interval++;
        }, 1000);
    }

    private doForceHandle(): void {
        // 未开启强弹开关
        if (!this.switch_force) {
            return;
        }
        // 判断强弹是否达到最大次数
        if (this.num_force_max > 0 && this.num_now_force >= this.num_force_max) {
            return;
        }
        this.time_now_force++;
        // 是否已达到首次强弹
        if (!this.achieveFirstForce) {
            // 是否达到首次强弹时间
            if (this.time_now_force < this.time_first_force_delay) {
                return;
            }
            this.achieveFirstForce = true;
            this.time_now_force = 0;
            this.num_now_force++;
            // 是否达到强弹开始次数
            if (this.num_force_start > 1) {
                return;
            }
            this.showAdByForce();
            return;
        }
        // 是否达到间隔时间
        if (this.time_now_force < this.time_force_interval) {
            return;
        }
        // 是否达到强弹开始次数
        this.num_now_force++;
        if (this.num_force_start > 1 && this.num_now_force < this.num_force_start) {
            this.time_now_force = 0;
            return;
        }
        this.time_now_force = 0;
        this.showAdByForce();
    }

    private doAutoShowFloatBanner(): void {
        if (!this.switch_float_banner || !this.id_float_banner) {
            return;
        }
        if (this.isShowFloatBanner) {
            return;
        }
        this.showFloatBanner();
    }

    private showAdByForce(): void {
        switch (this.forceType) {
            case "SCREEN":
                this.xLog("show inters by force");
                this.getIntersFlag() && this.showInters();
                break;
            // case "VIDEO":
            //     this.getVideoFlag() && this.showVideo({}, (phases, res) => { });
            //     break;
        }
    }

    private onShowListener(): void {
        // @ts-ignore
        qg.onShow(() => {
            this.doInout();
        });
    }

    private getShowInterTypeByInoutSetting(): string {
        let canShowType: string[] = [];
        if (this.load_success_native_template_inters && this.probability_inout_template_inters > 0) {
            canShowType.push("nativeTemplateInters");
        }
        if (this.load_success_system_inters && this.probability_inout_inters > 0) {
            canShowType.push("inters");
        }
        if (canShowType.length == 0) {
            return "";
        }
        if (canShowType.length == 1) {
            this.xLog("inters type:" + canShowType[0]);
            return canShowType[0];
        }

        // 生成随机数
        let random: number = Math.floor(Math.random() * 100);
        let temp = 0;
        this.xLog("inters type random:" + random);
        for (let i = 0; i < canShowType.length; i++) {
            temp += this.getPByType(canShowType[i]);
            if (random < temp) {
                this.xLog("inters type:" + canShowType[i]);
                return canShowType[i];
            }
        }
        this.xLog("inters type:" + canShowType[0]);
        return canShowType[0];
    }

    private doInout(): void {
        if (!this.switch_inout) return;
        this.num_now_inout++;
        if (this.num_now_inout < this.number_inout_start_show) {
            this.xLog("未达到切入切出开始次数");
            return;
        }
        if (this.time_inout_interval > 0 && this.time_now_inout_interval < this.time_inout_interval) {
            this.xLog("未达到切入切出间隔时间");
            return;
        }
        // 达到首次强弹 判断间隔次数
        if (this.achieveFirstInout) {
            if (this.num_now_inout_interval < this.num_inout_interval) {
                this.num_now_inout_interval++;
                this.xLog("未达到切入切出间隔次数");
                return
            }
        }
        this.num_now_inout_interval = 0;
        this.achieveFirstInout = true;
        this.time_now_inout_interval = 0;
        this.showIntersAdByType(this.getShowInterTypeByInoutSetting());
        this.xLog("show inters by inout");
    }

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.time_into_game = new Date().getTime();
        if (callback) this.initSdkPhasesCallback = callback;
        if (params) this.useNormalLogin = params["useNormalLogin"];
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin();
        })
        this.getSystemInfo();
        this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
        this.runPerSecond();
        this.onShowListener();
        this.addOnHideListener();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        qg.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    getUserInfo(callback: (userInfo: { ret: boolean, userInfo: object }) => void): void {
        if (this.userInfo) {
            callback && callback({ ret: true, userInfo: this.userInfo });
            return;
        }
        // @ts-ignore
        qg.login().then((res) => {
            if (res && res["data"] && res["data"]["token"]) {
                // 使用token进行服务端对接
                this.loginParams["vivo"]["token"] = res["data"]["token"];
                this.loginParams["type"] = "USER";
                this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                this.switch_pay = true;
                HttpRequest.getInstance().request(RequestUrl.SIGN_IN_URL, "POST", { "content-type": "application/json" }, this.loginParams, (ret: boolean, res: object) => {
                    if (ret) {
                        if (res && res["data"]["token"]) LocalStorage.setStringData("token", res["data"]["token"]);
                        if (res && res["data"]["gameUserId"]) LocalStorage.setStringData("gameUserId", res["data"]["gameUserId"]);
                        this.userInfo = res["data"];
                    }
                    callback && callback({ ret: ret, userInfo: this.userInfo });
                });
            } else {
                this.xLog("渠道登录失败", JSON.stringify(res));
                callback && callback({ ret: false, userInfo: this.userInfo });
            }
        }, (err) => {
            this.xLog("渠道登录失败", JSON.stringify(err));
            callback && callback({ ret: false, userInfo: this.userInfo });
        });
    }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = qg.getSystemInfoSync();
        this.systemInfo.platformVersionCode = info.platformVersionCode;
        this.systemInfo.windowWidth = Number(info.screenWidth);
        this.systemInfo.windowHeight = Number(info.screenHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
        if (info.platformVersionCode < 1102) {
            this.xLog("当前平台版本不支持获取游戏冷启动参数");
            return;
        }
        // @ts-ignore
        let startupParams = qg.getLaunchOptionsSync();
        this.xLog("startupParams:" + JSON.stringify(startupParams));
        if (!startupParams || !startupParams.query || startupParams.query.type != "deeplink") {
            this.isNaturalFlow = true;
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
        if (this.useNormalLogin) {
            this.xLog("vivo使用正式登录.");
            // @ts-ignore
            qg.login().then((res) => {
                if (res && res["data"] && res["data"]["token"]) {
                    // 使用token进行服务端对接
                    this.loginParams["vivo"]["token"] = res["data"]["token"];
                    this.loginParams["type"] = "USER";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                    this.serverLogin(null, null);
                } else {
                    this.xLog("渠道登录失败", JSON.stringify(res));
                }
            }, (err) => {
                this.xLog("渠道登录失败", JSON.stringify(err));
            });
            return;
        }
        this.xLog("vivo默认启用游客登录.");
        this.loginParams["type"] = "GUEST";
        this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
        this.phasesCallbackToInitSdk("channelLoginFail", { msg: "vivo默认启用游客登录" });
        this.serverLogin(null, null);
    }

    private reLogin(cbSuccess, cbFailure): void {
        this.xLog("vivo内购游戏重登录");
        // @ts-ignore
        qg.login().then((res) => {
            if (res && res["data"] && res["data"]["token"]) {
                // 使用token进行服务端对接
                this.loginParams["vivo"]["token"] = res["data"]["token"];
                this.loginParams["type"] = "USER";
                this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                this.switch_pay = true;
                this.serverLogin(() => {
                    //服务端登录成功
                    cbSuccess && cbSuccess();
                    this.tryReqNotConsumeOrders();
                }, () => {
                    //服务端登录失败
                    cbFailure && cbFailure();
                });
            } else {
                this.xLog("渠道登录失败", JSON.stringify(res));
                if (cbFailure) {
                    cbFailure();
                }
            }
        }, (err) => {
            this.xLog("渠道登录失败", JSON.stringify(err));
            if (cbFailure) {
                cbFailure();
            }
        });
    }

    private serverLogin(cbSuccess, cbFailure): void {
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
                this.userInfo = res["data"];
                this.phasesCallbackToInitSdk("serverLoginSuccess", res);
                if (cbSuccess) {
                    cbSuccess();
                }
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
                if (cbFailure) {
                    cbFailure();
                }
            }
            if (!this.isReLogin) this.reqAdParams();
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
        if (!adParams["data"]["paymentStatus"]) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
        } else {
            if (this.loginParams["vivo"]["token"]) {
                this.switch_pay = true;
                //尝试补单
                this.tryReqNotConsumeOrders();
            } else {
                this.isReLogin = true;
                this.reLogin(null, null);
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
            let priClToVd = switch_ad["iconNative"] ? "1" : "0";
            LocalStorage.setStringData("priClToVd", priClToVd);
            this.switch_banner = switch_ad["banner"] ? switch_ad["banner"] : false;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_inters = switch_ad["screen"] ? switch_ad["screen"] : false;
            this.switch_native_template_inters = switch_ad["screenNativeTemplate"] ? switch_ad["screenNativeTemplate"] : false;
            this.switch_native_inters = switch_ad["screenNative"] ? switch_ad["screenNative"] : false;
            this.switch_float_banner = switch_ad["floatBanner"] ? switch_ad["floatBanner"] : false;
            this.switch_native_big = switch_ad["imgNativeLarge"] ? switch_ad["imgNativeLarge"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
            this.id_inters = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_float_banner = id_ad["floatBanner"] ? id_ad["floatBanner"] : "";
            this.id_native_template_inters = id_ad["screenNativeTemplate"] ? id_ad["screenNativeTemplate"] : "";
            this.id_native_inters = id_ad["screenNative"] ? id_ad["screenNative"] : "";
            if (this.id_native_template_inters != "" && this.id_native_inters != "") {
                let allIdStr: string = this.id_native_template_inters + ";" + this.id_native_inters;
                let ids: string[] = allIdStr.split(";");
                let randomIndex: number = Math.floor(Math.random() * ids.length);
                this.id_native_template_inters = ids[randomIndex];
                this.id_native_inters = ids.splice(randomIndex, 1).join(";");
            }
            this.id_native_big = id_ad["imgNativeLarge"] ? id_ad["imgNativeLarge"] : "";
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
        let params_force: object = adParams["data"]["force"];
        if (params_force && params_force["status"]) {
            this.switch_force = true;
            this.time_first_force_delay = params_force["firstDelaySeconds"] ?
                (params_force["firstDelaySeconds"] <= 0 ?
                    30 : params_force["firstDelaySeconds"]) : 30;
            this.time_force_interval = params_force["intervalSeconds"] ?
                (params_force["intervalSeconds"] <= 0 ?
                    30 : params_force["intervalSeconds"]) : 30;
            this.forceType = params_force["type"] ?
                params_force["type"] : "SCREEN";
            this.num_force_start = params_force["beginQty"] ?
                params_force["beginQty"] : 0;
            this.num_force_max = params_force["maxQty"] ?
                params_force["maxQty"] : 0;
            this.achieveFirstForce = this.time_first_force_delay == 0;
        }
        let params_reward: object = adParams["data"]["videoTrigger"];
        if (params_reward && params_reward["status"]) {
            this.switch_reward = true;
            this.time_reward_interval = params_reward["intervalSeconds"] ?
                params_reward["intervalSeconds"] : 0;
            this.num_reward_start = params_reward["beginQty"] ?
                params_reward["beginQty"] : 0;
            this.num_reward_max = params_reward["maxQty"] ?
                params_reward["maxQty"] : 0;

            RewardBox.getInstance().initRewardBox();
        }
        let params_special: object = adParams["data"]["special"];
        if (params_special) {
            this.switch_attribution = params_special["adAttribution"] ? params_special["adAttribution"] : false;
        }
        let params_inout: object = adParams["data"]["frontBackgroundSwitch"];
        if (params_inout) {
            this.switch_inout = true;
            this.probability_inout_inters = params_inout["screenRate"] ?
                params_inout["screenRate"] : 0;
            this.probability_inout_template_inters = params_inout["screenTemplateRate"] ?
                params_inout["screenTemplateRate"] : 0;
            this.probability_inout_native_inters = params_inout["screenNativeRate"] ?
                params_inout["screenNativeRate"] : 0;
            this.probability_inout_video = params_inout["videoRate"] ?
                params_inout["videoRate"] : 0;
            this.number_inout_start_show = params_inout["beginQty"] ?
                params_inout["beginQty"] : 0;
            this.num_inout_interval = params_inout["intervalQty"] ?
                params_inout["intervalQty"] : 0;
            this.time_inout_interval = params_inout["intervalSeconds"] ?
                params_inout["intervalSeconds"] : 0;
        }
        let params_video_cl: object = adParams["data"]["videoCL"];
        if (params_video_cl && params_video_cl["status"]) {
            this.switch_video_cl = true;
            this.time_video_cl_st = params_video_cl["st"] ?
                (params_video_cl["st"] <= 0 ?
                    0 : params_video_cl["st"]) : 0;
            this.time_video_cl_it = params_video_cl["it"] ?
                (params_video_cl["it"] <= 0 ?
                    1 : params_video_cl["it"]) : 1;
            this.num_video_cl_r = params_video_cl["r"] ?
                params_video_cl["r"] : 0;
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
        if (this.switch_inters && this.id_inters) {
            this.createSystemInters();
        }
        if (this.switch_native_template_inters && this.id_native_template_inters) {
            this.createNativeTemplateInters();
        }
        if (this.switch_video && this.id_video) {
            this.createVideo();
        }
        if (this.switch_float_banner && this.id_float_banner) {
            this.createFloatBanner();
        }
        setTimeout(() => {
            this.phasesCallbackToInitSdk("createAdFinish", {});
        }, 1000);
    }

    private reloadSystemBanner(): void {
        if (this.timeout_retry_load_banner != -1) return;
        this.timeout_retry_load_banner =
            setTimeout(() => {
                this.createSystemBanner();
                clearTimeout(this.timeout_retry_load_banner);
                this.timeout_retry_load_banner = -1;
            }, 5000);
    }

    private createSystemBanner(): void {
        this.xLog("*****createSystemBanner*****");
        if (StringUtil.containSpace(this.id_banner)) {
            this.xLog("#####banner广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.bannerAd = qg.createBannerAd({
            adUnitId: this.id_banner,
            style: {}
        })
        this.bannerAd.onSize((res) => {
            this.xLog("bannerAd onSize: " + JSON.stringify(res));
        })
        this.bannerAd.onLoad(() => {
            this.load_success_system_banner = true;
            this.xLog("@@@@@banner广告加载成功@@@@@")
        })
        this.bannerAd.onError((err) => {
            this.xLog("#####banner广告加载失败#####", JSON.stringify(err));
            this.load_success_system_banner = false;
            if (err.errCode == 30007) {
                this.xLog("系统banner广告播放次数已达限制");
                this.hideBanner();
                return;
            }
            this.reloadSystemBanner();
        })
        this.bannerAd.onClose(() => {
            this.xLog("banner广告关闭," + this.time_banner_refresh + "s后再次刷新");
            this.num_banner_be_close++;
            // 每个场景用户关闭就不再出现
            this.hideBanner();
        })
    }

    private reloadSystemInters() {
        if (this.num_system_inters_load_error < 5) {
            setTimeout(() => {
                this.createSystemInters();
            }, 10 * 1000);
        }
    }

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_inters)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.systemIntersAd = qg.createInterstitialAd({
            posId: this.id_inters
        })
        this.systemIntersAd.onLoad(() => {
            this.xLog("@@@@@系统插屏广告加载成功@@@@@")
            this.load_success_system_inters = true;
        })
        this.systemIntersAd.onError((err) => {
            this.xLog("#####系统插屏广告加载失败#####", JSON.stringify(err));
            this.num_system_inters_load_error++;
            this.load_success_system_inters = false;
            this.reloadSystemInters();
        })
        this.systemIntersAd.onClose(() => {
            this.xLog("系统插屏广告关闭");
            this.timestamp_last_hide_inters = new Date().getTime();
            this.load_success_system_inters = false;
            this.isShowSystemInters = false;
            this.intersPhasesCallback("intersClose");
            // 系统插屏关闭后10s后再次load
            setTimeout(() => {
                this.createSystemInters();
            }, 10 * 1000);
        })
    }

    private createNativeTemplateInters(): void {
        this.xLog("*****createNativeTemplateInters*****");
        if (StringUtil.containSpace(this.id_native_template_inters)) {
            this.xLog("#####原生模板插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.timeout_reload_native_template_inters != -1) return;
        if (this.systemInfo.platformVersionCode < 1091) {
            this.xLog("平台版本低于1093，无法创建/展示原生模板插屏广告");
            return;
        }
        this.nativeTemplateIntersAd && this.nativeTemplateIntersAd.destroy();
        this.time_native_template_inters_load_fail = 0;
        let wid = this.systemInfo.isStand ? 1080 : 2340;
        let hei = this.systemInfo.isStand ? 1920 : 1080;
        // let left = (this.systemInfo.isStand ? (wid - 1080) : (wid - 1280)) / 2;
        let left = (wid - 1080) / 2;
        let top = this.systemInfo.isStand ? hei - 720 : hei - 660;
        this.nativeTemplateIntersAd =
            // @ts-ignore
            qg.createCustomAd({
                adUnitId: this.id_native_template_inters,
                style: {
                    left: left,
                    top: top
                }
            })
        this.nativeTemplateIntersAd.onLoad(() => {
            this.load_success_native_template_inters = true;
            this.xLog("@@@@@原生模板插屏广告加载成功@@@@@")
            this.time_native_template_inters_load_fail = -1;
        });
        this.nativeTemplateIntersAd.onError((error) => {
            this.xLog("#####原生模板插屏广告加载失败#####", JSON.stringify(error));
            this.time_native_template_inters_load_fail = -1;
            this.timeout_reload_native_template_inters =
                setTimeout(() => {
                    this.timeout_reload_native_template_inters = -1;
                    this.createNativeTemplateInters();
                }, 10 * 1000);
        });
        this.nativeTemplateIntersAd.onClose(() => {
            this.xLog("原生模板插屏广告关闭");
            this.timestamp_last_hide_inters = new Date().getTime();
            this.load_success_native_template_inters = false;
            this.isShowNativeTemplateInters = false;
            this.nativeTemplateIntersAd && this.nativeTemplateIntersAd.destroy();
            this.intersPhasesCallback("intersClose");
            this.timeout_reload_native_template_inters =
                setTimeout(() => {
                    this.timeout_reload_native_template_inters = -1;
                    this.createNativeTemplateInters();
                }, 3000);
        });
    }

    private createAndShowNativeTemplateInters2(params: object, callback: (phases: string, res: object) => void): void {
        this.xLog("*****createAndShowNativeTemplateInters2*****");
        if (StringUtil.containSpace(this.id_native_inters)) {
            this.xLog("#####原生插屏广告ID存在空格,请检查后台#####");
            callback("intersShowFail", {});
            return;
        }
        if (this.systemInfo.platformVersionCode < 1091) {
            this.xLog("平台版本低于1093，无法创建/展示原生模板插屏广告");
            callback("intersShowFail", {});
            return;
        }
        this.nativeTemplateIntersAd2 && this.nativeTemplateIntersAd2.destroy();
        let wid = this.systemInfo.isStand ? 1080 : 2340;
        let hei = this.systemInfo.isStand ? 1920 : 1080;
        let left = params["left"] ? params["left"] : (wid - (this.systemInfo.isStand ? 1080 : 1280)) / 2;
        let top = params["top"] ? params["top"] : (hei - 720) / 2;
        let index = isNaN(Number(params["index"])) ? 0 : Number(params["index"]);
        let type = params["type"];
        let adUnitId;
        if (type == "nativeBig") {
            let adUnitIds = this.id_native_big.split(";");
            adUnitId = adUnitIds[index];
        } else {
            let adUnitIds = this.id_native_inters.split(";");
            adUnitId = adUnitIds[index];
        }

        this.nativeTemplateIntersAd2 =
            // @ts-ignore
            qg.createCustomAd({
                adUnitId: adUnitId,
                style: {
                    left: left,
                    top: top
                }
            })
        this.nativeTemplateIntersAd2.onLoad(() => {
            this.xLog("@@@@@原生模板插屏广告2加载成功@@@@@");
            this.nativeTemplateIntersAd2.show().then(() => {
                this.xLog("原生模板插屏广告2展示成功");
            }).catch((error) => {
                this.xLog("原生模板插屏广告2展示失败", JSON.stringify(error));
                this.timestamp_last_hide_inters = new Date().getTime();
                this.nativeTemplateIntersAd2 && this.nativeTemplateIntersAd2.destroy();
                this.nativeTemplateIntersAd2 = null;
            });
        });
        this.nativeTemplateIntersAd2.onError((error) => {
            this.xLog("#####原生模板插屏广告2加载失败#####", JSON.stringify(error));
            callback("intersShowFail", {});
        });
        this.nativeTemplateIntersAd2.onClose(() => {
            this.xLog("原生模板插屏广告2关闭");
            callback("intersClose", {});
            this.timestamp_last_hide_inters = new Date().getTime();
            this.nativeTemplateIntersAd2 && this.nativeTemplateIntersAd2.destroy();
            this.nativeTemplateIntersAd2 = null;
        });
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {
        let type = params["type"];
        if (!type || type == "nativeTemplateInters") {
            if (!this.switch_native_inters || !this.id_native_inters) {
                callback("intersShowFail", { msg: "未打开原生插屏广告开关或未设置原生插屏广告ID" });
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
                        this.createAndShowNativeTemplateInters2(params, callback);
                    }, this.time_inters_delay);
                } else {
                    this.createAndShowNativeTemplateInters2(params, callback);
                }
            } else {
                this.createAndShowNativeTemplateInters2(params, callback);
            }
        } else if (type == "nativeBig") {
            if (!this.switch_native_big || !this.id_native_big) {
                callback("intersShowFail", { msg: "未打开原生大图广告开关或未设置原生大图广告ID" });
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
                        this.createAndShowNativeTemplateInters2(params, callback);
                    }, this.time_inters_delay);
                } else {
                    this.createAndShowNativeTemplateInters2(params, callback);
                }
            } else {
                this.createAndShowNativeTemplateInters2(params, callback);
            }
        }
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
        // @ts-ignore
        qg.hasShortcutInstalled({
            success: (status) => {
                if (status) {
                    this.xLog("已存在桌面图标");
                    callback(false);
                } else {
                    this.xLog("当前不存在桌面图标");
                    callback(true);
                }
            }
        })
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        qg.installShortcut({
            success: () => {
                this.xLog("添加桌面成功");
                callback(true);
            },
            fail: (res) => {
                this.xLog("添加桌面失败:", JSON.stringify(res));
                callback(false);
            },
            complete: () => { }
        })
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

    private retryLoadVideo(): void {
        if (this.timeout_retry_load_video != -1) return;
        this.timeout_retry_load_video =
            setTimeout(() => {
                this.videoAd && this.videoAd.load();
                this.timeout_retry_load_video = -1;
            }, 3000)
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = qg.createRewardedVideoAd({
            posId: this.id_video
        })
        this.videoAd.onLoad(() => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
        })
        this.videoAd.onError((error) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(error));
            this.load_success_video = false;
            if (this.isShowVideo) {
                this.isShowVideo = false;
                this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayFail", error)
            }
            this.retryLoadVideo();
        })
        this.videoAd.onClose((res) => {
            this.isShowVideo = false;
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
        })
    }

    private getTypeFromTypeList(adList: number[]): number {
        if (adList.length == 0) {
            return 0;
        }
        if (adList.length == 1) {
            return adList[0];
        }
        if (adList.includes(7)) {
            return 7;
        }
        if (adList.includes(9)) {
            return 9;
        }
        if (adList.includes(1)) {
            return 1;
        }
        if (adList.includes(0)) {
            return 0;
        }
        if (adList.includes(8)) {
            return 8;
        }
        return adList[1];
    }

    private createFloatBanner(): void {
        this.xLog("*****createFloatBanner*****");
        if (StringUtil.containSpace(this.id_float_banner)) {
            this.xLog("#####原生悬浮banner广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemInfo.platformVersionCode < 1100) {
            this.xLog("当前平台版本不支持原生自渲染2.0,最低版本要求1100 当前版本:" + this.systemInfo.platformVersionCode);
            return;
        }
        // @ts-ignore
        this.floatBannerAd = qg.createNewNativeAd({
            posId: this.id_float_banner
        });
        this.floatBannerAd.onLoad((res) => {
            this.xLog("@@@@@悬浮banner广告加载成功@@@@@");
            this.xLog("float banner adList:" + JSON.stringify(res));
            if (res && res.adList && res.adList.length > 0) {
                this.load_success_float_banner = true;
                this.floatBannerAdParams = {
                    adId: res.adList[0].adId,
                    formType: this.getTypeFromTypeList(res.adList[0]["formType"])
                }
                if (this.ready2Show_float_banner) {
                    this.showFloatBanner();
                }
            }
        });
        this.floatBannerAd.onError((error) => {
            this.xLog("#####悬浮banner广告加载失败#####", JSON.stringify(error));
            this.load_success_float_banner = false;
            this.retryLoadFloatBanner();
        });
        this.floatBannerAd.onClose(() => {
            this.xLog("悬浮banner广告关闭");
            // this.refreshFloatBanner();
            this.showFloatBannerWithClose();
        });
    }

    private showFloatBannerWithClose(): void {
        this.hideFloatBanner();
        this.retryLoadFloatBanner();
        setTimeout(() => {
            this.showFloatBanner();
        }, this.time_float_banner_refresh * 1000);
    }

    private retryLoadFloatBanner(): void {
        if (this.timeout_retry_load_float_banner != -1) {
            clearTimeout(this.timeout_retry_load_float_banner);
            this.timeout_retry_load_float_banner = -1;
        }
        this.timeout_retry_load_float_banner =
            setTimeout(() => {
                this.timeout_retry_load_float_banner = -1;
                this.hideFloatBanner();
                this.createFloatBanner();
            }, 15 * 1000);
    }

    private showFloatBanner(): void {
        if (!this.load_success_float_banner) {
            this.ready2Show_float_banner = true;
            return;
        }
        if (!this.floatBannerAd) {
            return;
        }
        this.isShowFloatBanner = true;
        this.floatBannerAd.show(this.floatBannerAdParams);
        this.refreshFloatBanner();
    }

    private hideFloatBanner(): void {
        if (this.floatBannerAd) {
            this.floatBannerAd.destroy();
            this.floatBannerAd = null;
        }
        this.ready2Show_float_banner = false;
        this.isShowFloatBanner = false;
    }

    private refreshFloatBanner(): void {
        if (this.timeout_refresh_float_banner != -1) {
            clearInterval(this.timeout_refresh_float_banner);
            this.timeout_refresh_float_banner = -1;
        }
        this.timeout_refresh_float_banner =
            setInterval(() => {
                this.hideFloatBanner();
                this.retryLoadFloatBanner();
                this.showFloatBanner();
            }, this.time_float_banner_refresh * 1000);
    }

    private refreshBanner(): void {
        if (this.timeout_refresh_banner != -1) return;
        this.timeout_refresh_banner =
            setInterval(() => {
                this.xLog("refreshBanner");
                this.hideSystemBanner();
                this.timeout_delay_show_system_banner =
                    setTimeout(() => {
                        this.showSystemBanner();
                    }, 1000);
            }, this.time_banner_refresh * 1000);
    }

    private hideSystemBanner(): void {
        if (!this.isShowSystemBanner || !this.bannerAd) return;
        this.xLog("hideSystemBanner");
        this.isShowSystemBanner = false;
        this.load_success_system_banner = false;
        this.bannerAd.hide();
        this.bannerAd.destroy();
        this.createSystemBanner();
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
            this.isShowSystemBanner = true;
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

    hideBanner(): void {
        this.hasShowBanner = false;
        this.hideSystemBanner();
        if (this.timeout_refresh_banner != -1) {
            clearInterval(this.timeout_refresh_banner);
            this.timeout_refresh_banner = -1;
        }
        if (this.timeout_check_banner_load != -1) {
            clearTimeout(this.timeout_check_banner_load);
            this.timeout_check_banner_load = -1;
        }
        if (this.timeout_delay_show_system_banner != -1) {
            clearTimeout(this.timeout_delay_show_system_banner);
            this.timeout_delay_show_system_banner = -1;
        }
    }

    private getPByType(type: string): number {
        switch (type) {
            case "nativeTemplateInters":
                return this.probability_native_template_inters;
            case "inters":
                return this.probability_inters;
            case "video":
                return this.probability_video;
            default:
                return 0;
        }
    }

    private getShowInterTypeBySetting(): string {
        let canShowType: string[] = [];
        if (this.load_success_native_template_inters && this.probability_native_template_inters > 0) {
            canShowType.push("nativeTemplateInters");
        }
        if (this.load_success_system_inters && this.probability_inters > 0) {
            canShowType.push("inters");
        }
        if (this.load_success_video && this.probability_video > 0) {
            canShowType.push("video");
        }
        if (canShowType.length == 0) {
            return "";
        }
        if (canShowType.length == 1) {
            this.xLog("inters type:" + canShowType[0]);
            return canShowType[0];
        }

        // 生成随机数
        let random: number = Math.floor(Math.random() * 100);
        let temp = 0;
        this.xLog("inters type random:" + random);
        for (let i = 0; i < canShowType.length; i++) {
            temp += this.getPByType(canShowType[i]);
            if (random < temp) {
                this.xLog("inters type:" + canShowType[i]);
                return canShowType[i];
            }
        }
        this.xLog("inters type:" + canShowType[0]);
        return canShowType[0];
    }

    private showIntersAdByType(type: string): void {
        switch (type) {
            case "nativeTemplateInters":
                this.showNativeTemplateInters();
                break;
            case "inters":
                this.showSystemInters();
                break;
            case "video":
                this.showVideo({}, (phases: string, res: object) => {
                    this.timestamp_last_hide_inters = new Date().getTime();
                });
                break;
            default:
                break;
        }
    }

    private showSystemInters(): void {
        if (this.systemIntersAd && this.load_success_system_inters) {
            this.systemIntersAd.show().then(() => {
                this.xLog("系统插屏广告展示成功");
                this.isShowSystemInters = true;
            }).catch((err) => {
                this.xLog("系统插屏广告展示错误:" + JSON.stringify(err));
                this.isShowSystemInters = false;
            });
        }
    }

    private showNativeTemplateInters(): void {
        if (this.load_success_native_template_inters && this.nativeTemplateIntersAd) {
            this.nativeTemplateIntersAd.show().then(() => {
                this.xLog("原生模板插屏广告展示成功");
                this.isShowNativeTemplateInters = true;
            }).catch((error) => {
                this.xLog("原生模板插屏广告展示失败", JSON.stringify(error));
                this.isShowNativeTemplateInters = false;
            });
        }
    }

    getIntersFlag(): boolean {
        if (this.isShowSystemInters || this.isShowNativeTemplateInters) return false;
        let systemIntersLoad: boolean = this.load_success_system_inters && !this.isShowSystemInters;
        let nativeTemplateIntersLoad: boolean = this.load_success_native_template_inters && !this.isShowNativeTemplateInters;
        return systemIntersLoad || nativeTemplateIntersLoad;
    }

    private intersPhasesCallback(phases: string): void {
        if (this.showIntersPhasesCallback) this.showIntersPhasesCallback(phases, {});
    }

    private isAttainIntersLimit(): boolean {
        if (this.number_inters_to_desktop > 0 && this.num_inters_now_show == this.number_inters_to_desktop) {
            this.xLog("第" + this.number_inters_to_desktop + "次插屏变添加桌面");
            this.intersPhasesCallback("intersShowFail");
            this.isSupportAddDesktop((ret: boolean) => {
                if (ret) {
                    this.addDesktop((ret: boolean) => { });
                }
            });
            return false;
        }
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
            if (this.num_desktop_auto_appear > 0) {
                this.xLog("插屏间隔弹添加桌面:" + this.num_desktop_auto_appear--);
                this.isSupportAddDesktop((ret: boolean) => {
                    if (ret) {
                        this.addDesktop((ret: boolean) => { });
                    }
                });
            }
            return false;
        }
        if (new Date().getTime() - this.timestamp_last_hide_inters < this.time_inters_interval * 1000) {
            this.xLog("插屏间隔时间未达到,当前时间:" + (new Date().getTime() - this.timestamp_last_hide_inters) / 1000 + ",插屏间隔时间:" + this.time_inters_interval);
            this.intersPhasesCallback("intersShowFail");
            if (this.num_desktop_auto_appear > 0) {
                this.xLog("插屏间隔弹添加桌面:" + this.num_desktop_auto_appear--);
                this.isSupportAddDesktop((ret: boolean) => {
                    if (ret) {
                        this.addDesktop((ret: boolean) => { });
                    }
                });
            }
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
                    this.showIntersAdByType(this.getShowInterTypeBySetting());
                }, this.time_inters_delay);
            } else {
                this.showIntersAdByType(this.getShowInterTypeBySetting());
            }
        } else {
            this.showIntersAdByType(this.getShowInterTypeBySetting());
        }
    }

    getVideoFlag(): boolean {
        return this.load_success_video && this.videoAd;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.getVideoFlag()) {
            callback("videoNotLoad", {});
            return;
        }
        this.isShowVideo = true;
        this.showVideoPhasesCallback = callback;
        this.videoAd.show();
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
        if (type == "short") {
            // @ts-ignore
            qg.vibrateShort();
        } else if (type == "long") {
            // @ts-ignore
            qg.vibrateLong();
        }
    }

    shareApp(): void {
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

    private preOrder(productExternalId: string, callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.VIVO_PRE_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                callback(ret, res);
            });
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        this.xLog("pay...", JSON.stringify(params));
        //是否触发过登录重试
        let retryLogin = false;
        if (params["retryLogin"]) {
            retryLogin = params["retryLogin"];
        }
        this.payResultCallback = callback;

        if (!this.switch_pay) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
            this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "支付总开关未开启或支付配置未设置"));
            return;
        }

        if (!this.loginParams["vivo"]["token"]) {
            this.xLog("用户未登录");
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryPay(params, callback);
            } else {
                //@ts-ignore                
                qg.showToast({ message: "payError" });
                this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录"));
            }
            return;
        }

        //@ts-ignore
        qg.showToast({ message: "请求支付中..." });

        let productExternalId = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        this.xLog("productExternalId:" + productExternalId);
        this.preOrder(productExternalId, (ret, res) => {
            if (ret && res["data"] && res["data"]["orderInfo"]) {
                orderNo = res["data"]["orderNo"];
                //@ts-ignore
                qg.pay({
                    orderInfo: {
                        appId: res["data"]["orderInfo"]["appId"],
                        cpOrderNumber: res["data"]["orderInfo"]["cpOrderNumber"],
                        productName: res["data"]["orderInfo"]["productName"],
                        productDesc: res["data"]["orderInfo"]["productDesc"],
                        orderAmount: res["data"]["orderInfo"]["orderAmount"],
                        notifyUrl: res["data"]["orderInfo"]["notifyUrl"],
                        vivoSignature: res["data"]["orderInfo"]["vivoSignature"]
                    },
                    success: (res0) => {
                        code = "0";
                        codeMsg = "vivo pay 成功";
                        this.xLog("qg.pay success:", JSON.stringify(res0.data));
                        this.callbackPayResultToClient("orderPayFinish", this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
                    },
                    fail: (res0) => {
                        this.xLog("qg.pay fail:", JSON.stringify(res0));
                        code = "-1";
                        codeMsg = "vivo pay 失败";
                        this.callbackPayResultToClient("orderPayFail", this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
                    }
                });
            } else {
                code = "-1";
                codeMsg = "vivo预下单失败";
                this.callbackPayResultToClient("preOrderFail", this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
            }
        });
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        let platform: string = "ANDROID";
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

    orderComplete(orderNo: string): void {
        this.consumeOrder(orderNo);
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private callbackPayResultToClient(msg: string, object: object): void {
        if (!this.payResultCallback) return;
        if (this.completeOrders.indexOf(object["orderNo"]) != -1) return;
        this.payResultCallback(msg, object);
    }

    private genPayResponseObject(productExternalId: string, orderNo: string, code: string, codeMsg: string): object {
        let res = {
            productExternalId: productExternalId,
            orderNo: orderNo,
            code: code,
            codeMsg: codeMsg
        }
        return res;
    }

    //登录再重试支付
    private loginRetryPay(params, callback): void {
        this.xLog("loginRetryPay...", params);
        // @ts-ignore
        qg.showLoading({ message: "请求中...请稍等" });
        setTimeout(() => {
            // @ts-ignore
            qg.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.reLogin(() => {
            // @ts-ignore
            qg.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            qg.hideLoading();
            //登录失败，再次尝试支付
            this.pay(params, callback);
        });
    }

    //尝试请求补单
    private tryReqNotConsumeOrders(): void {
        if (this.tryReqNotConsumeOrdersIntervalId != -1) {
            clearInterval(this.tryReqNotConsumeOrdersIntervalId);
            this.tryReqNotConsumeOrdersIntervalId = -1;
        }
        this.tryReqNotConsumeOrdersTimes = 3;
        this.tryReqNotConsumeOrdersIntervalId =
            setInterval(() => {
                this.execReqNotConsumeOrders()
            }, 1000);
    }

    //执行补单请求
    private execReqNotConsumeOrders(): void {
        if (this.tryReqNotConsumeOrdersTimes <= 0) {
            clearInterval(this.tryReqNotConsumeOrdersIntervalId);
            this.tryReqNotConsumeOrdersIntervalId = -1;
            return;
        }
        this.tryReqNotConsumeOrdersTimes -= 1;
        this.handleNotConsumeOrders();
    }

    //处理补单
    private handleNotConsumeOrders(): void {
        this.reqNotConsumeOrders((ret, res) => {
            if (!ret || !res["data"] || res["data"].length <= 0) {
                return;
            }
            let orderList: object[] = res["data"];
            let nowIndex = 0;
            let finalList: object[] = [];
            let handleArray = () => {
                this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
                if (orderList.length > 0 && nowIndex < orderList.length) {
                    if (this.completeOrders.indexOf(orderList[nowIndex]["orderNo"]) == -1 || orderList[nowIndex]["force"]) {
                        finalList.push(orderList[nowIndex]);
                    } else {
                        this.consumeOrder(orderList[nowIndex]["orderNo"]);
                    }
                    nowIndex++;
                } else {
                    return;
                }
                handleArray();
            }
            handleArray();
            this.payCallback && this.payCallback(finalList);
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
        PrivacyAgreement.getInstance().openPrivacyAgreement();
    }

    onClickUserAgreementBtn(): void {
        PrivacyAgreement.getInstance().openUserAgreement();
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
        callback("uploadShareTaskFail", {});
    }

    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void {
        callback("getShareTaskDetailFail", {});
    }

    isNextVideoFitShare(): boolean {
        return false;
    }

    getRewardBoxFlag(): boolean {
        if (!this.switch_reward) return false;
        return RewardBox.getInstance().getRewardBoxFlag();
    }

    private isAttainRewardBoxLimit(callback: (phases: string, res: object) => void): boolean {
        // 未达到开始次数
        if (!this.achieveFirstReward) {
            // 开始次数>0
            if (this.num_reward_start > 0) {
                if (this.num_now_reward == this.num_reward_start) {
                    this.achieveFirstReward = true;
                    this.num_now_reward = 1;
                    return true;
                } else {
                    this.xLog("激励盒子开始次数未达到,当前次数:" + this.num_now_reward + ",激励盒子开始次数:" + this.num_reward_start);
                    callback("showRewardBoxBreak", { msg: "激励盒子开始次数未达到" });
                    return false;
                }
            } else {
                this.achieveFirstReward = true;
            }
        }

        // 是否达到最大次数
        if (this.num_now_reward > this.num_reward_max) {
            this.xLog("激励盒子已达到最大展示次数");
            callback("showRewardBoxBreak", { msg: "激励盒子已达到最大展示次数" });
            return false;
        }

        // 是否达到间隔时间
        if (this.time_reward_interval > 0 && this.time_now_reward < this.time_reward_interval) {
            this.xLog("激励盒子未达到展示间隔时间");
            callback("showRewardBoxBreak", { msg: "激励盒子未达到展示间隔时间" });
            return false;
        }
        this.time_now_reward = 0;

        return true;
    }

    showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.getRewardBoxFlag()) {
            callback("showRewardBoxBreak", { msg: "未加载成功" });
            return;
        }
        this.num_now_reward++;
        if (!this.isAttainRewardBoxLimit(callback)) {
            return;
        }
        this.time_now_reward = 0;
        RewardBox.getInstance().showRewardBox(params, callback);
    }

    private judgeUsEb(): boolean {
        if (!this.switch_video_cl) return false;
        let v_cl = LocalStorage.getStringData("v_cl");
        // 第一次初始化
        if (!v_cl) {
            let random: number = Math.floor(Math.random() * 100);
            if (random < this.num_video_cl_r) {
                LocalStorage.setStringData("v_cl", "1");
                return this.judgeLimit();
            } else {
                LocalStorage.setStringData("v_cl", "2");
                return false;
            }
        } else if (v_cl == "1") {
            // 生效人群
            return this.judgeLimit();
        } else {
            // 不生效人群
            return false;
        }
    }

    private judgeLimit(): boolean {
        // 当前时间戳
        let now = new Date().getTime();
        // 未达到首次误点
        if (!this.achieveFirstVc) {
            // 未达到开始时间
            if (now - this.time_into_game < this.time_video_cl_st * 1000) {
                this.xLog("not reach start time");
                return false;
            } else {
                this.achieveFirstVc = true;
                return true;
            }
        }
        // 判断是否达到间隔时间
        if (now - this.time_last_vc < this.time_video_cl_it * 1000) {
            this.xLog("not reach interval time");
            return false;
        }
        return true;
    }

    getVideoCLFlag(): boolean {
        let flag = this.judgeUsEb();
        if (flag) {
            this.time_last_vc = new Date().getTime();
        }
        return flag;
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

    setUserProperty(params: object): void {
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {

    }
}