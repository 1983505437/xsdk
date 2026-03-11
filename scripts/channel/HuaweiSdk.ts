import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import HuaweiNativeAdUtil from "../utils/HuaweiNativeAdUtil";
import LocalStorage from "../utils/LocalStorage";
import PrivacyAgreement from "../utils/PrivacyAgreement";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Huawei";
/*
 * @Author: Vae 
 * @Date: 2023-11-03 15:21:50 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 15:54:29
 */
export default class HuaweiSdk implements IXSdk {

    private appid: string = "";
    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "type": "USER",
        "guestGameUserId": "",
        "huawei": {
            "ts": "",
            "playerId": "",
            "playerLevel": "",
            "playerSSign": "",
        }
    }
    private payPublishKey: string = "";

    private initSdkPhasesCallback: any;
    private showBannerPhasesCallback: any;
    private showIntersPhasesCallback: any;
    private showVideoPhasesCallback: any;

    // 广告开关
    private switch_banner: boolean = false;
    private switch_inters: boolean = false;
    private switch_video: boolean = false;
    private switch_native_banner: boolean = false;
    private switch_float_banner: boolean = false;
    private switch_native_inters: boolean = false;

    // 广告id
    private id_banner: string = "";
    private id_inters: string = "";
    private id_video: string = "";
    private id_native_banner: string = "";
    private id_float_banner: string = "";
    private id_native_inters: string = "";

    // 广告id列表
    private id_banner_list: string[] = [];
    private id_inters_list: string[] = [];
    private id_video_list: string[] = [];
    private id_native_inters_list: string[] = [];
    private bannerIdIndex: number = 0;
    private intersIdIndex: number = 0;
    private videoIdIndex: number = 0;
    private nativeBannerIdIndex: number = 0;
    private nativeIntersIdIndex: number = 0;
    private adIdLoadFailMaxCount: number = 2;
    private bannerIdLoadFailCount: number = 0;
    private intersIdLoadFailCount: number = 0;
    private videoIdLoadFailCount: number = 0;
    private nativeBannerIdLoadFailCount: number = 0;
    private nativeIntersIdLoadFailCount: number = 0;
    private isNeedUpdateBannerId: boolean = false;
    private isNeedUpdateIntersId: boolean = false;
    private isNeedUpdateVideoId: boolean = false;
    private isNeedUpdateNativeIntersId: boolean = false;

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
    private time_first_force_delay: number = 30;
    private time_force_interval: number = 0;
    private forceType: string = "SCREEN";
    private num_force_max: number = 0;

    // 视频误点 原生插屏生效误点
    private switch_video_cl: boolean = false;

    // 视频误触 拉回游戏
    private switch_video_wc: boolean = false;
    private num_video_wc_st: number = 0;
    private num_video_wc_max: number = 0;
    private time_video_wc_interval: number = 0;
    private num_now_video_wc_st: number = 1;
    private num_now_video_wc: number = 0;
    private timestamp_last_video_wc: number = 0;

    // 切入切出
    private num_now_inout: number = 0;
    private num_now_inout_interval: number = 0;
    private time_now_inout_interval: number = 999;
    private achieveFirstInout: boolean = false;

    // 切入切出控制
    private switch_inout: boolean = false;
    private probability_inout_inters: number = 0;
    private probability_inout_template_inters: number = 100;
    private probability_inout_native_inters: number = 0;
    private probability_inout_video: number = 0;
    private number_inout_start_show: number = 0;
    private num_inout_interval: number = 0;
    private time_inout_interval: number = 0;

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
    private isShowSystemBanner: boolean = false;

    // 原生banner
    private nativeBannerAd: any = null;
    private load_success_native_banner: boolean = false;
    private isShowNativeBanner: boolean = false;
    private isExistNativeBanner: boolean = false;
    private isLoadingNativeBanner: boolean = false; //正在加载原生banner广告中
    private bannerHideByInters: boolean = false;
    private isShowingInters: boolean = false;
    // 原生插屏
    private nativeIntersAd: any = null;
    private load_success_native_inters: boolean = false;
    private is_pre_load_native_inters = false;
    private nativeIntersAdInfo: any = null;
    private timeout_retry_load_native_inters: number = -1;
    private isLoadingNativeInters: boolean = false; //正在加载原生插屏广告中
    // 原生悬浮banner
    private floatBannerAd: any = null;
    private timeout_retry_load_float_banner: number = -1;
    private isLoadingFloatBanner: boolean = false; //正在加载原生悬浮banner广告中
    private timeout_refresh_float_banner: number = -1;

    // system inters
    private systemIntersAd: any = null;
    private timestamp_last_hide_inters: number = 0;
    private num_inters_now_show: number = 0;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;
    private load_success_system_inters: boolean = false;
    private is_pre_load_inters = true;
    private timeout_retry_load_system_inters: number = -1;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private timeout_retry_load_video: number = -1;

    // force
    private time_now_force: number = 0;
    private achieveFirstForce: boolean = false;
    private num_now_real_force: number = 0;

    // 引力引擎
    private isInitGE: boolean = false;
    private accessToken: string = "";
    private openId: string = "";
    private ge: any;
    private versionCode: number = 1;
    private firstRunApp: boolean = true;  // 是否首次启动
    private hasReportTargetAction: boolean = false;  // 是否已经上报关键行为
    private isNaturalFlow: boolean = true;  // 是否是自然量
    private turbo_promoted_object_id: string = "";  // 当前归因目标广告创意id
    private aas: any;  // 广告归因配置
    private targetActionCount: number = 0;  // 归因要求次数
    private targetActionCountNow: number = 0;  // 归因已达到的指定行为次数

    // pay
    private payCallback: (res: object[]) => void;
    private isReLogin: boolean = false;
    private switch_pay: boolean = false;
    private purchaseTokenMap: { [key: string]: string } = {};
    private isPayTrigOnshow: boolean = false;

    // onShow监听
    private isVideoTrigInout: boolean = false;
    private isIntersTrigInout: boolean = false;
    private onShowListener: () => void;

    private systemInfo: { isStand: boolean, windowWidth: number, windowHeight: number, platformVersionCode: number, platform: string } = {
        isStand: true,
        windowWidth: 0,
        windowHeight: 0,
        platformVersionCode: 0,
        platform: "ANDROIDOS",
    };

    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 广告开关参数
    private switch_ad: object;


    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.parseInitParams(params);
        if (!this.appid) {
            this.xLog("该渠道必须要在params中添加appid参数");
            return;
        }
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.getLocalstorage();
            this.channelLogin();
        });
        this.getSystemInfo();
        this.addOnShowListener();
        this.addOnHideListener();
        this.runPerSecond();
    }

    private runPerSecond(): void {
        setInterval(() => {
            this.time_now_inout_interval++;
            this.doForce();
        }, 1000);
    }

    private doForce(): void {
        if (!this.switch_force) return;
        if (this.num_now_real_force >= this.num_force_max) return;
        this.time_now_force++;
        if (!this.achieveFirstForce) {
            if (this.time_now_force >= this.time_first_force_delay) {
                this.achieveFirstForce = true;
                this.showAdByForce();
                this.time_now_force = 0;
            }
            return;
        }
        if (this.time_force_interval <= 0) {
            this.switch_force = false;
            return;
        }
        if (this.time_now_force >= this.time_force_interval) {
            this.time_now_force = 0;
            this.showAdByForce();
        }
    }

    private showAdByForce(): void {
        this.num_now_real_force++;
        switch (this.forceType) {
            case "SCREEN":
                this.getIntersFlag() && this.showInters();
                break;
            case "VIDEO":
                this.getVideoFlag() && this.showVideo({}, (phases, res) => { });
                break;
        }
    }

    private parseInitParams(params?: object): void {
        if (!params) return;
        this.appid = params["appid"];
        if (params["accessToken"]) this.accessToken = params["accessToken"];
        if (params["versionCode"]) this.versionCode = params["versionCode"];
    }

    private getLocalstorage(): void {
        this.firstRunApp = LocalStorage.getStringData("firstRunApp") == "";
        this.hasReportTargetAction = LocalStorage.getStringData("hasReportTargetAction") != "";
        this.isNaturalFlow = LocalStorage.getStringData("isNaturalFlow") == "";
        this.turbo_promoted_object_id = LocalStorage.getStringData("turbo_promoted_object_id");
        this.targetActionCountNow = Number(LocalStorage.getStringData("targetActionCountNow") == "" ? 0 : LocalStorage.getStringData("targetActionCountNow"));
    }

    private addOnShowListener(): void {
        // @ts-ignore
        qg.onShow(() => {
            this.xLog("游戏进入前台");
            // 支付触发
            if (this.isPayTrigOnshow) {
                this.isPayTrigOnshow = false;
                this.doInoutPay();
                return;
            } else {
                // 视频触发切入切出
                if (this.isVideoTrigInout) this.isVideoTrigInout = false;
                // 玩家正常切入切出
                this.doInout();
            }
        });
    }

    private doInoutPay(): void {
        let reqNum: number = 0;
        let interval: number = -1;
        let reqFunc = () =>
            // @ts-ignore
            qg.obtainOwnedPurchases({
                ownedPurchasesReq: {
                    "priceType": 0, //暂只支持消耗型
                    "applicationID": this.appid,
                    "publicKey": this.payPublishKey
                },
                success: (data) => {
                    this.xLog("reqNotConsumeOrders success..." + ++reqNum);
                    this.xLog("obtainOwnedPurchases success:" + JSON.stringify(data));
                    let orderList: object[] = [];
                    if (data && data["inAppPurchaseDataList"] && data["inAppPurchaseDataList"].length > 0) {
                        for (let i = 0; i < data["inAppPurchaseDataList"].length; i++) {
                            let element = JSON.parse(data["inAppPurchaseDataList"][i]);
                            if (element["purchaseState"] != 0) {
                                continue;
                            }
                            orderList[i] = { orderNo: element["developerPayload"], productExternalId: element["productId"] }
                            this.purchaseTokenMap[element["developerPayload"]] = element["purchaseToken"];
                        }
                        this.payCallback && this.payCallback(orderList);
                    }
                    if ((reqNum >= 3)) {
                        clearInterval(interval);
                        interval = -1;
                    }
                },
                fail: (data, code) => {
                    this.xLog("reqNotConsumeOrders fail..." + ++reqNum);
                    this.xLog("obtainOwnedPurchases fail:" + JSON.stringify(data), "code =" + code);
                    if ((reqNum >= 3)) {
                        clearInterval(interval);
                        interval = -1;
                    }
                }
            });
        this.onShowListener = () => {
            reqNum = 0;
            reqFunc();
            if (interval != -1) return;
            interval = setInterval(reqFunc, 4000);
        };

        this.onShowListener();
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
        if (this.isShowingInters) return;
        this.showIntersAdByType(this.getShowInterTypeByInoutSetting());
        this.xLog("show inters by inout");
    }

    private getShowInterTypeByInoutSetting(): string {
        let canShowType: string[] = [];
        if (!this.is_pre_load_native_inters) this.load_success_native_inters = HuaweiNativeAdUtil.getInstance().getNativeIntersLoadResSuccess();
        if (this.load_success_native_inters && this.probability_inout_native_inters > 0) {
            canShowType.push("nativeInters");
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

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        qg.onHide(() => {
            this.xLog("游戏进入后台");
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
            // 视频导致切入后台 不触发拉回
            if (this.isVideoTrigInout) return;
            // 插屏切入后台 不触发拉回
            if (this.isIntersTrigInout) return;
            this.doVideoBack();
        });
    }

    private doVideoBack(): void {
        // 拉回游戏
        // 判断是否达到最大次数 
        // 视频是否加载成功
        if (this.switch_video_wc && this.num_now_video_wc < this.num_video_wc_max && this.getVideoFlag()) {
            // 判断是否达到开始次数
            if (this.num_now_video_wc_st < this.num_video_wc_st) {
                this.num_now_video_wc_st++;
                return;
            }
            // 判断是否达到间隔时间
            if (new Date().getTime() - this.timestamp_last_video_wc < this.time_video_wc_interval * 1000) {
                return;
            }
            this.showVideo({}, (a, b) => {
                this.timestamp_last_video_wc = new Date().getTime();
                this.num_now_video_wc++;
            });
        }
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        callback({ ret: false, userInfo: {} });
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private consumeOrder(orderNo: string): void {
        HttpRequest.getInstance().request(RequestUrl.CONSUME_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { orderNo: orderNo }, (ret: boolean, res: object) => {
                if (ret) {
                    this.xLog("orderNo:" + orderNo + " 订单完成");
                }
            });
    }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = qg.getSystemInfoSync();
        this.xLog("info:" + JSON.stringify(info));
        this.systemInfo.platform = info.platform;
        this.systemInfo.platformVersionCode = info.platformVersionCode;
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
        HuaweiNativeAdUtil.getInstance().setPlatformVersionCode(info.platformVersionCode);
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
        qg.gameLoginWithReal({
            forceLogin: 1,
            appid: this.appid,
            success: (data) => {
                if (data && data["gameAuthSign"]) {
                    this.loginParams["huawei"]["ts"] = data["ts"];
                    this.loginParams["huawei"]["playerId"] = data["playerId"];
                    this.loginParams["huawei"]["playerLevel"] = data["playerLevel"];
                    this.loginParams["huawei"]["playerSSign"] = data["gameAuthSign"];
                    this.xLog("this.loginParams:", JSON.stringify(this.loginParams));
                    this.phasesCallbackToInitSdk("channelLoginSuccess", data);
                } else {
                    this.phasesCallbackToInitSdk("channelLoginFail", data);
                    this.loginParams["type"] = "GUEST";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                }
                this.serverLogin();
            },
            fail: (data, code) => {
                this.xLog("登录失败：", data + " code:" + code);
                // @ts-ignore
                qg.showModal({
                    title: "登录失败",
                    content: "需要登录账号才可进入游戏",
                    showCancel: true,
                    mask: true,
                    confirmText: "继续登录",
                    cancelText: "退出游戏",
                    success: (res) => {
                        if (res.confirm) {
                            this.xLog('用户点击确定');
                            this.channelLogin();
                        } else if (res.cancel) {
                            this.xLog('用户点击取消');
                            // @ts-ignore
                            qg.exitApplication({});
                        }
                    }
                });
            }
        });
    }

    private setNaturalFlow(naturalFlow: boolean): void {
        this.isNaturalFlow = naturalFlow;
        LocalStorage.setStringData("isNaturalFlow", naturalFlow ? "" : "2");
        if (naturalFlow) HuaweiNativeAdUtil.getInstance().serNaturalFlow();
    }

    private initGE(params: any): void {
        if (!this.accessToken) return;
        if (this.isInitGE) return;
        if (!params || !params["externalId"]) return;
        this.isInitGE = true;
        this.openId = params["externalId"];
        let config = {
            accessToken: this.accessToken, // 项目通行证，在：网站后台-->设置-->应用列表中找到Access Token列 复制（首次使用可能需要先新增应用）
            clientId: this.openId, // 用户唯一标识，如产品为小游戏，则必须填用户openid（注意，不是小游戏的APPID！！！）
            autoTrack: {
                appLaunch: true, // 自动采集 $MPLaunch
                appShow: true, // 自动采集 $MPShow
                appHide: true, // 自动采集 $MPHide
            },
            name: "ge", // 全局变量名称
            debugMode: "none", // 是否开启测试模式，开启测试模式后，可以在 网站后台--设置--元数据--事件流中查看实时数据上报结果。（测试时使用，上线之后一定要关掉，改成none或者删除）
        };
        this.xLog("initGE config:" + JSON.stringify(config));
        // @ts-ignore
        this.ge = new GravityAnalyticsAPI(config);
        this.ge.setupAndStart();

        if (!this.firstRunApp) {
            this.setNaturalFlow(this.isNaturalFlow);
            return;
        }

        this.ge.initialize({
            name: params["name"],
            version: this.versionCode,
            openid: this.openId,
            enable_sync_attribution: true,
        }).then((res) => {
            this.xLog("initGE success " + JSON.stringify(res));
            this.ge.registerEvent();
            LocalStorage.setStringData("firstRunApp", "2");
            if (!res["data"] || !res["data"]["ad_params"] || !res["data"]["ad_params"]["channel"]) {
                this.setNaturalFlow(true);
                return;
            }
            this.turbo_promoted_object_id = res["data"]["turbo_promoted_object_id"];
            LocalStorage.setStringData("turbo_promoted_object_id", this.turbo_promoted_object_id);
            this.setNaturalFlow(this.turbo_promoted_object_id == "");
        }).catch((err) => {
            this.xLog("initGE fail " + JSON.stringify(err));
        });
    }

    private isConformToReport(type: string): boolean {
        if (!this.aas) return false;
        let isConform: boolean = false;
        for (let index = 0; index < this.aas.length; index++) {
            let element: object = this.aas[index];
            if (!element) continue;
            let targetCyId = element["i"];
            if (!targetCyId) continue;
            if (targetCyId != this.turbo_promoted_object_id) continue;
            let targetAction = element["aa"];
            if (targetAction != "show") continue;
            this.targetActionCount = Number(element["ac"]);
            if (this.targetActionCount <= 0) continue;
            let targetAdType = element["at"];
            if (type.includes(targetAdType)) {
                isConform = true;
                break;
            }
        }
        return isConform;
    }

    private geAdShowReport(type: string): void {
        if (!this.isInitGE) return;
        if (this.hasReportTargetAction) return;
        if (this.isNaturalFlow) return;
        if (!this.isConformToReport(type)) return;
        this.targetActionCountNow++;
        LocalStorage.setStringData("targetActionCountNow", this.targetActionCountNow + "");
        if (this.targetActionCountNow < this.targetActionCount) return;
        if (type == "video") {
            this.ge.track("$AdShow", { $ad_type: "reward", $ad_unit_id: this.id_video, $adn_type: "hw_mini", $ecpm: 1 });
        } else {
            this.ge.track("$AdShow", { $ad_type: "interstitial", $ad_unit_id: this.id_video, $adn_type: "hw_mini", $ecpm: 1 });
        }
        this.hasReportTargetAction = true;
        LocalStorage.setStringData("hasReportTargetAction", "1");
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
                if (res["data"]["channelConfig"]) this.parseChannelConfig(res["data"]["channelConfig"]);
                this.initGE(res["data"]);
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
            }
            this.reqAdParams();
        })
    }

    private parseChannelConfig(channelConfig: object): void {
        this.payPublishKey = channelConfig["huaweiPayPublicKey"] ? channelConfig["huaweiPayPublicKey"] : "";
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

    private shuffleArray(array): string[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    private parseAdParams(): void {
        let adParams: object = LocalStorage.getJsonData("adParams");
        if (!adParams || !adParams["data"]) {
            this.xLog("#####广告参数为空#####");
            this.phasesCallbackToInitSdk("createAdFail", adParams);
            return;
        }
        this.phasesCallbackToInitSdk("startCreateAd", adParams);
        if (!adParams["data"]["paymentStatus"] || (!adParams["data"]["paymentAndroidStatus"] && !adParams["data"]["paymentIOSStatus"])) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
        } else {
            if (this.loginParams["huawei"]["playerSSign"]) {
                this.switch_pay = true;
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
            this.switch_inters = switch_ad["screen"] ? switch_ad["screen"] : false;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_native_banner = switch_ad["bannerNative"] ? switch_ad["bannerNative"] : false;
            this.switch_native_inters = switch_ad["screenNative"] ? switch_ad["screenNative"] : false;
            this.switch_float_banner = switch_ad["floatBanner"] ? switch_ad["floatBanner"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_inters = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
            this.id_native_banner = id_ad["bannerNative"] ? id_ad["bannerNative"] : "";
            this.id_native_inters = id_ad["screenNative"] ? id_ad["screenNative"] : "";
            this.id_float_banner = id_ad["floatBanner"] ? id_ad["floatBanner"] : "";
            if (this.id_banner) {
                this.id_banner_list = this.id_banner.split(";");
                this.id_banner = this.id_banner_list[0];
            }
            if (this.id_inters) {
                this.id_inters_list = this.id_inters.split(";");
                this.id_inters = this.id_inters_list[0];
            }
            if (this.id_video) {
                this.id_video_list = this.id_video.split(";");
                this.id_video = this.id_video_list[0];
            }
            let id_native_banner_list: string[] = [];
            if (this.id_native_banner) {
                id_native_banner_list = this.id_native_banner.split(";");
                if (id_native_banner_list.length > 1) {
                    id_native_banner_list = this.shuffleArray(id_native_banner_list);
                }
                this.id_native_banner = id_native_banner_list[0];
            }
            if (this.id_native_inters) {
                this.id_native_inters_list = this.id_native_inters.split(";");
                this.id_native_inters = this.id_native_inters_list[0];
            }
            // 随机取一个原生banner广告id
            if (id_native_banner_list.length > 1) {
                let randomIndex = Math.floor(Math.random() * id_native_banner_list.length);
                this.id_native_banner = id_native_banner_list[randomIndex];
            }
            // 原生插屏广告id数组去除原生banner的广告id
            if (this.id_native_inters_list.includes(this.id_native_banner)) {
                let index = this.id_native_inters_list.indexOf(this.id_native_banner);
                this.id_native_inters_list.splice(index, 1);
            }
            // 将原生插屏广告id数组打乱顺序
            if (this.id_native_inters_list.length > 1) {
                this.id_native_inters_list = this.shuffleArray(this.id_native_inters_list);
                this.id_native_inters = this.id_native_inters_list[0];
            }
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
        let params_inters_more: object = adParams["data"]["screens"];
        if (params_inters_more && params_inters_more["status"]) {
            this.probability_inters = params_inters_more["screenRate"] ? params_inters_more["screenRate"] : 0;
            this.probability_native_inters = params_inters_more["screenNativeRate"] ? params_inters_more["screenNativeRate"] : 0;
            this.probability_native_template_inters = params_inters_more["screenNativeTemplateRate"] ? params_inters_more["screenNativeTemplateRate"] : 0;
            this.probability_video = params_inters_more["videoRate"] ? params_inters_more["videoRate"] : 0;
        }
        let params_force: object = adParams["data"]["force"];
        this.xLog("params_f:" + JSON.stringify(params_force));
        if (params_force && params_force["status"]) {
            this.switch_force = true;
            this.time_first_force_delay = params_force["firstDelaySeconds"] ?
                (params_force["firstDelaySeconds"] <= 0 ?
                    10 : params_force["firstDelaySeconds"]) : 10;
            this.time_force_interval = params_force["intervalSeconds"] ?
                params_force["intervalSeconds"] : 0;
            this.forceType = params_force["type"] ?
                params_force["type"] : "SCREEN";
            this.num_force_max = params_force["maxQty"] ?
                params_force["maxQty"] : 0;
            this.achieveFirstForce = this.time_first_force_delay == 0;
        }
        // let params_reward: object = adParams["data"]["videoTrigger"];
        // this.xLog("params_reward:" + JSON.stringify(params_reward));
        // if (params_reward && params_reward["status"]) {
        //     this.switch_reward = true;
        //     this.time_reward_interval = params_reward["intervalSeconds"] ?
        //         params_reward["intervalSeconds"] : 0;
        //     this.num_reward_start = params_reward["beginQty"] ?
        //         params_reward["beginQty"] : 0;
        //     this.num_reward_max = params_reward["maxQty"] ?
        //         params_reward["maxQty"] : 0;

        //     RewardBox.getInstance().initRewardBox();
        // }
        let params_inout: object = adParams["data"]["frontBackgroundSwitch"];
        this.xLog("params_inout:" + JSON.stringify(params_inout));
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
        this.xLog("params_video_c:" + JSON.stringify(params_video_cl));
        if (params_video_cl && params_video_cl["status"]) {
            this.switch_video_cl = true;
            HuaweiNativeAdUtil.getInstance().setNativeIntersCl(params_video_cl);
        }
        let params_video_wc: object = adParams["data"]["videoTrigger"];
        this.xLog("params_video_t:" + JSON.stringify(params_video_wc));
        if (params_video_wc && params_video_wc["status"]) {
            this.switch_video_wc = true;
            this.num_video_wc_st = params_video_wc["beginQty"] ? params_video_wc["beginQty"] : 0;
            this.num_video_wc_max = params_video_wc["maxQty"] ? params_video_wc["maxQty"] : 0;
            this.time_video_wc_interval = params_video_wc["intervalSeconds"] ? params_video_wc["intervalSeconds"] : 0;
        }
        let params_special: object = adParams["data"]["special"];
        this.xLog("params_special:" + JSON.stringify(params_special));
        if (params_special && params_special["adAttribution"]) {
            HuaweiNativeAdUtil.getInstance().setAdAttribution();
        }
        let params_aas: object = adParams["data"]["aas"];
        this.xLog("params_aas:" + JSON.stringify(params_aas));
        if (params_aas) this.aas = params_aas;

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

    private tryGetNextAdId(type: string): void {
        switch (type) {
            case "banner":
                this.bannerIdLoadFailCount++;
                if (this.bannerIdLoadFailCount >= this.adIdLoadFailMaxCount) {
                    this.getNextAdId(type);
                }
                break;
            case "inters":
                this.intersIdLoadFailCount++;
                if (this.intersIdLoadFailCount >= this.adIdLoadFailMaxCount) {
                    this.getNextAdId(type);
                }
                break;
            case "video":
                this.videoIdLoadFailCount++;
                if (this.videoIdLoadFailCount >= this.adIdLoadFailMaxCount) {
                    this.getNextAdId(type);
                }
                break;
            case "nativeInters":
                this.nativeIntersIdLoadFailCount++;
                if (this.nativeIntersIdLoadFailCount >= this.adIdLoadFailMaxCount) {
                    this.getNextAdId(type);
                }
                break;
        }
    }

    private getNextAdId(type: string): void {
        this.xLog("load fail, get next adId:" + type);
        switch (type) {
            case "banner":
                this.bannerIdIndex++;
                if (this.bannerIdIndex >= this.id_banner_list.length) this.bannerIdIndex = 0;
                this.bannerIdLoadFailCount = 0;
                this.id_banner = this.id_banner_list[this.bannerIdIndex];
                this.isNeedUpdateBannerId = true;
                break;
            case "inters":
                this.intersIdIndex++;
                if (this.intersIdIndex >= this.id_inters_list.length) this.intersIdIndex = 0;
                this.intersIdLoadFailCount = 0;
                this.id_inters = this.id_inters_list[this.intersIdIndex];
                this.isNeedUpdateIntersId = true;
                break;
            case "video":
                this.videoIdIndex++;
                if (this.videoIdIndex >= this.id_video_list.length) this.videoIdIndex = 0;
                this.videoIdLoadFailCount = 0;
                this.id_video = this.id_video_list[this.videoIdIndex];
                this.isNeedUpdateVideoId = true;
                break;
            case "nativeInters":
                this.nativeIntersIdIndex++;
                if (this.nativeIntersIdIndex >= this.id_native_inters_list.length) this.nativeIntersIdIndex = 0;
                this.nativeIntersIdLoadFailCount = 0;
                this.id_native_inters = this.id_native_inters_list[this.nativeIntersIdIndex];
                this.isNeedUpdateNativeIntersId = true;
                break;
        }
    }

    private createAd(): void {
        this.phasesCallbackToInitSdk("createAd", {});
        if (this.switch_inters && this.id_inters) {
            if (this.is_pre_load_inters) this.createSystemInters();
            else this.load_success_system_inters = true;
        }
        if (this.is_pre_load_native_inters && this.switch_native_inters && this.id_native_inters) {
            this.createNativeInters();
        }
        if (this.switch_video && this.id_video) {
            this.createVideo();
        }
        if (this.switch_native_banner && this.id_native_banner) {
            HuaweiNativeAdUtil.getInstance().loadNativeBannerUI();
        }
        if (this.switch_native_inters && this.id_native_inters) {
            HuaweiNativeAdUtil.getInstance().setIntoGameTimestamp();
            HuaweiNativeAdUtil.getInstance().loadNativeIntersUI();
        }
        if (this.switch_float_banner && this.id_float_banner) {
            HuaweiNativeAdUtil.getInstance().loadFloatBannerUI();
            setTimeout(() => {
                this.createFloatBanner();
            }, 5 * 1000);
        }
        setTimeout(() => {
            this.phasesCallbackToInitSdk("createAdFinish", {});
        }, 1000);
    }

    private createSystemBanner(): void {
        this.xLog("*****createSystemBanner*****id=" + this.id_banner);
        if (StringUtil.containSpace(this.id_banner)) {
            this.xLog("#####banner广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.bannerAd) {
            this.bannerAd.offLoad();
            this.bannerAd.offError();
            this.bannerAd.offClose();
            this.bannerAd = undefined;
        }
        if (this.systemInfo.platform == "ANDROIDOS") {
            // @ts-ignore
            this.bannerAd = qg.createBannerAd({
                adUnitId: this.id_banner,
                style: {
                    top: this.systemInfo.windowHeight - 57,
                    left: this.systemInfo.isStand ? (this.systemInfo.windowWidth - 360) / 2 : 0,
                    height: 57,
                    width: 360
                },
            });
        } else {
            // @ts-ignore
            this.bannerAd = qg.createBannerAd({
                adUnitId: this.id_banner,
                style: {
                    top: 0,
                    left: 0,
                    height: 57,
                    width: 360
                },
            });
        }
        this.bannerAd.onLoad(() => {
            this.xLog("@@@@@banner广告展示成功@@@@@");
            this.isShowSystemBanner = true;
        });
        this.bannerAd.onError((error) => {
            this.xLog("#####banner广告加载失败#####", JSON.stringify(error));
            this.tryGetNextAdId("banner");
        });
        this.bannerAd.onClose(() => {
            this.xLog("banner广告关闭," + this.time_banner_refresh + "s后再次刷新");
            this.timestamp_last_hide_banner = new Date().getTime();
        });
        if (this.hasShowBanner) {
            this.bannerAd.show();
        }
    }

    private createNativeBanner(): void {
        this.xLog("*****createNativeBanner*****id=" + this.id_native_banner);
        if (StringUtil.containSpace(this.id_native_banner)) {
            this.xLog("#####原生banner广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.isLoadingNativeBanner) return;
        if (this.isLoadingFloatBanner || this.isLoadingNativeInters) {
            setTimeout(() => {
                this.createNativeBanner();
            }, 1000);
            return;
        }
        this.isLoadingNativeBanner = true;
        // @ts-ignore
        this.nativeBannerAd = qg.createNativeAd({
            adUnitId: this.id_native_banner,
        });
        this.nativeBannerAd.onLoad((data) => {
            this.xLog("@@@@@原生banner广告加载成功@@@@@");
            this.xLog("adList:" + JSON.stringify(data));
            this.isLoadingNativeBanner = false;
            let adInfo = data.adList[0];
            if (this.hasShowBanner) {
                this.isExistNativeBanner = true;
                this.isShowNativeBanner = true;
                HuaweiNativeAdUtil.getInstance().loadAndShowNativeBanner(this.nativeBannerAd, adInfo, (isClickClose: boolean) => {
                    // // 点击广告后关闭
                    // if (isClickClose) {
                    // } else {
                    //     // 关闭按钮触发关闭
                    // }
                    this.hideNativeBanner();
                    this.timestamp_last_hide_banner = new Date().getTime();
                });
            }
        });
        this.nativeBannerAd.onError((error) => {
            this.xLog("#####原生banner广告加载失败#####", JSON.stringify(error));
            this.isLoadingNativeBanner = false;
        });
        if (this.hasShowBanner) {
            this.nativeBannerAd.load();
        }
    }

    private hideSystemBanner(): void {
        if (!this.isShowSystemBanner || !this.bannerAd) return;
        this.xLog("hideSystemBanner");
        this.isShowSystemBanner = false;
        this.load_success_system_banner = false;
        this.bannerAd.destroy();
        this.bannerAd = null;
    }

    private hideNativeBanner(): void {
        if (!this.nativeBannerAd) return;
        this.nativeBannerAd.offLoad();
        this.nativeBannerAd.offError();
        this.nativeBannerAd = null;
        HuaweiNativeAdUtil.getInstance().hideNativeBanner();
        this.isShowNativeBanner = false;
    }

    private checkBannerLoad(): void {
        this.load_success_native_banner = HuaweiNativeAdUtil.getInstance().getNativeBannerLoadResSuccess();
        this.load_success_system_banner = this.switch_banner && this.id_banner != "";
        this.load_success_banner = this.load_success_native_banner || this.load_success_system_banner;
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

    private refreshBanner(): void {
        if (this.timeout_refresh_banner != -1) return;
        this.timeout_refresh_banner =
            setInterval(() => {
                this.xLog("refreshBanner");
                if (this.isExistNativeBanner) {
                    this.hideNativeBanner();
                    this.createNativeBanner();
                } else {
                    this.hideSystemBanner();
                    this.createSystemBanner();
                }
            }, this.time_banner_refresh * 1000);
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
        if (callback) this.showBannerPhasesCallback = callback;
        else this.showBannerPhasesCallback = undefined;
        HuaweiNativeAdUtil.getInstance().setNativeBannerReady2Show(true);
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

        if (this.load_success_native_banner) {
            this.createNativeBanner();
        } else {
            this.createSystemBanner();
        }
        this.refreshBanner();
    }

    hideBanner(): void {
        this.bannerHideByInters = false;
        this.hasShowBanner = false;
        HuaweiNativeAdUtil.getInstance().setNativeBannerReady2Show(false);
        this.hideNativeBanner();
        this.hideSystemBanner();
        if (this.timeout_refresh_banner != -1) {
            clearInterval(this.timeout_refresh_banner);
            this.timeout_refresh_banner = -1;
        }
        if (this.timeout_check_banner_load != -1) {
            clearTimeout(this.timeout_check_banner_load);
            this.timeout_check_banner_load = -1;
        }
    }

    private interiorHideBanner(): void {
        this.hasShowBanner = false;
        HuaweiNativeAdUtil.getInstance().setNativeBannerReady2Show(false);
        this.hideNativeBanner();
        this.hideSystemBanner();
        if (this.timeout_refresh_banner != -1) {
            clearInterval(this.timeout_refresh_banner);
            this.timeout_refresh_banner = -1;
        }
        if (this.timeout_check_banner_load != -1) {
            clearTimeout(this.timeout_check_banner_load);
            this.timeout_check_banner_load = -1;
        }
    }

    private getPByType(type: string): number {
        switch (type) {
            case "nativeInters":
                return this.probability_native_inters;
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
        if (this.probability_inters > 0 && this.load_success_system_inters) {
            canShowType.push('inters');
        }
        if (this.probability_video > 0 && this.load_success_video) {
            canShowType.push('video');
        }
        if (this.probability_native_inters > 0 && this.load_success_native_inters) {
            canShowType.push('nativeInters');
        }
        if (canShowType.length == 0) {
            return '';
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
            case "inters":
                this.showSystemInters();
                break;
            case "nativeInters":
                this.showNativeInters();
                break;
            case "video":
                this.showVideo({}, (p, r) => {
                    this.timestamp_last_hide_inters = new Date().getTime();
                });
                break;
            default:
                break;
        }
    }

    private showSystemInters(): void {
        this.xLog("showSystemInters");
        if (this.isShowingInters) return;
        this.isShowingInters = true;
        if (!this.is_pre_load_inters) {
            if (this.systemIntersAd && !this.isNeedUpdateIntersId) {
                this.systemIntersAd.load();
            } else {
                this.isNeedUpdateIntersId = false;
                this.createSystemInters();
            }
        } else {
            if (this.systemIntersAd && !this.isNeedUpdateIntersId) {
                if (this.isShowNativeBanner || this.isShowSystemBanner) {
                    this.bannerHideByInters = true;
                    this.interiorHideBanner();
                }
                this.isIntersTrigInout = true;
                this.systemIntersAd.show();
            } else {
                // 预加载 需要更新ad id 重新创建
                this.isNeedUpdateIntersId = false;
                this.isShowingInters = false;
                this.createSystemInters();
            }
        }
    }

    private retryLoadSystemInters(): void {
        if (this.timeout_retry_load_system_inters != -1) return;
        this.timeout_retry_load_system_inters =
            setTimeout(() => {
                if (this.isNeedUpdateIntersId) {
                    this.isNeedUpdateIntersId = false;
                    this.createSystemInters();
                } else {
                    this.systemIntersAd && this.systemIntersAd.load();
                }
                this.timeout_retry_load_system_inters = -1;
            }, 30 * 1000)
    }

    private showNativeInters(): void {
        this.xLog("showNativeInters");
        if (this.isShowingInters) return;
        this.isShowingInters = true;
        if (!this.is_pre_load_native_inters) {
            if (this.nativeIntersAd && !this.isNeedUpdateNativeIntersId) {
                this.nativeIntersAd.load();
            } else {
                this.isNeedUpdateNativeIntersId = false;
                this.createNativeInters();
            }
        } else {
            if (this.isShowNativeBanner || this.isShowSystemBanner) {
                this.bannerHideByInters = true;
                this.interiorHideBanner();
            }
            HuaweiNativeAdUtil.getInstance().loadAndShowNativeInters(this.nativeIntersAd, this.nativeIntersAdInfo, (isClickClose) => {
                this.xLog("原生插屏广告关闭");
                this.isShowingInters = false;
                this.geAdShowReport("inters");
                this.timestamp_last_hide_inters = new Date().getTime();
                this.intersPhasesCallback("intersClose");
                if (this.bannerHideByInters) {
                    this.bannerHideByInters = false;
                    this.interiorShowBanner();
                }
                this.load_success_native_inters = false;
                this.nativeIntersAd.load();
            });
        }
    }

    private retryLoadNativeIntersWithTime(time: number): void {
        if (this.timeout_retry_load_native_inters != -1) return;
        this.timeout_retry_load_native_inters =
            setTimeout(() => {
                if (this.isNeedUpdateNativeIntersId) {
                    this.isNeedUpdateNativeIntersId = false;
                    this.createNativeInters();
                } else {
                    this.nativeIntersAd && this.nativeIntersAd.load();
                }
                this.timeout_retry_load_native_inters = -1;
            }, time * 1000)
    }

    private retryLoadNativeInters(): void {
        if (this.timeout_retry_load_native_inters != -1) return;
        this.timeout_retry_load_native_inters =
            setTimeout(() => {
                if (this.isNeedUpdateNativeIntersId) {
                    this.isNeedUpdateNativeIntersId = false;
                    this.createNativeInters();
                } else {
                    this.nativeIntersAd && this.nativeIntersAd.load();
                }
                this.timeout_retry_load_native_inters = -1;
            }, 30 * 1000)
    }

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****id=" + this.id_inters);
        if (StringUtil.containSpace(this.id_inters)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemIntersAd) {
            this.systemIntersAd.offLoad();
            this.systemIntersAd.offError();
            this.systemIntersAd.offClose();
            this.systemIntersAd = undefined;
        }
        // @ts-ignore
        this.systemIntersAd = qg.createInterstitialAd({
            adUnitId: this.id_inters
        });
        this.systemIntersAd.onLoad(() => {
            this.xLog("@@@@@系统插屏广告加载成功@@@@@");
            if (!this.is_pre_load_inters) {
                if (this.isShowNativeBanner || this.isShowSystemBanner) {
                    this.bannerHideByInters = true;
                    this.interiorHideBanner();
                }
                this.isIntersTrigInout = true
                this.systemIntersAd.show();
            } else {
                this.load_success_system_inters = true;
            }
        });
        this.systemIntersAd.onError((error) => {
            this.xLog("#####系统插屏广告加载失败#####", JSON.stringify(error));
            this.isShowingInters = false;
            this.tryGetNextAdId("inters");
            if (this.is_pre_load_inters) {
                this.load_success_system_inters = false;
                this.retryLoadSystemInters();
            }
        });
        this.systemIntersAd.onClose(() => {
            this.xLog("系统插屏广告关闭");
            this.isShowingInters = false;
            this.geAdShowReport("inters");
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
            if (this.bannerHideByInters) {
                this.bannerHideByInters = false;
                this.interiorShowBanner();
            }
            if (this.is_pre_load_inters) {
                this.load_success_system_inters = false;
                this.systemIntersAd.load();
            }
        });
        this.systemIntersAd.load();
    }

    private createNativeInters(): void {
        this.xLog("*****createNativeInters*****id=" + this.id_native_inters);
        if (StringUtil.containSpace(this.id_native_inters)) {
            this.xLog("#####原生插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.isLoadingFloatBanner || this.isLoadingNativeBanner || this.isLoadingNativeInters) return;
        this.isLoadingNativeInters = true;
        if (this.nativeIntersAd) {
            this.nativeIntersAd.offLoad();
            this.nativeIntersAd.offError();
            this.nativeIntersAd = undefined;
        }
        // @ts-ignore
        this.nativeIntersAd = qg.createNativeAd({
            adUnitId: this.id_native_inters
        });
        this.nativeIntersAd.onLoad((data) => {
            this.xLog("@@@@@原生插屏广告加载成功@@@@@");
            this.xLog("adList:" + JSON.stringify(data));
            this.isLoadingNativeInters = false;
            this.nativeIntersAdInfo = data.adList[0];
            if (!this.is_pre_load_native_inters) {
                if (this.isShowNativeBanner || this.isShowSystemBanner) {
                    this.bannerHideByInters = true;
                    this.interiorHideBanner();
                }
                HuaweiNativeAdUtil.getInstance().loadAndShowNativeInters(this.nativeIntersAd, this.nativeIntersAdInfo, (isClickClose) => {
                    this.xLog("原生插屏广告关闭");
                    this.isShowingInters = false;
                    this.geAdShowReport("inters");
                    this.timestamp_last_hide_inters = new Date().getTime();
                    this.intersPhasesCallback("intersClose");
                    if (this.bannerHideByInters) {
                        this.bannerHideByInters = false;
                        this.interiorShowBanner();
                    }
                });
            } else {
                // 使用了误点 并且非下载类或已安装或下载中 则重新创建广告
                let appStatus = this.nativeIntersAd.getAppStatus({ adId: this.id_native_inters });
                console.log(TAG, "appStatus:" + appStatus);
                if (this.switch_video_cl && (this.nativeIntersAdInfo.creativeType < 100 || !appStatus || appStatus == "INSTALLED" || appStatus == "DOWNLOADING")) {
                    console.log(TAG, "非下载类:" + (this.nativeIntersAdInfo.creativeType < 100));
                    // this.createNativeInters();
                    this.getNextAdId("nativeInters");
                    this.retryLoadNativeIntersWithTime(5);
                    return;
                }
                this.load_success_native_inters = true;
            }
        });
        this.nativeIntersAd.onError((error) => {
            this.xLog("#####原生插屏广告加载失败#####", JSON.stringify(error));
            this.isLoadingNativeInters = false;
            this.isShowingInters = false;
            this.tryGetNextAdId("nativeInters");
            if (this.is_pre_load_native_inters) {
                this.load_success_native_inters = false;
                this.retryLoadNativeInters();
            } else {
                this.showOtherAdAsInters();
            }
        });
        this.nativeIntersAd.load();
    }

    private createFloatBanner(): void {
        this.xLog("*****createFloatBanner*****id=" + this.id_float_banner);
        if (StringUtil.containSpace(this.id_float_banner)) {
            this.xLog("#####原生悬浮banner广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.isLoadingFloatBanner) return;
        if (this.isLoadingNativeBanner || this.isLoadingNativeInters) {
            setTimeout(() => {
                this.createFloatBanner();
            }, 1000);
            return;
        }
        this.isLoadingFloatBanner = true;
        if (this.floatBannerAd) {
            this.floatBannerAd.offLoad();
            this.floatBannerAd.offError();
            this.floatBannerAd = null;
        }
        // @ts-ignore
        this.floatBannerAd = qg.createNativeAd({
            adUnitId: this.id_float_banner,
        });
        this.floatBannerAd.onLoad((data) => {
            this.xLog("@@@@@悬浮banner广告加载成功@@@@@");
            this.xLog("adList:" + JSON.stringify(data));
            this.isLoadingFloatBanner = false;
            let adInfo = data.adList[0];
            HuaweiNativeAdUtil.getInstance().loadAndShowFloatBanner(this.floatBannerAd, adInfo, (isClickClose: boolean) => {
                this.hideFloatBanner();
                this.refreshFloatBanner();
            });
            this.refreshFloatBanner();
        });
        this.floatBannerAd.onError((error) => {
            this.xLog("#####悬浮banner广告加载失败#####", JSON.stringify(error));
            this.isLoadingFloatBanner = false;
            this.retryLoadFloatBanner();
        });
        this.floatBannerAd.load();
    }

    private hideFloatBanner(): void {
        if (!this.floatBannerAd) return;
        this.floatBannerAd.offLoad();
        this.floatBannerAd.offError();
        this.floatBannerAd = null;
        HuaweiNativeAdUtil.getInstance().hideFloatBanner();
    }

    private retryLoadFloatBanner(): void {
        if (this.timeout_retry_load_float_banner != -1) return;
        this.timeout_retry_load_float_banner =
            setTimeout(() => {
                this.hideFloatBanner();
                this.createFloatBanner();
                clearTimeout(this.timeout_retry_load_float_banner);
                this.timeout_retry_load_float_banner = -1;
            }, this.time_banner_refresh / 2 * 1000);
    }

    private refreshFloatBanner(): void {
        if (this.timeout_refresh_float_banner != -1) {
            clearTimeout(this.timeout_refresh_float_banner);
            this.timeout_refresh_float_banner = -1;
        }
        this.timeout_refresh_float_banner =
            setTimeout(() => {
                this.hideFloatBanner();
                this.createFloatBanner();
                clearTimeout(this.timeout_refresh_float_banner);
                this.timeout_refresh_float_banner = -1;
            }, this.time_banner_refresh * 1000);
    }

    private showOtherAdAsInters(): void {
        let p_it = this.getPByType("inters");
        let p_vd = this.getPByType("video");
        let canShowType: string[] = [];
        if (p_it > 0 && this.load_success_system_inters) {
            canShowType.push("inters");
        }
        if (p_vd > 0 && this.load_success_video) {
            canShowType.push("video");
        }
        if (canShowType.length == 0) return;
        if (canShowType.length == 1) {
            this.xLog("showOtherAdAsInters:" + canShowType[0]);
            this.showIntersAdByType(canShowType[0]);
            return;
        }
        // 生成随机数
        let random: number = Math.floor(Math.random() * (p_it + p_vd));
        if (random < p_it) {
            this.xLog("showOtherAdAsInters:inters," + random);
            this.showIntersAdByType("inters");
        } else {
            this.xLog("showOtherAdAsInters:video," + random);
            this.showIntersAdByType("video");
        }
    }

    getIntersFlag(): boolean {
        // 非预加载则重置状态
        if (!this.is_pre_load_inters) this.load_success_system_inters = this.switch_inters && this.id_inters != "";
        if (!this.is_pre_load_native_inters) this.load_success_native_inters = HuaweiNativeAdUtil.getInstance().getNativeIntersLoadResSuccess();
        let videoLoadSuccess = this.load_success_video && this.getPByType("video") > 0;
        return this.load_success_system_inters || this.load_success_native_inters || videoLoadSuccess;
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
                    this.showIntersAdByType(this.getShowInterTypeBySetting());
                }, this.time_inters_delay);
            } else {
                this.showIntersAdByType(this.getShowInterTypeBySetting());
            }
        } else {
            this.showIntersAdByType(this.getShowInterTypeBySetting());
        }
    }

    private retryLoadVideo(): void {
        if (this.timeout_retry_load_video != -1) return;
        this.timeout_retry_load_video =
            setTimeout(() => {
                if (this.isNeedUpdateVideoId) {
                    this.isNeedUpdateVideoId = false;
                    this.createVideo();
                } else {
                    this.videoAd && this.videoAd.load();
                }
                this.timeout_retry_load_video = -1;
            }, 5 * 1000)
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****id=" + this.id_video);
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.videoAd) {
            this.videoAd.offLoad();
            this.videoAd.offError();
            this.videoAd.offClose();
            this.videoAd = undefined;
        }
        // @ts-ignore
        this.videoAd = qg.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.videoAd.onLoad((adList) => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
        });
        this.videoAd.onError((error) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(error));
            this.load_success_video = false;
            this.tryGetNextAdId("video");
            this.retryLoadVideo();
        });
        this.videoAd.onClose((res) => {
            this.geAdShowReport("video");
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
        });
        this.videoAd.load();
    }

    getVideoFlag(): boolean {
        return this.load_success_video;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.getVideoFlag()) {
            callback("videoNotLoad", {});
            return;
        }
        this.showVideoPhasesCallback = callback;
        this.isVideoTrigInout = true;
        this.videoAd && this.videoAd.show();
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

    private preOrder(productExternalId: string, callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.HUAWEI_PRE_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                callback(ret, res);
            });
    }

    private isEnvReady(callback: (ret: boolean) => void): void {
        // @ts-ignore
        qg.isEnvReady({
            isEnvReadyReq: {
                // 替换为真实有效的APP ID 
                "applicationID": this.appid
            },
            success: (data) => {
                this.xLog("isEnvReady data:" + JSON.stringify(data));
                callback(true);
            },
            fail: (data, code) => {
                this.xLog("不支持华为IAP支付", "data:" + data + " code:" + code);
                callback(false);
            }
        })
    }

    // 获取商品信息
    private obtainProductInfo(params: object, callback: (ret: boolean, res: object) => void): void {
        // @ts-ignore
        qg.obtainProductInfo({
            productInfoReq: {
                "priceType": 0,
                "productIds": [params["productExternalId"]],
                // 替换为真实有效的APP ID
                "applicationID": this.appid
            },
            success: (data) => {
                this.xLog("obtainProductInfo success:" + JSON.stringify(data));
                callback(true, data);
            },
            fail: (data, code) => {
                this.xLog("obtainProductInfo fail:" + JSON.stringify(data) + " code=" + code);
                callback(false, data);
            }
        });
    }

    pay(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.switch_pay) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
            callback("payError", { msg: CallbackMsg.PAY_SWITCH_NOT_ENABLE });
            return;
        }
        if (!this.loginParams["huawei"]["playerSSign"]) {
            this.xLog(CallbackMsg.USER_NOT_LOGIN.toString());
            callback("payError", { msg: CallbackMsg.PAY_SWITCH_NOT_ENABLE });
            this.isReLogin = true;
            this.channelLogin();
            return;
        }
        let productExternalId: string = params["productExternalId"];
        this.xLog("productExternalId:" + productExternalId);
        this.isEnvReady((ret0: boolean) => {
            if (ret0) {
                this.isPayTrigOnshow = true;
                this.obtainProductInfo(params, (ret: boolean, res: object) => {
                    if (ret && res["productInfoList"] && res["productInfoList"].length > 0) {
                        this.preOrder(productExternalId, (ret1: boolean, res1: object) => {
                            if (ret1 && res1["data"]["purchaseIntentReq"]) {
                                // @ts-ignore
                                qg.createPurchaseIntent({
                                    purchaseIntentReq: {
                                        applicationID: res1["data"]["purchaseIntentReq"]["applicationID"],
                                        publicKey: res1["data"]["purchaseIntentReq"]["publicKey"],
                                        productId: res1["data"]["purchaseIntentReq"]["productId"],
                                        priceType: 0,
                                        developerPayload: res1["data"]["purchaseIntentReq"]["developerPayload"]
                                    },
                                    success: (data) => {
                                        this.xLog("createPurchaseIntent success:" + JSON.stringify(data));
                                    },
                                    fail: (data, code) => {
                                        this.xLog("createPurchaseIntent fail:" + JSON.stringify(data) + " code:" + code);
                                        callback("orderPayFail", data);
                                    }
                                })
                            } else {
                                callback("preOrderFail", res1);
                            }
                        });
                    } else {
                        callback("payError", { msg: CallbackMsg.PRODUCT_ID_NOT_SAME });
                    }
                });
            } else {
                callback("payError", { msg: CallbackMsg.NOT_SUPPORT_IAP });
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
        if (!orderNo || !this.payPublishKey || !this.purchaseTokenMap[orderNo]) {
            this.xLog(CallbackMsg.ORDER_NOT_FOUND.toString());
            return;
        }
        // @ts-ignore
        qg.consumeOwnedPurchase({
            consumeOwnedPurchaseReq: {
                applicationID: this.appid,
                purchaseToken: this.purchaseTokenMap[orderNo],
                publicKey: this.payPublishKey
            },
            success: (data) => {
                this.consumeOrder(orderNo);
            },
            fail: (data) => {
                this.xLog("qg.consumeOwnedPurchase fail:" + data);
            }
        })
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
        // @ts-ignore
        qg.hasShortcutInstalled({
            success: (res) => {
                this.xLog("hasInstalledSuccess:" + JSON.stringify(res));
                if (res) {
                    // 桌面图标已创建
                    callback(false);
                } else {
                    // 桌面图标未创建
                    callback(true);
                }
            },
            fail: (res) => {
                this.xLog("hasInstalled fail:" + JSON.stringify(res));
                callback(false);
            },
            complete: () => {
                this.xLog("hasInstalled complete");
            }
        });
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        qg.installShortcut({
            message: '将快捷方式添加到桌面，方便下次使用',
            success: (ret) => {
                this.xLog('handling install success');
                callback(true);
            },
            fail: (erromsg, errocode) => {
                this.xLog('handling install fail: ' + erromsg + ", errocode: " + errocode);
                callback(false);
            },
            complete: () => {
                this.xLog("handling install  complete");
            }
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