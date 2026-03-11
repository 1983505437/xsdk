import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Weixin";
/*
 * @Author: Vae 
 * @Date: 2023-10-09 12:14:11 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 15:55:11
 */
export default class WeixinSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "wechat": {
            "jsCode": ""
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
    private switch_native_icon: boolean = false;
    private switch_box: boolean = false;
    private switch_block: boolean = false;
    private switch_native_template_banner: boolean = false;

    // 广告id
    private id_banner: string = "";
    private id_inters: string = "";
    private id_video: string = "";
    private id_native_icon: string = "";
    private id_box: string = "";
    private id_block: string = "";
    private id_native_template_banner: string = "";

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
    private number_inters_popup: number = 0;
    private intersPopupType: string = "SCREEN";

    // 插屏多合一
    private probability_inters: number = 100;
    private probability_native_inters: number = 0;
    private probability_native_template_inters: number = 0;
    private probability_navigate_inters: number = 0;
    private probability_video: number = 0;

    // force 强弹广告
    private switch_force: boolean = false;
    private time_first_force_delay: number = 30;
    private time_force_interval: number = 30;
    private forceType: string = "SCREEN";
    private number_force_start: number = 0;
    private num_force_max: number = 0;

    // 切入切出控制
    private switch_inout: boolean = false;
    private probability_inout_inters: number = 100;
    private probability_inout_template_inters: number = 0;
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
    private timeout_refresh_banner: number = -1;
    private timestamp_last_hide_banner: number = 0;

    // inters
    private systemIntersAd: any = null;
    private load_success_system_inters: boolean = false;
    private timestamp_last_hide_inters: number = 0;
    private num_inters_now_show: number = 0;
    private num_system_inters_now_show: number = 0;
    private num_system_inters_max_show: number = 5;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;
    private time_system_inters_show_interval: number = 10;
    private num_inters_r_show: number = 0;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private timeout_retry_load_video: number = -1;

    // force
    private time_now_force: number = 0;
    private achieveFirstForce: boolean = false;
    private number_now_force: number = 0;
    private num_now_real_force: number = 0;

    // nativeIcon
    private nativeIconAd: any = null;
    private load_success_native_icon: boolean = false;
    private ratio_native_icon_x: number = 0;
    private ratio_native_icon_y: number = 0;
    private timeout_refresh_native_icon: number = -1;
    private hasShowNativeIcon: boolean = false;

    // nativeIcon2
    private nativeIconAd2: any = null;
    private load_success_native_icon2: boolean = false;
    private ratio_native_icon_x2: number = 0;
    private ratio_native_icon_y2: number = 0;
    private timeout_refresh_native_icon2: number = -1;
    private hasShowNativeIcon2: boolean = false;

    // nativeMoreGridAd
    private nativeMoreGridAd: any = null;
    private load_success_native_more: boolean = false;
    private timeout_retry_load_native_more: number = -1;

    // nativeMatrixGridAd
    private nativeMatrixGridAd: any = null;
    private load_success_native_matrix: boolean = false;
    private timeout_retry_load_native_matrix: number = -1;

    // 引力引擎
    private isInitGE: boolean = false;
    private accessToken: string = "";
    private openId: string = "";
    private ge: any;
    private versionCode: number = 1;

    // 玄铁
    private isInitEAS: boolean = false;
    private easAppId: string = "";
    private pkgName: string = "";
    private versionName: string = "";
    private sceneValue: string = "";
    private eas: any;
    private num_active_days: number = 1;
    private num_inters_show: number = 0;
    private num_video_show: number = 0;
    private num_pay_complete: number = 0;

    // 优策引擎
    private isInitAB: boolean = false;
    private abGameId: string = "";
    private abApiKey: string = "";

    // 腾讯广告归因
    private isInitTA: boolean = false;
    private ta;
    private taAppId: string = "";
    private taSecretKey: string = "";
    private taSourceId: number = 0;
    private taWaitReportOrder: string = "";

    // 切入切出
    private num_now_inout: number = 0;
    private num_now_inout_interval: number = 0;
    private time_now_inout_interval: number = 999;
    private achieveFirstInout: boolean = false;

    // pay
    private payCallback: (res: object[]) => void;
    private isReLogin: boolean = false;
    private switch_pay: boolean = false;
    // private completeOrders: string[] = [];
    private completeOrdersString: string = "";
    private timeout_req_not_complete_orders: number = -1;
    private reqNum: number = 0;
    private payResultCallback: any;
    private isIosOpenCustomer: boolean = false;
    //处理待扣除虚拟币的订单
    private handlePendingOrderComplete: boolean = false;

    private systemInfo: { isStand: boolean, platform: string, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
        windowWidth: 0,
        windowHeight: 0
    };
    private userInfo: object;

    // 获取签名参数结果回调
    private getRawDataSignatureResultCallback: any;
    // 下次激励视频适合分享？
    private nextVideoFitShare: boolean = false;
    // 同步存档定时器
    private syncArchiveTimeout: number = -1;
    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 广告开关参数
    private switch_ad: object;


    private runPerSecond(): void {
        setInterval(() => {
            this.doForce();
        }, 1000);
    }

    private doForce(): void {
        if (!this.switch_force) return;
        if (this.num_now_real_force >= this.num_force_max) {
            return;
        }
        this.time_now_force++;
        // 未达到首次强弹
        if (!this.achieveFirstForce) {
            // 达到首次强弹延时时间 算作第一次
            if (this.time_now_force >= this.time_first_force_delay && this.getAdFlagByForce()) {
                this.number_now_force++;
                this.achieveFirstForce = true;
                this.time_now_force = 0;
                // 达到开始次数
                if (this.number_now_force >= this.number_force_start) {
                    this.showAdByForce();
                } else {
                    this.xLog("not attach force start");
                }
            }
            return;
        }
        // 是否达到间隔时间
        if (this.time_force_interval > 0 && this.time_now_force >= this.time_force_interval && this.getAdFlagByForce()) {
            this.number_now_force++;
            this.time_now_force = 0;
            // 达到开始次数
            if (this.number_now_force >= this.number_force_start) {
                this.showAdByForce();
            } else {
                this.xLog("not attach force start");
            }
        }
    }

    private getAdFlagByForce(): boolean {
        switch (this.forceType) {
            case "SCREEN":
                return this.getIntersFlag();
            case "VIDEO":
                return this.getVideoFlag();
            default:
                return false;
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

    private getShowInterTypeByInoutSetting(): string {
        let canShowType: string[] = [];
        if (this.load_success_system_inters && this.probability_inout_inters > 0) {
            canShowType.push("inters");
        }
        if (this.load_success_video && this.probability_inout_video > 0) {
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
        this.getSystemInfo();
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin(null, null);
        })
        // this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
        this.completeOrdersString = LocalStorage.getStringData("completeOrdersString");
        this.onAppShow();
        if (params && params["accessToken"]) this.accessToken = params["accessToken"];
        if (params && params["versionCode"]) this.versionCode = params["versionCode"];
        if (params && params["easAppId"]) this.easAppId = params["easAppId"];
        if (params && params["pkgName"]) this.pkgName = params["pkgName"];
        if (params && params["versionName"]) this.versionName = params["versionName"];
        if (params && params["abGameId"]) this.abGameId = params["abGameId"];
        if (params && params["abApiKey"]) this.abApiKey = params["abApiKey"];
        if (params && params["taAppId"]) this.taAppId = params["taAppId"];
        if (params && params["taSecretKey"]) this.taSecretKey = params["taSecretKey"];
        if (params && params["taSourceId"]) this.taSourceId = params["taSourceId"];
        this.runPerSecond();
        this.addOnHideListener();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        wx.onHide(() => {
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
        wx.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["wechat"]["jsCode"] = res["code"];
                    HttpRequest.getInstance().request(RequestUrl.SIGN_IN_URL, "POST", { "content-type": "application/json" }, this.loginParams, (ret: boolean, res: object) => {
                        if (ret) {
                            if (res && res["data"]["token"]) LocalStorage.setStringData("token", res["data"]["token"]);
                            if (res && res["data"]["gameUserId"]) LocalStorage.setStringData("gameUserId", res["data"]["gameUserId"]);
                            this.userInfo = res["data"];
                        }
                        callback && callback({ ret: ret, userInfo: this.userInfo });
                    })
                } else {
                    this.xLog("登录失败：", res);
                    callback && callback({ ret: false, userInfo: this.userInfo });
                }
            },
            fail: (res) => {
                this.xLog("登录失败：", res);
                callback && callback({ ret: false, userInfo: this.userInfo });
            }
        })
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private onAppShow(): void {
        // @ts-ignore
        wx.onShow(() => {
            this.doInout();
            if (this.isIosOpenCustomer) {
                setTimeout(() => {
                    this.reqNotCompleteOrders();
                    this.isIosOpenCustomer = false;
                }, 500);
            }
        });
    }

    private reqNotConsumeOrders(callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.NOT_CONSUME_LIST, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            {}, (ret: boolean, res: object) => {
                callback(ret, res);
            });
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
        let info = wx.getSystemInfoSync();
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

    private reqNotCompleteOrders(): void {
        let lashReqTime = 0;
        let reqIntervalTime = 500;

        let reqFunc = () => {
            // 如果有定时器且请求次数大于3
            if (this.reqNum >= 3 && this.timeout_req_not_complete_orders != -1) {
                clearInterval(this.timeout_req_not_complete_orders);
                this.timeout_req_not_complete_orders = -1;
                return;
            }
            if ((new Date().getTime() - lashReqTime) <= reqIntervalTime) {
                return;
            }
            this.reqNum++;
            this.xLog("reqNotConsumeOrders..." + this.reqNum);
            lashReqTime = new Date().getTime();
            this.handleNotConsumeOrders();
        }

        let run = () => {
            this.reqNum = 0;
            if (this.timeout_req_not_complete_orders != -1) return;
            this.timeout_req_not_complete_orders = setInterval(() => {
                reqFunc();
            }, 1000);
        };

        run();
    }

    //处理补单
    private handleNotConsumeOrders(): void {
        let pendingOrder: [] = [];
        this.reqNotConsumeOrders((ret, res) => {
            if (!ret || !res["data"] || res["data"].length <= 0) {
                return;
            }
            let orderList: [] = res["data"];
            let nowIndex = 0;
            let finalList = [];
            let handleArray = () => {
                // this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
                this.completeOrdersString = LocalStorage.getStringData("completeOrdersString");
                if (orderList.length > 0 && nowIndex < orderList.length) {
                    if (!this.completeOrdersString.includes(orderList[nowIndex]["orderNo"]) || orderList[nowIndex]["force"]) {
                        if (orderList[nowIndex]["orderSourcePlatform"] == "ANDROID" && orderList[nowIndex]["paymentCoinStatus"] == "PENDING") {
                            pendingOrder.push(orderList[nowIndex]["orderNo"]);
                        } else {
                            finalList.push(orderList[nowIndex]);
                        }
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
            if (finalList.length > 0) {
                for (let index = 0; index < finalList.length; index++) {
                    let element = finalList[index];
                    this.taPayEventReport(element["orderNo"]);
                }
                this.payCallback && this.payCallback(finalList);
            }
            this.handlePendingOrder(pendingOrder);
        });
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

    private reChannelLogin(cbSuccess: any, cbFailure: any): void {
        // @ts-ignore
        wx.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["wechat"]["jsCode"] = res["code"];
                    this.reServerLogin(cbSuccess, cbFailure);
                } else {
                    this.xLog("登录失败：", res);
                    this.loginParams["type"] = "GUEST";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                    cbFailure && cbFailure();
                }
            },
            fail: (res) => {
                this.xLog("登录失败：", res);
                this.loginParams["type"] = "GUEST";
                this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                cbFailure && cbFailure();
            }
        })
    }

    private reServerLogin(cbSuccess: any, cbFailure: any): void {
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
                cbSuccess && cbSuccess();
            } else {
                cbFailure && cbFailure();
            }
        })
    }

    private channelLogin(cbSuccess: any, cbFailure: any): void {
        // 使分享到朋友、分享到朋友圈可用
        // @ts-ignore
        wx.showShareMenu({
            withShareTicket: true,
            menus: ["shareAppMessage", "shareTimeline"]
        })
        // @ts-ignore
        wx.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["wechat"]["jsCode"] = res["code"];
                    this.phasesCallbackToInitSdk("channelLoginSuccess", res);
                    cbSuccess && cbSuccess();
                } else {
                    this.xLog("登录失败：", res);
                    this.loginParams["type"] = "GUEST";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                    this.phasesCallbackToInitSdk("channelLoginFail", res);
                    cbFailure && cbFailure();
                }
                this.serverLogin();
            },
            fail: (res) => {
                this.xLog("登录失败：", res);
                this.loginParams["type"] = "GUEST";
                this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                this.serverLogin();
                if (cbFailure) {
                    cbFailure();
                }
            }
        })
    }

    // ge广告展示事件上报
    private geAdShowEventReport(adType: string): void {
        if (!this.ge) return;
        switch (adType) {
            case "inters":
                this.ge.adShowEvent("interstitial", this.id_inters, {});
                break;
            case "video":
                this.ge.adShowEvent("reward", this.id_video, {});
                break;
        }
    }

    private initAB(params: any, callback: (success: boolean) => void): void {
        if (!this.abGameId) {
            callback(false);
            return;
        }
        if (!this.abApiKey) {
            callback(false);
            return;
        }
        if (this.isInitAB) {
            callback(false);
            return;
        }
        this.isInitAB = true;
        let config = {
            gameId: this.abGameId, // 项目游戏ID，必选，可以在ABetterChoice平台管理页查看
            apiKey: this.abApiKey, // 项目API KEY，必选，可以在ABetterChoice平台管理页查看
            unitId: params["externalId"], // 登陆的用户帐号，必选，若不填，则在login之前都用访客ID做用户ID，可能会导致数据计算有误差
            autoTrack: {   // 可选，自动采集配置，默认全部关闭
                mgShow: true,  // 自动采集，小程序启动，或从后台进入前台，可选
                mgHide: true,  // 自动采集，小程序从前台进入后台，可选
                mgShare: true, // 自动采集，小程序分享时自动采集，可选
            },
            enableAutoExposure: true // 可选，实验分流使用，默认值为false。如果设置为true，当调用AB实验分流时，曝光数据将自动上报。
        }
        this.xLog("initAB config:" + JSON.stringify(config));
        // @ts-ignore
        ABetterChoice.init(config).then((initResult) => {
            this.xLog('初始化结果：' + initResult);
            callback(true);
        });
    }

    getABInfoByName(name: string): object {
        if (!this.isInitAB) return {};
        // 获取实验分流信息
        // @ts-ignore
        let experiment = ABetterChoice.getExperiment(name);
        if (!experiment) {
            // 无命中，执行默认版本
            this.xLog("未命中实验，执行默认版本");
            return {};
        }
        return experiment;
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

        this.ge.initialize({
            name: params["name"],
            version: this.versionCode,
            openid: this.openId,
        }).then((res) => {
            this.xLog("initGE success " + JSON.stringify(res));
            this.ge.registerEvent();
            this.xLog("ge registerEvent");
        }).catch((err) => {
            this.xLog("initGE fail " + JSON.stringify(err));
        });
    }

    private initTA(params: any): void {
        if (this.isInitTA) return;
        if (!this.taAppId) return;
        if (!this.taSecretKey) return;
        if (this.taSourceId == 0) return;
        if (!params || !params["externalId"]) return;
        this.isInitTA = true;
        // @ts-ignore
        this.ta = new SDK({
            user_action_set_id: this.taSourceId,
            secret_key: this.taSecretKey,
            appid: this.taAppId,
            openid: params["externalId"],
            user_unique_id: params["uid"],
            auto_track: true
        });
        this.ta.setOpenId(params["externalId"]);
        let openIdStore = LocalStorage.getStringData("taOpenId");
        let isReactive = LocalStorage.getStringData("isReactive");
        if (!openIdStore) {
            // 新用户
            this.ta.onRegister();
            this.ta.onCreateRole(params["uid"]);
            LocalStorage.setStringData("taOpenId", params["externalId"]);
        } else {
            // 老用户
            if (!isReactive) {
                this.ta.track('RE_ACTIVE', { backFlowDay: 30 });
                LocalStorage.setStringData("isReactive", "1");
            }
            this.taPayEventReportAfterInitTa();
        }
        this.addTaActionListener();
    }

    private addTaActionListener() {
        // @ts-ignore
        wx.onShareAppMessage(() => {
            this.ta.track('SHARE', { target: 'APP_MESSAGE' });
        });
        // @ts-ignore
        wx.onShareTimeline(() => {
            this.ta.track('SHARE', { target: 'TIME_LINE' });
        });
        // @ts-ignore
        wx.onAddToFavorites(() => {
            this.ta.track('ADD_TO_WISHLIST', { type: 'default' });
        });
    }

    private initEAS(params: any): void {
        if (!this.pkgName) return;
        if (!this.easAppId) return;
        if (!this.versionName) return;
        if (this.isInitEAS) return;
        if (!params || !params["externalId"]) return;
        this.isInitEAS = true;
        this.openId = params["externalId"];
        //微信、抖音小游戏  初始化SDK前需带openid唯一标识用户（必填）
        var config = {
            appId: this.easAppId, // 项目 APP ID
            requestUrl: "https://e5log1.fineboost.cn/track/h5/", // 上报地址
            regUrl: "https://spatial.fineboost.cn/egs", // 请求reg
            fidUrl: "https://epcfg.fineboost.cn/sapi/v5", // 请求fid
            gettimeUrl: "https://spatial.fineboost.cn/gettime", // 获取服务器时间戳
            pkgName: this.pkgName, // 根据规则上传，平台应用id
            currentVersion: this.versionName, // 当前游戏版本
            store: "wx", // 投放市场
            logShow: true  //日志打印，false不输出log日志，默认true
        };
        // @ts-ignore
        this.eas = new EasAnalyticsAPI(config);
        this.eas.login(params["uid"]);
        this.eas.setOpenid(this.openId);
        this.eas.init();
        // 是否首次进入游戏
        let is_first_run: boolean = LocalStorage.getStringData("is_first_run") == "";
        // 获取最后运行日期
        let current_date = this.getCurrentDate();
        // 获取首次进入游戏时间
        let __first_start_time: string = LocalStorage.getStringData("__first_start_time");
        let timestamp: number = Math.round(__first_start_time ? Number(__first_start_time) : new Date().getTime() / 1000);
        LocalStorage.setStringData("__first_start_time", timestamp + "");
        this.eas.setSuperProperties({
            __first_start_time: timestamp
        });
        this.eas.userSetOnce({
            __first_start_time: timestamp
        });
        // 首次进入游戏
        if (is_first_run) {
            if (this.sceneValue) {
                this.eas.userSet({ user_channel: this.sceneValue });
                LocalStorage.setStringData("sceneValue", this.sceneValue);
            }
            // 存储最后运行日期
            LocalStorage.setStringData("last_run_date", current_date);
            // 活跃天数设置用户属性
            this.eas.userSet({ active_days: this.num_active_days });
        } else {
            // 非首次进入游戏
            this.sceneValue = LocalStorage.getStringData("sceneValue");
            this.num_inters_show = isNaN(Number(LocalStorage.getStringData("num_inters_show"))) ? 0 : Number(LocalStorage.getStringData("num_inters_show"));
            this.num_video_show = isNaN(Number(LocalStorage.getStringData("num_video_show"))) ? 0 : Number(LocalStorage.getStringData("num_video_show"));
            this.num_pay_complete = isNaN(Number(LocalStorage.getStringData("num_pay_complete"))) ? 0 : Number(LocalStorage.getStringData("num_pay_complete"));
            this.num_active_days = isNaN(Number(LocalStorage.getStringData("num_active_days"))) ? 0 : Number(LocalStorage.getStringData("num_active_days"));
            let last_run_date = LocalStorage.getStringData("last_run_date");
            // 新的一天，增加活跃天数
            if (last_run_date != current_date) {
                // 存储最后运行日期
                LocalStorage.setStringData("last_run_date", current_date);
                this.num_active_days++;
                // 存储活跃天数
                LocalStorage.setStringData("num_active_days", this.num_active_days + "");
                // 活跃天数设置用户属性
                this.eas.userSet({ active_days: this.num_active_days });
            }
        }
        LocalStorage.setStringData("is_first_run", "0");
    }

    private getCurrentDate() {
        let now = new Date();
        return `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)}`;
    }

    private setVideoTimes() {
        if (!this.isInitEAS) return;
        this.easAdShowEventReport("video");
        this.num_video_show++;
        // 存储展示激励视频次数
        LocalStorage.setStringData("num_video_show", this.num_video_show + "");
        // 激励视频次数设置用户属性
        this.eas.userSet({ user_reward_count: this.num_video_show });
    }

    private setIntersTimes() {
        if (!this.isInitEAS) return;
        this.easAdShowEventReport("inters");
        this.num_inters_show++;
        // 存储展示插屏次数
        LocalStorage.setStringData("num_inters_show", this.num_inters_show + "");
        // 插屏次数设置用户属性
        this.eas.userSet({ user_inter_count: this.num_inters_show });
    }

    private setPayTimes() {
        if (!this.isInitEAS) return;
        this.num_pay_complete++;
        // 存储支付成功次数
        LocalStorage.setStringData("num_pay_complete", this.num_pay_complete + "");
        // 支付成功次数设置用户属性
        this.eas.userSet({ user_pay_count: this.num_pay_complete });
    }

    // eas广告展示事件上报
    private easAdShowEventReport(adType: string): void {
        if (!this.isInitEAS) return;
        switch (adType) {
            case "inters":
                this.eas.trackAdShowEvent("wx", this.id_inters, this.id_inters, "interstitial", "wx", 1, "CNY");
                break;
            case "video":
                this.eas.trackAdShowEvent("wx", this.id_video, this.id_video, "reward", "wx", 1, "CNY");
                break;
        }
    }

    // eas付费事件上报
    private easPayEventReport(orderNo: string, type: string): void {
        if (!this.isInitEAS) return;
        let json = LocalStorage.getJsonData(orderNo);
        if (json) {
            let name = json["name"];
            let price = json["price"];
            let externalId = json["externalId"];
            this.eas.trackPayEvent(price * 100, "CNY", orderNo, 1, name, "wx", type == "create" ? 2 : 1, {
                pay_action: type == "create" ? "pay_try" : "pay_success", pay_order_id: orderNo, pay_product_id: externalId
            });
            return;
        }
        this.getProductInfoByOrderNo(orderNo, (ret: boolean, res: object) => {
            if (!ret || !res) return;
            let name = res["name"];
            let price = res["price"];
            let externalId = res["externalId"];
            this.eas.trackPayEvent(price * 100, "CNY", orderNo, 1, name, "wx", type == "create" ? 2 : 1, {
                pay_action: type == "create" ? "pay_try" : "pay_success", pay_order_id: orderNo, pay_product_id: externalId
            });
        });
    }

    // ta付费事件上报
    private taPayEventReport(orderNo: string): void {
        if (!this.isInitTA) {
            LocalStorage.setStringData("taWaitReportOrder", orderNo);
            return;
        }
        // 判断订单是否已经上报
        // 获取本地已上报的订单
        let ta_has_report_order = LocalStorage.getStringData("ta_has_report_order");
        // 判断是否包含
        if (ta_has_report_order.includes(orderNo)) return;
        // 不包含则存储到本地
        ta_has_report_order = ta_has_report_order + "," + orderNo;
        LocalStorage.setStringData("ta_has_report_order", ta_has_report_order);
        let json = LocalStorage.getJsonData(orderNo);
        if (json) {
            let price = Number(json["data"]["price"]);
            this.xLog("this.ta.onPurchase:" + (price * 100));
            this.ta.onPurchase(price * 100);
            return;
        }
        this.getProductInfoByOrderNo(orderNo, (ret: boolean, res: object) => {
            if (!ret || !res) return;
            let price = res["data"]["price"];
            this.xLog("getProductInfoByOrderNo this.ta.onPurchase:" + (price * 100));
            this.ta.onPurchase(price * 100);
        });
    }

    // ta付费事件上报
    private taPayEventReportAfterInitTa(): void {
        this.taWaitReportOrder = LocalStorage.getStringData("taWaitReportOrder");
        if (!this.taWaitReportOrder) return;
        this.taPayEventReport(this.taWaitReportOrder);
        LocalStorage.setStringData("taWaitReportOrder", "");
    }

    private getProductInfoByOrderNo(orderNo: string, callback: (ret: boolean, res: object) => void) {
        HttpRequest.getInstance().request(RequestUrl.GET_PRODUCT_INFO, "GET",
            { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { orderNo: orderNo }, (ret: boolean, res: object) => {
                callback(ret, res);
                if (ret && res) LocalStorage.setJsonData(orderNo, res);
            });
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
                this.userInfo = res["data"];
                this.phasesCallbackToInitSdk("serverLoginSuccess", res);
                this.initGE(res["data"]);
                this.initEAS(res["data"]);
                this.initAB(res["data"], (success: boolean) => {
                    this.phasesCallbackToInitSdk(success ? "abInitSuccess" : "abInitFail", res);
                });
                this.initTA(res["data"]);
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
        if (!adParams["data"]["paymentStatus"] || (!adParams["data"]["paymentAndroidStatus"] && !adParams["data"]["paymentIOSStatus"])) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
        } else {
            if (this.loginParams["wechat"]["jsCode"]) {
                this.switch_pay = true;
                this.reqNotCompleteOrders();
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
        this.xLog("switch_ad:" + JSON.stringify(switch_ad));
        if (switch_ad) {
            this.switch_ad = switch_ad;
            this.switch_banner = switch_ad["banner"] ? switch_ad["banner"] : false;
            this.switch_inters = switch_ad["screen"] ? switch_ad["screen"] : false;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_native_icon = switch_ad["iconNative"] ? switch_ad["iconNative"] : false;
            this.switch_box = switch_ad["box"] ? switch_ad["box"] : false;
            this.switch_block = switch_ad["block"] ? switch_ad["block"] : false;
            this.switch_native_template_banner = switch_ad["bannerNativeTemplate"] ? switch_ad["bannerNativeTemplate"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        this.xLog("id_ad:" + JSON.stringify(id_ad));
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_inters = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
            this.id_native_icon = id_ad["iconNative"] ? id_ad["iconNative"] : "";
            this.id_box = id_ad["box"] ? id_ad["box"] : "";
            this.id_block = id_ad["block"] ? id_ad["block"] : "";
            this.id_native_template_banner = id_ad["bannerNativeTemplate"] ? id_ad["bannerNativeTemplate"] : "";
        }
        let params_banner_control: object = adParams["data"]["banner"];
        this.xLog("params_banner_control:" + JSON.stringify(params_banner_control));
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
        this.xLog("params_inters_control:" + JSON.stringify(params_inters_control));
        if (params_inters_control && params_inters_control["status"]) {
            this.number_inters_start_show = params_inters_control["beginQty"] ?
                params_inters_control["beginQty"] : 0;
            this.num_inters_interval = params_inters_control["intervalQty"] ?
                params_inters_control["intervalQty"] : 0;
            this.time_inters_interval = params_inters_control["intervalSeconds"] ?
                params_inters_control["intervalSeconds"] : 0;
            this.probability_inters_delay = params_inters_control["delayRate"] ?
                params_inters_control["delayRate"] : 0;
            this.time_inters_delay = params_inters_control["delaySeconds"] ?
                params_inters_control["delaySeconds"] : 0;
            this.number_inters_popup = params_inters_control["popupIndex"] ?
                params_inters_control["popupIndex"] : 0;
            this.intersPopupType = params_inters_control["popupType"] ?
                params_inters_control["popupType"] : "SCREEN";
        }
        let params_inters_more: object = adParams["data"]["screens"];
        this.xLog("params_inters_more:" + JSON.stringify(params_inters_more));
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
                    30 : params_force["firstDelaySeconds"]) : 30;
            this.time_force_interval = params_force["intervalSeconds"] ?
                (params_force["intervalSeconds"] <= 0 ?
                    30 : params_force["intervalSeconds"]) : 30;
            this.forceType = params_force["type"] ?
                params_force["type"] : "SCREEN";
            this.number_force_start = params_force["beginQty"] ?
                params_force["beginQty"] : 0;
            this.num_force_max = params_force["maxQty"] ?
                params_force["maxQty"] : 0;
        }
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
        if (this.switch_video && this.id_video) {
            this.createVideo();
        }
        if (this.switch_native_icon && this.id_native_icon) {
            this.createNativeIcon();
        }
        if (this.switch_box && this.id_box) {
            this.createNativeMatrixGrid();
        }
        if (this.switch_block && this.id_block) {
            this.createNativeMoreGrid();
        }
        if (this.switch_native_template_banner && this.id_native_template_banner) {
            this.createNativeIcon2();
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
        this.bannerAd = wx.createBannerAd({
            adUnitId: this.id_banner,
            style: {
                left: 10,
                top: 76,
                height: 50,
                width: this.systemInfo.isStand ? this.systemInfo.windowWidth : 300
            },
        });
        this.bannerAd.onResize((size) => {
            this.bannerAd.style.top = this.systemInfo.windowHeight - size.height;
            this.bannerAd.style.left = (this.systemInfo.windowWidth - size.width) / 2;
        });
        this.bannerAd.onLoad(() => {
            this.xLog("@@@@@banner广告加载成功@@@@@")
            this.load_success_system_banner = true;
            if (this.hasShowBanner) {
                this.showSystemBanner();
            }
        })

        // 监听系统banner错误
        this.bannerAd.onError((error) => {
            this.xLog("#####banner广告加载失败#####", JSON.stringify(error));
            this.retryLoadBanner();
        })
    }

    private retryLoadBanner(): void {
        this.timeout_retry_load_banner =
            setTimeout(() => {
                this.createSystemBanner();
                clearTimeout(this.timeout_retry_load_banner);
                this.timeout_retry_load_banner = -1;
            }, 10 * 1000);
    }

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_inters)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.systemIntersAd = wx.createInterstitialAd({
            adUnitId: this.id_inters
        });
        this.systemIntersAd.onLoad(() => {
            this.xLog("@@@@@插屏广告加载成功@@@@@");
            this.load_success_system_inters = true;
        });
        this.systemIntersAd.onError((error) => {
            this.xLog("#####插屏广告加载失败#####", JSON.stringify(error));
            this.load_success_system_inters = false;
            this.retryLoadInters();
        });
        this.systemIntersAd.onClose(() => {
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
        });
        this.systemIntersAd.load();
    }

    private retryLoadInters(): void {
        setTimeout(() => {
            this.systemIntersAd && this.systemIntersAd.load();
        }, 30 * 1000)
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = wx.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.videoAd.onLoad((res) => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
            if (res && res.shareValue && res.shareValue == 1) {
                this.nextVideoFitShare = true;
            } else {
                this.nextVideoFitShare = false;
            }
        });
        this.videoAd.onError((error) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(error));
            this.load_success_video = false;
            this.retryLoadVideo();
        });
        this.videoAd.onClose((res) => {
            setTimeout(() => {
                if (res && res.isEnded) {
                    this.xLog("视频广告播放完成");
                    this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayFinish", {});
                    this.videoAd.load();
                } else {
                    this.xLog("视频广告取消播放");
                    this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayBreak", {});
                    this.videoAd.load();
                }
            }, 500)
        });
    }

    private retryLoadVideo(): void {
        if (this.timeout_retry_load_video != -1) return;
        this.timeout_retry_load_video =
            setTimeout(() => {
                this.videoAd && this.videoAd.load();
                clearTimeout(this.timeout_retry_load_video);
                this.timeout_retry_load_video = -1;
            }, 30 * 1000)
    }

    private createNativeIcon(): void {
        this.xLog("*****createNativeIcon*****");
        if (StringUtil.containSpace(this.id_native_icon)) {
            this.xLog("#####原生icon广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.nativeIconAd = wx.createCustomAd({
            adUnitId: this.id_native_icon,
            adIntervals: 30,
            style: {
                left: this.ratio_native_icon_x * this.systemInfo.windowWidth,
                top: this.ratio_native_icon_y * this.systemInfo.windowHeight,
                fixed: true
            }
        });
        this.nativeIconAd.onLoad(() => {
            this.xLog("@@@@@原生单格子广告加载成功@@@@@");
            this.load_success_native_icon = true;
        });
        this.nativeIconAd.onError((error) => {
            this.xLog("#####原生单格子广告加载失败#####", JSON.stringify(error));
            this.load_success_native_icon = false;
        });
        this.nativeIconAd.onClose(() => {
            this.xLog("原生单格子广告关闭,30s后再次刷新");
            this.refreshNativeIcon();
        });
    }

    private createNativeIcon2(): void {
        this.xLog("*****createNativeIcon2*****");
        if (StringUtil.containSpace(this.id_native_template_banner)) {
            this.xLog("#####原生模板banner广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.nativeIconAd2 = wx.createCustomAd({
            adUnitId: this.id_native_template_banner,
            adIntervals: 30,
            style: {
                left: this.ratio_native_icon_x2 * this.systemInfo.windowWidth,
                top: this.ratio_native_icon_y2 * this.systemInfo.windowHeight,
                fixed: true
            }
        });
        this.nativeIconAd2.onLoad(() => {
            this.xLog("@@@@@原生单格子2广告加载成功@@@@@");
            this.load_success_native_icon2 = true;
        });
        this.nativeIconAd2.onError((error) => {
            this.xLog("#####原生单格子2广告加载失败#####", JSON.stringify(error));
            this.load_success_native_icon2 = false;
        });
        this.nativeIconAd2.onClose(() => {
            this.xLog("原生单格子2广告关闭,30s后再次刷新");
            this.refreshNativeIcon2();
        });
    }

    private refreshNativeIcon() {
        if (this.timeout_refresh_native_icon != -1) {
            clearTimeout(this.timeout_refresh_native_icon);
            this.timeout_refresh_native_icon = -1;
        }
        this.hideNativeIcon();
        this.timeout_refresh_native_icon =
            setTimeout(() => {
                this.createNativeIcon();
                setTimeout(() => {
                    this.nativeIconAd.show();
                }, 500);
            }, 30 * 1000);
    }

    private refreshNativeIcon2() {
        if (this.timeout_refresh_native_icon2 != -1) {
            clearTimeout(this.timeout_refresh_native_icon2);
            this.timeout_refresh_native_icon2 = -1;
        }
        this.hideNativeIcon2();
        this.timeout_refresh_native_icon2 =
            setTimeout(() => {
                this.createNativeIcon2();
                setTimeout(() => {
                    this.nativeIconAd2.show();
                }, 500);
            }, 30 * 1000);
    }

    private createNativeMoreGrid(): void {
        this.xLog("*****createNativeMoreGrid*****");
        if (StringUtil.containSpace(this.id_block)) {
            this.xLog("#####积木广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.nativeMoreGridAd = wx.createCustomAd({
            adUnitId: this.id_block,
            style: {
                left: (this.systemInfo.windowWidth > 360 ? this.systemInfo.windowWidth - 360 : 0) / 2,
                top: this.systemInfo.windowHeight < this.systemInfo.windowWidth ? this.systemInfo.windowHeight * 0.7 : this.systemInfo.windowHeight - 140,
                fixed: true
            }
        })
        this.nativeMoreGridAd.onLoad(() => {
            this.xLog("@@@@@原生多格子广告加载成功@@@@@");
            this.load_success_native_more = true;
        });
        this.nativeMoreGridAd.onError((error) => {
            this.xLog("#####原生多格子广告加载失败#####", JSON.stringify(error));
        });
        this.nativeMoreGridAd.onClose(() => {
            this.xLog("原生多格子广告关闭")
            this.hideBlock();
        });
    }

    private createNativeMatrixGrid(): void {
        this.xLog("*****createNativeMatrixGrid*****");
        if (StringUtil.containSpace(this.id_box)) {
            this.xLog("#####盒子广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemInfo.isStand) {
            // @ts-ignore
            this.nativeMatrixGridAd = wx.createCustomAd({
                adUnitId: this.id_box,
                style: {
                    left: (this.systemInfo.windowWidth > 385 ? this.systemInfo.windowWidth - 385 : 0) / 2,
                    top: this.systemInfo.windowHeight * 0.2,
                    fixed: true
                }
            })
        } else {
            // @ts-ignore
            this.nativeMatrixGridAd = wx.createCustomAd({
                adUnitId: this.id_box,
                style: {
                    left: this.systemInfo.windowWidth / 4,
                    top: (this.systemInfo.windowHeight - this.systemInfo.windowWidth / 3) / 2,
                    width: this.systemInfo.windowWidth / 2,
                    fixed: true
                }
            })
        }
        this.nativeMatrixGridAd.onLoad(() => {
            this.xLog("@@@@@原生矩阵格子广告加载成功@@@@@");
            this.load_success_native_matrix = true;
        });
        this.nativeMatrixGridAd.onError((error) => {
            this.xLog("#####原生矩阵格子广告加载失败#####", JSON.stringify(error));
            this.hideNativeMatrixGrid();
        });
        this.nativeMatrixGridAd.onHide(() => {
            this.xLog("原生矩阵格子广告关闭");
            this.hideNativeMatrixGrid();
        });
    }

    private hideNativeMatrixGrid(): void {
        this.load_success_native_matrix = false;
        if (this.nativeMatrixGridAd) {
            this.nativeMatrixGridAd.destroy();
            this.nativeMatrixGridAd = null;
        }
        this.retryLoadNativeMatrixGrid();
    }

    private retryLoadNativeMatrixGrid(): void {
        if (this.timeout_retry_load_native_matrix != -1) return;
        this.timeout_retry_load_native_matrix =
            setTimeout(() => {
                this.createNativeMatrixGrid();
                this.timeout_retry_load_native_matrix = -1;
            }, 10 * 1000);
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

    private refreshBanner(): void {
        if (this.timeout_refresh_banner != -1) return;
        this.timeout_refresh_banner =
            setInterval(() => {
                this.xLog("refreshBanner");
                if (this.bannerAd) {
                    this.bannerAd.destroy();
                    this.bannerAd = null;
                }
                this.createSystemBanner();
            }, this.time_banner_refresh * 1000);
    }

    private hideSystemBanner(): void {
        this.xLog("hideSystemBanner");
        this.bannerAd && this.bannerAd.hide();
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
    }

    private getPByType(type: string): number {
        switch (type) {
            case "inters":
                return this.probability_inters;
            case "nativeMatrixGrid":
                return this.probability_native_template_inters;
            case "video":
                return this.probability_video;
            default:
                return 0;
        }
    }

    private getShowInterTypeBySetting(): string {
        let canShowType: string[] = [];
        // 达到插屏固定弹出条件
        if (this.number_inters_popup > 0 && this.num_inters_r_show == this.number_inters_popup) {
            if (this.intersPopupType == "SCREEN") {
                canShowType.push("inters");
            } else {
                canShowType.push("video");
            }
            this.xLog("inters popup type:" + canShowType[0]);
            return canShowType[0];
        }
        if (this.load_success_system_inters && this.probability_inters > 0 && this.num_system_inters_now_show < this.num_system_inters_max_show) {
            canShowType.push("inters");
        }
        if (this.load_success_native_matrix && this.probability_native_template_inters > 0) {
            canShowType.push("nativeMatrixGrid");
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
            case "inters":
                this.showSystemInters();
                break;
            case "nativeMatrixGrid":
                this.showNativeMatrixGrid();
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
        if (this.systemIntersAd && this.load_success_system_inters && (new Date().getTime() - this.timestamp_last_hide_inters >= this.time_system_inters_show_interval * 1000) && this.num_system_inters_now_show < this.num_system_inters_max_show) {
            this.num_system_inters_now_show++;
            this.xLog("showSystemInters:" + this.num_system_inters_now_show);
            this.systemIntersAd.show().then(() => {
                this.geAdShowEventReport("inters");
                this.setIntersTimes();
            }).catch((error) => {
                this.xLog("#####系统插屏广告展示失败#####", JSON.stringify(error));
                this.intersPhasesCallback("intersShowFail");
                if (error.errCode == 2003) {
                    this.systemIntersAd && this.systemIntersAd.destroy();
                    this.systemIntersAd = null;
                    this.createSystemInters();
                }
                if (error.errCode == 2002) {
                    setTimeout(() => {
                        this.systemIntersAd && this.systemIntersAd.destroy();
                        this.systemIntersAd = null;
                        this.createSystemInters();
                    }, 10 * 1000);
                    this.time_system_inters_show_interval += this.time_system_inters_show_interval;
                }
            })
        }
    }

    private showNativeMatrixGrid(): void {
        if (this.nativeMatrixGridAd) {
            this.nativeMatrixGridAd.show();
            this.setIntersTimes();
        }
    }

    getIntersFlag(): boolean {
        let systemIntersLoad: boolean = this.load_success_system_inters && this.probability_inters > 0 && this.num_system_inters_now_show < this.num_system_inters_max_show;
        let nativeMatrixLoad: boolean = this.load_success_native_matrix && this.probability_native_template_inters > 0;
        let videoLoad: boolean = this.load_success_video && this.probability_video > 0;
        return systemIntersLoad || nativeMatrixLoad || videoLoad;
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
        this.num_inters_r_show++;
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
        return this.load_success_video;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        this.showVideoPhasesCallback = callback;
        if (!this.getVideoFlag()) {
            callback("videoNotLoad", {});
            return;
        }
        this.xLog("showVideo");
        this.load_success_video = false;
        this.nextVideoFitShare = false;
        this.videoAd.show().then(() => {
            this.xLog("激励视频广告展示成功");
            this.geAdShowEventReport("video");
            this.setVideoTimes();
        })
            .catch((err) => {
                this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
                this.showVideoPhasesCallback("videoPlayBreak", {});
            });
    }

    getNativeIconFlag(): boolean {
        return this.load_success_native_icon;
    }

    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void {
        if (this.hasShowNativeIcon) return;
        this.hasShowNativeIcon = true;
        this.ratio_native_icon_x = params["ratio_native_icon_x"];
        this.ratio_native_icon_y = params["ratio_native_icon_y"];
        this.nativeIconAd && this.nativeIconAd.destroy();
        if (this.switch_native_icon && this.id_native_icon) this.createNativeIcon();
        setTimeout(() => {
            this.xLog("showNativeIcon");
            this.nativeIconAd && this.nativeIconAd.show();
        }, 500);
    }

    hideNativeIcon(): void {
        this.xLog("hideNativeIcon");
        if (this.timeout_refresh_native_icon != -1) {
            clearTimeout(this.timeout_refresh_native_icon);
            this.timeout_refresh_native_icon = -1;
        }
        this.nativeIconAd && this.nativeIconAd.destroy();
        this.hasShowNativeIcon = false;
    }

    getNativeIconFlag2(): boolean {
        return this.load_success_native_icon2;
    }

    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void {
        if (this.hasShowNativeIcon2) return;
        this.hasShowNativeIcon2 = true;
        this.ratio_native_icon_x2 = params["ratio_native_icon_x"];
        this.ratio_native_icon_y2 = params["ratio_native_icon_y"];
        this.nativeIconAd2 && this.nativeIconAd2.destroy();
        if (this.switch_native_template_banner && this.id_native_template_banner) this.createNativeIcon2();
        setTimeout(() => {
            this.xLog("showNativeIcon2");
            this.nativeIconAd2 && this.nativeIconAd2.show();
        }, 500);
    }

    hideNativeIcon2(): void {
        this.xLog("hideNativeIcon2");
        if (this.timeout_refresh_native_icon2 != -1) {
            clearTimeout(this.timeout_refresh_native_icon2);
            this.timeout_refresh_native_icon2 = -1;
        }
        this.nativeIconAd2 && this.nativeIconAd2.destroy();
        this.hasShowNativeIcon2 = false;
    }

    getBlockFlag(): boolean {
        return this.load_success_native_more;
    }

    showBlock(params?: object, callback?: (phases: string, res: object) => void): void {
        if (!this.getBlockFlag()) return;
        this.nativeMoreGridAd && this.nativeMoreGridAd.show();
    }

    hideBlock(): void {
        this.xLog("hideBlock");
        this.load_success_native_more = false;
        this.nativeMoreGridAd && this.nativeMoreGridAd.destroy();
        this.nativeMoreGridAd = null;
        if (this.timeout_retry_load_native_more != -1) return;
        this.timeout_retry_load_native_more =
            setTimeout(() => {
                this.createNativeMoreGrid();
                this.timeout_retry_load_native_more = -1;
            }, 5000);
    }

    phoneVibrate(type: string): void {
        if (type == "long") {
            // @ts-ignore
            wx.vibrateLong({
                success(res) {
                },
                fail(res) {
                }
            });
        }
        else if (type == "short") {
            // @ts-ignore
            wx.vibrateShort({
                type: "heavy",
                success(res) {
                },
                fail(res) {
                }
            });
        }
    }

    shareApp(): void {
        if (this.isInitTA) {
            this.ta.track('SHARE', { target: 'APP_MESSAGE' });
        }
        // @ts-ignore
        wx.shareAppMessage({});
    }

    private preMidasOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.WEIXIN_PRE_ORDER_MIDAS, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preMidasOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preJsPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.WEIXIN_PRE_ORDER_JSPAY, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preJsPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    // 尝试消费游戏币余额
    private tryConsumeBalance(orderNo: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.WEIXIN_PAY_BALANCE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { orderNo: orderNo }, (ret: boolean, res: object) => {
                    this.xLog("tryConsumeBalance ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                });
        });
    }

    private genPayResponseObject(productExternalId, orderNo, code, codeMsg): object {
        let res = {
            productExternalId: productExternalId,
            orderNo: orderNo,
            code: code,
            codeMsg: codeMsg
        }
        return res;
    }

    private callbackPayResultToClient(msg, object): void {
        if (!this.payResultCallback) return;
        if (this.completeOrdersString.includes(object["orderNo"])) return;
        this.payResultCallback(msg, object);
    }

    private checkSession(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            wx.checkSession({
                success: () => {
                    //session_key 未过期，并且在本生命周期一直有效
                    resolve(true);
                },
                fail() {
                    // session_key 已经失效，需要重新执行登录流程
                    resolve(false);
                }
            })
        });
    }

    private requestMidasPayment(midasOfferId, midasBuyQuantity, orderNo): Promise<any> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            wx.requestMidasPayment({
                mode: "game",
                env: 0,
                offerId: midasOfferId,
                currencyType: "CNY",
                platform: "android",
                buyQuantity: midasBuyQuantity,
                outTradeNo: orderNo,
                success: (res0) => {
                    this.xLog("requestMidasPayment pay success:" + JSON.stringify(res0));
                    this.taPayEventReport(orderNo);
                    resolve({ ret: true });
                },
                fail: (res0) => {
                    this.xLog("requestMidasPayment pay fail:" + JSON.stringify(res0));
                    resolve({ ret: false, code: res0["code"], codeMsg: res0["codeMsg"] });
                }
            })

        });
    }

    //登录再重试支付
    private loginRetryPay(params, callback): void {
        this.xLog("loginRetryPay...", params);
        // @ts-ignore
        wx.showLoading({ title: "请求中...请稍等", mask: true });
        setTimeout(() => {
            // @ts-ignore
            wx.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.reChannelLogin(() => {
            // @ts-ignore
            wx.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            wx.hideLoading();
            //登录失败，再次尝试支付
            this.pay(params, callback);
        });
    }

    //处理待扣除虚拟币的订单
    private async handlePendingOrder(orderNoList: string[]): Promise<void> {
        if (this.handlePendingOrderComplete) {
            return;
        }
        this.handlePendingOrderComplete = true;
        if (!orderNoList) {
            return;
        }
        if (orderNoList.length <= 0) {
            return;
        }

        let success = false;
        for (let i = 0; i < orderNoList.length; i++) {
            let element = orderNoList[i];
            let payBalanceSuccess = false;
            let tryConsumeBalanceObj = await this.tryConsumeBalance(element);
            if (!tryConsumeBalanceObj["ret"]) {
                return;
            }
            try {
                payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
            } catch (error) {
                return;
            }
            if (!payBalanceSuccess) {
                return;
            }
            success = true;
        }

        if (success) {
            //走一次补单流程
            this.handleNotConsumeOrders();
        }
    }

    async pay(params: object, callback: (phases: string, res: object) => void): Promise<void> {
        this.xLog("pay...", JSON.stringify(params));
        //是否触发过登录重试
        let retryLogin = false;
        if (params["retryLogin"]) {
            retryLogin = params["retryLogin"];
        }
        this.payResultCallback = callback;

        if (!this.switch_pay) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
            this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", CallbackMsg.PAY_SWITCH_NOT_ENABLE));
            return;
        }

        let sessionPass = await this.checkSession();
        if (!this.loginParams["wechat"]["jsCode"] || !sessionPass) {
            this.xLog("用户未登录或登录已过期");
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryPay(params, callback);
            } else {
                // @ts-ignore
                wx.showToast({ title: "payError" });
                this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录或登录已过期"));
            }
            return;
        }

        // @ts-ignore
        wx.showToast({ title: "请求支付中...", mask: true });

        let productExternalId: string = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        let midasOfferId;
        let midasBuyQuantity;
        let payBalanceSuccess = false;
        let payFail = (msg) => {
            this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        };
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // android
        if (this.systemInfo.platform === "android" || this.systemInfo.platform === "windows" || this.systemInfo.platform === "mac") {
            // 预下单
            let preMidasOrderObj = await this.preMidasOrder(productExternalId);
            if (!preMidasOrderObj.ret) {
                // @ts-ignore
                wx.showToast({ title: "preOrderFail" });
                payFail("preOrderFail");
                return;
            }
            try {
                orderNo = preMidasOrderObj.res.data.orderNo;
                code = preMidasOrderObj.res.code;
                codeMsg = preMidasOrderObj.res.codeMsg;
                midasOfferId = preMidasOrderObj.res.data.midasOfferId;
                midasBuyQuantity = preMidasOrderObj.res.data.midasBuyQuantity;
            } catch (error) {
                // @ts-ignore
                wx.showToast({ title: "preMidasOrderObjDataFail" });
                payFail("preMidasOrderObjDataFail");
                return;
            }

            this.easPayEventReport(orderNo, "create");

            //消费余额
            let tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
            if (!tryConsumeBalanceObj.ret) {
                // @ts-ignore
                wx.showToast({ title: "orderPayFail" });
                payFail("orderPayFail");
                return;
            }
            try {
                payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
                code = tryConsumeBalanceObj.res.code;
                codeMsg = tryConsumeBalanceObj.res.codeMsg;
            } catch (error) {
                // @ts-ignore
                wx.showToast({ title: "tryConsumeBalanceDataFail" });
                payFail("tryConsumeBalanceDataFail");
                return;
            }

            // 余额不够，充值
            if (!payBalanceSuccess) {
                let requestMidasPaymentObj = await this.requestMidasPayment(midasOfferId, midasBuyQuantity, orderNo);
                if (!requestMidasPaymentObj.ret) {
                    code = requestMidasPaymentObj.code;
                    codeMsg = requestMidasPaymentObj.codeMsg;
                    payFail("orderPayFail");
                    return;
                }

                //充值成功,再次尝试扣款
                tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
                if (!tryConsumeBalanceObj.ret) {
                    //扣款再次失败
                    payFail("orderPayFail");
                    return;
                }
                try {
                    payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
                    code = tryConsumeBalanceObj.res.code;
                    codeMsg = tryConsumeBalanceObj.res.codeMsg;
                } catch (error) {
                    payFail("tryConsumeBalanceDataFail");
                    return;
                }
                if (!payBalanceSuccess) {
                    //余额不够，再次扣款失败
                    payFail("orderPayFail");
                    return;
                }

            }

            //支付成功
            this.callbackPayResultToClient("orderPayFinish", this.genPayResponseObject(
                productExternalId, orderNo, code, codeMsg));

        } else {
            let preJsPayOrderObj = await this.preJsPayOrder(productExternalId);

            if (!preJsPayOrderObj.ret) {
                // @ts-ignore
                wx.showToast({ title: "preOrderFail" });
                //支付失败
                payFail("preOrderFail");
                return;
            }

            let coverImgUrl;
            try {
                coverImgUrl = preJsPayOrderObj.res.data.coverImgUrl;
                orderNo = preJsPayOrderObj.res.data.orderNo;
            } catch (error) {
                // @ts-ignore
                wx.showToast({ title: "preJsPayOrderObjDataFail" });
                payFail("preJsPayOrderObjDataFail");
                return;
            }
            this.easPayEventReport(orderNo, "create");
            let sessionFrom = "order|" + orderNo;
            this.isIosOpenCustomer = true;
            // @ts-ignore
            wx.openCustomerServiceConversation({
                showMessageCard: true,
                sessionFrom: sessionFrom,
                sendMessageTitle: "点击回复的链接进行充值",
                sendMessageImg: coverImgUrl,
            });
        }
    }

    orderComplete(orderNo: string): void {
        this.xLog("orderComplete:" + orderNo, "this.completeOrdersString:" + this.completeOrdersString);
        this.consumeOrder(orderNo);
        if (!this.completeOrdersString.includes(orderNo)) {
            this.setPayTimes();
            this.easPayEventReport(orderNo, "complete");
            this.taPayEventReport(orderNo);
            this.completeOrdersString = this.completeOrdersString + "," + orderNo;
            LocalStorage.setStringData("completeOrdersString", this.completeOrdersString);
        }
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
        if (!eventName) return;
        // @ts-ignore
        wx.reportEvent(eventName, eventParams);
        if (this.isInitAB) {
            // @ts-ignore
            ABetterChoice.track(eventName, eventParams);
        }
        if (this.isInitEAS) {
            // @ts-ignore
            this.eas.track(eventName, eventParams);
        }
        if (this.isInitTA) {
            // @ts-ignore
            this.ta.track(eventName, eventParams);
        }
    }

    reportTaEvent(type: number): void {
        if (!this.isInitTA) return;
        switch (type) {
            case 1:
                // this.ta.track('SHARE', {
                //     target: 'APP_MESSAGE'
                // });
                break;
            case 2:
                this.ta.onTutorialFinish();
                break;
            default:
                break;
        }
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

    private callbackGetRawDataResultSignatureToClient(msg, object): void {
        if (!this.getRawDataSignatureResultCallback) return;
        this.getRawDataSignatureResultCallback(msg, object);
    }

    async getRawDataSignature(params: object, callback: (phases: string, res: object) => void): Promise<void> {
        //是否触发过登录重试
        let retryLogin = false;
        if (params["retryLogin"]) {
            retryLogin = params["retryLogin"];
        }
        this.getRawDataSignatureResultCallback = callback;
        let sessionPass = await this.checkSession();
        if (!this.loginParams["wechat"]["jsCode"] || !sessionPass) {
            this.xLog("用户未登录或登录已过期");
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryGetRawDataSignature(params, callback);
            } else {
                // @ts-ignore
                wx.showToast({ title: "getRawDataError" });
                this.callbackGetRawDataResultSignatureToClient("getRawDataSignatureFail", { msg: "用户未登录或登录已过期" });
            }
            return;
        }
        let rawData: string = params["rawData"];
        HttpRequest.getInstance().request(RequestUrl.WEIXIN_RAW_DATA_SIGNATURE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { rawData: rawData }, (ret, res) => {
                this.xLog("getRawDataSignature ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("getRawDataSignatureSuccess", res);
                } else {
                    callback("getRawDataSignatureFail", res);
                }
            });
    }

    private loginRetryGetRawDataSignature(params: object, callback: (phases: string, res: object) => void): void {
        this.xLog("loginRetryGetRawDataSignature...");
        // @ts-ignore
        wx.showLoading({ title: "正在重新登录...", mask: true });
        setTimeout(() => {
            // @ts-ignore
            wx.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.reChannelLogin(() => {
            // @ts-ignore
            wx.hideLoading();
            this.getRawDataSignature(params, callback);
        }, () => {
            // @ts-ignore
            wx.hideLoading();
            //登录失败，再次尝试获取签名
            this.getRawDataSignature(params, callback);
        });
    }

    decryptionData(params: object, callback: (phases: string, res: object) => void): void {
        let iv: string = params["iv"];
        let encryptedData: string = params["encryptedData"];
        HttpRequest.getInstance().request(RequestUrl.WEIXIN_DATA_DECRYPTION, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { iv: iv, encryptedData: encryptedData }, (ret, res) => {
                this.xLog("decryptionData ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("decryptionDataSuccess", res);
                } else {
                    callback("decryptionDataFail", res);
                }
            });
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
        return this.nextVideoFitShare;
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

    setUserProperty(params: object): void {
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {

    }
}