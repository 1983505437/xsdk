import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-KuaiShou";
export default class KSSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "kuaishou": {
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

    // 广告id
    private id_banner: string = "";
    private id_inters: string = "";
    private id_video: string = "";
    private id_native_icon: string = "";
    private id_box: string = "";
    private id_block: string = "";

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

    // 视频误触
    private switch_video_wc: boolean = false;
    private num_video_wc_max: number = 0;
    private num_now_video_wc: number = 0;

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
    private num_continue_pop: number = 1;
    private num_now_has_show_ad: number = 0;
    private isTrigMoreForceAd: boolean = false;
    private isShowVideo: boolean = false;

    // 引力引擎
    private isInitGE: boolean = false;
    private accessToken: string = "";
    private openId: string = "";
    private ge: any;
    private versionCode: number = 1;

    // pay
    private payCallback: (res: object[]) => void;
    private isReLogin: boolean = false;
    private switch_pay: boolean = false;
    private completeOrders: string[] = [];
    private timeout_req_not_complete_orders: number = -1;
    private reqNum: number = 0;
    private payResultCallback: any;
    private isIosOpenCustomer: boolean = false;
    //处理待扣除虚拟币的订单
    private handlePendingOrderComplete: boolean = false;

    private systemInfo: { isStand: boolean, platform: string, windowWidth: number, windowHeight: number, env: string, version: string } = {
        isStand: true,
        platform: "android",
        env: "",
        version: "",
        windowWidth: 0,
        windowHeight: 0
    };
    private userInfo: object;

    // 获取签名参数结果回调
    private getRawDataSignatureResultCallback: any;
    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 广告开关参数
    private switch_ad: object;
    // 是否是DSP广告投放用户
    private isDSPUser: boolean = false;

    // 侧边栏进入游戏回调
    private sidebarCallback: any;
    private getLocationSuccess: boolean = false;
    // 热启动来源
    private location: string;

    // 录屏对象
    private gameRecord: any;
    // 录屏地址
    private videoPath: string;
    private stopGameVideoCallback: any;


    private runPerSecond(): void {
        setInterval(() => {
            this.doForce2();
        }, 1000);
    }

    private doForce2(): void {
        if (!this.switch_force) return;
        if (this.num_now_real_force >= this.num_force_max) return;
        if (this.isTrigMoreForceAd) return;
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
                    this.showMoreTimesAd();
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

    private showMoreTimesAd() {
        this.isTrigMoreForceAd = true;
        this.num_now_real_force++;
        let interval_show_ad =
            setInterval(() => {
                if (!this.getAdFlagByForce()) return;
                if (this.isShowVideo) return;
                this.showAdByForce2((phases, res) => {
                    this.num_now_has_show_ad++;
                    if (this.num_now_has_show_ad >= this.num_continue_pop) {
                        this.isTrigMoreForceAd = false;
                        this.num_now_has_show_ad = 0;
                        this.isShowVideo = false;
                        clearInterval(interval_show_ad);
                    }
                    this.isShowVideo = false;
                });
            }, 500);
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

    private showAdByForce2(callback: (phases, res) => void): void {
        switch (this.forceType) {
            case "SCREEN":
                this.getIntersFlag() && this.showInters({}, callback);
                break;
            case "VIDEO":
                this.getVideoFlag() && this.showVideo({}, callback);
                break;
        }
    }

    private phasesCallbackToInitSdk(phases: string, res: object): void {
        if (this.isReLogin) return;
        this.initSdkPhasesCallback && this.initSdkPhasesCallback(phases, res);
    }

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.getLaunchOptionsSyncInfo();
        this.getSystemInfo();
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin(null, null);
        });
        this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
        this.onAppShow();
        if (params && params["accessToken"]) this.accessToken = params["accessToken"];
        if (params && params["versionCode"]) this.versionCode = params["versionCode"];
        this.runPerSecond();
        this.addOnHideListener();
    }

    private getLaunchOptionsSyncInfo(): void {
        // @ts-ignore
        let result = ks.getLaunchOptionsSync();
        this.xLog("getLaunchOptionsSync:" + JSON.stringify(result));
        this.isDSPUser = result.from == "dsp";
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        ks.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    private isAttainTargetVersion(targetVer: string): boolean {
        let nowVer = this.systemInfo.version;
        let tarVerArray = targetVer.split('.').map(Number);
        let nowVerArray = nowVer.split('.').map(Number);
        return nowVerArray[0] * 100 + nowVerArray[1] * 10 + nowVerArray[2] * 1 >= tarVerArray[0] * 100 + tarVerArray[1] * 10 + tarVerArray[2] * 1;
    }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = ks.getSystemInfoSync();
        this.xLog("info:" + JSON.stringify(info));
        this.systemInfo.platform = info.platform;
        this.loginParams["platformType"] = info.platform == "ios" ? "IOS" : "ANDROID";
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        this.systemInfo.env = info.host.env;
        this.systemInfo.version = info.version;
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
    }

    private onAppShow(): void {
        // @ts-ignore
        ks.onShow((res) => {
            if (this.isIosOpenCustomer) {
                setTimeout(() => {
                    this.reqNotCompleteOrders();
                    this.isIosOpenCustomer = false;
                }, 500);
            }
            this.xLog("onShow res:" + JSON.stringify(res));
            this.location = res.from;
            this.getLocationSuccess = true;
            this.callbackGameFromResult();
        });
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
                this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
                if (orderList.length > 0 && nowIndex < orderList.length) {
                    if (this.completeOrders.indexOf(orderList[nowIndex]["orderNo"]) == -1 || orderList[nowIndex]["force"]) {
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
            this.payCallback && this.payCallback(finalList);
            this.handlePendingOrder(pendingOrder);
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

    // 尝试消费游戏币余额
    private tryConsumeBalance(orderNo: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.KS_PAY_BALANCE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { orderNo: orderNo }, (ret: boolean, res: object) => {
                    this.xLog("tryConsumeBalance ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                });
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

    private channelLogin(cbSuccess: any, cbFailure: any): void {
        // @ts-ignore
        ks.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["kuaishou"]["jsCode"] = res["code"];
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
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
            }
            this.reqAdParams();
        })
    }

    private reqAdParams(): void {
        HttpRequest.getInstance().request(RequestUrl.GAME_CONTENT, "GET", { "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { gameChannelCodeNo: sdkConfig.gameChannelCodeNo, proxy: this.isDSPUser ? "Y" : "N" }, (ret: boolean, adParams: object) => {
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
            if (this.loginParams["kuaishou"]["jsCode"]) {
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
            this.num_continue_pop = params_force["loadPageQty"] ?
                params_force["loadPageQty"] : 1;
        }
        let params_video_wc: object = adParams["data"]["videoTrigger"];
        this.xLog("params_video_t:" + JSON.stringify(params_video_wc));
        if (params_video_wc && params_video_wc["status"]) {
            this.switch_video_wc = true;
            this.num_video_wc_max = params_video_wc["maxQty"] ? params_video_wc["maxQty"] : 0;
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
        if (this.systemInfo.env != "kuaishou") {
            this.xLog("非快手平台 无系统banner广告");
            return;
        }
        if (this.systemInfo.platform == "ios" && !this.isAttainTargetVersion("12.10.40")) {
            this.xLog("ios 快手平台版本低于12.10.40 无系统banner广告");
            return;
        } else if (!this.isAttainTargetVersion("12.10.30")) {
            this.xLog("android 快手平台版本低于12.10.30 无系统banner广告");
            return;
        }

        // @ts-ignore
        this.bannerAd = ks.createBannerAd({
            adUnitId: this.id_banner,
            adIntervals: this.time_banner_refresh > 30 ? this.time_banner_refresh : 30,
            style: {
                // left: 0,
                // top: 0,
                // width: this.systemInfo.isStand ? this.systemInfo.windowWidth :300,
                // height: 50
            }
        });
        setTimeout(() => {
            new Date().getTime()
            this.xLog("@@@@@banner广告加载成功@@@@@");
            this.load_success_system_banner = true;
            if (this.hasShowBanner) {
                this.showSystemBanner();
            }
        }, 30 * 1000);

        this.load_success_system_banner = true;
        this.bannerAd.onResize((size) => {
            // this.bannerAd.style.top = this.systemInfo.windowHeight - size.height;
            // this.bannerAd.style.left = (this.systemInfo.windowWidth - size.width) * 0.5;
        });
        this.bannerAd.onClose(() => {
            this.xLog("banner onClose");
            this.load_success_system_banner = false;
        });
        this.bannerAd.onError((err) => {
            this.xLog("#####banner广告加载失败#####", JSON.stringify(err));
        });
    }

    createSystemInters() {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_inters)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemInfo.platform == "ios") {
            this.xLog("快手 ios不支持插屏广告");
            this.load_success_system_inters = false;
            return;
        }
        // @ts-ignore
        this.systemIntersAd = ks.createInterstitialAd({
            adUnitId: this.id_inters
        });
        this.xLog("@@@@@插屏广告加载成功@@@@@");
        this.load_success_system_inters = true;
        this.systemIntersAd.onError((error) => {
            this.xLog("#####插屏广告加载失败#####", JSON.stringify(error));
            this.load_success_system_inters = false;
            setTimeout(() => {
                this.createSystemInters();
            }, 30 * 1000);
        });
        this.systemIntersAd.onClose(() => {
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
            // 系统插屏关闭后60s后再次load
            setTimeout(() => {
                this.createSystemInters();
            }, 60 * 1000);
        });
    }

    private intersPhasesCallback(phases: string): void {
        if (this.showIntersPhasesCallback) this.showIntersPhasesCallback(phases, {});
    }

    createVideo() {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = ks.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.xLog("@@@@@视频广告加载成功@@@@@");
        this.load_success_video = true;
        this.videoAd.onError((error) => {
            this.xLog("#####视频广告展示失败#####", JSON.stringify(error));
            this.load_success_video = false;
            setTimeout(() => {
                this.createVideo();
            }, 10 * 1000);
        });
        this.videoAd.onClose((res) => {
            if (res && res.isEnded) {
                this.xLog("视频广告播放完成");
                if (this.showVideoPhasesCallback) {
                    this.videoAd.load();
                    this.showVideoPhasesCallback("videoPlayFinish", {});
                }
            } else {
                this.xLog("视频广告取消播放");
                if (this.showVideoPhasesCallback) {
                    this.videoAd.load();
                    this.showVideoPhasesCallback("videoPlayBreak", {});
                }
            }
            if (this.switch_video_wc && this.num_video_wc_max > 0) {
                if (this.num_now_video_wc < this.num_video_wc_max) {
                    this.showVideo({}, (a, b) => {
                        this.num_now_video_wc++;
                    });
                } else {
                    this.num_now_video_wc = 0;
                }
            }
        });
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        if (this.userInfo) {
            callback && callback({ ret: true, userInfo: this.userInfo });
            return;
        }
        // @ts-ignore
        ks.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["kuaishou"]["jsCode"] = res["code"];
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

    // private refreshBanner(): void {
    //     if (this.timeout_refresh_banner != -1) {
    //         clearInterval(this.timeout_refresh_banner);
    //         this.timeout_refresh_banner = -1;
    //     }
    //     this.timeout_refresh_banner =
    //         setInterval(() => {
    //             this.xLog("refreshBanner");
    //             this.bannerAd && this.bannerAd.destroy();
    //             this.bannerAd = null;
    //             this.createSystemBanner();
    //         }, this.time_banner_refresh * 1000);
    // }

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
        // this.refreshBanner();
    }

    hideBanner(): void {
        if (this.bannerAd && this.hasShowBanner) {
            this.xLog("hideSystemBanner");
            this.hasShowBanner = false;
            this.bannerAd.hide();
        }
    }

    getIntersFlag(): boolean {
        let systemIntersLoad: boolean = this.load_success_system_inters && this.probability_inters > 0 && this.num_system_inters_now_show < this.num_system_inters_max_show;
        let videoLoad: boolean = this.load_success_video && this.probability_video > 0;
        return systemIntersLoad || videoLoad;
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
            this.xLog("reset num_inters_r_show = 0");
            this.num_inters_r_show = 0;
            return canShowType[0];
        }
        if (this.load_success_system_inters && this.probability_inters > 0 && this.num_system_inters_now_show < this.num_system_inters_max_show) {
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

    private getPByType(type: string): number {
        switch (type) {
            case "inters":
                return this.probability_inters;
            case "video":
                return this.probability_video;
            default:
                return 0;
        }
    }

    private showIntersAdByType(type: string): void {
        switch (type) {
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
        if (this.systemIntersAd && this.load_success_system_inters && (new Date().getTime() - this.timestamp_last_hide_inters >= this.time_system_inters_show_interval * 1000) && this.num_system_inters_now_show < this.num_system_inters_max_show) {
            this.num_system_inters_now_show++;
            this.xLog("showSystemInters:" + this.num_system_inters_now_show);
            this.systemIntersAd.show().then(() => {
                this.geAdShowEventReport("inters");
            }).catch((error) => {
                this.load_success_system_inters = false;
                this.xLog("#####系统插屏广告展示失败#####", JSON.stringify(error));
                this.intersPhasesCallback("intersShowFail");
                setTimeout(() => {
                    this.createSystemInters();
                }, 30 * 1000);
            });
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
        this.isShowVideo = true;
        this.videoAd.show().then(() => {
            this.xLog("激励视频广告展示成功");
            this.geAdShowEventReport("video");
        }).catch((err) => {
            this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
            this.load_success_video = false;
            this.showVideoPhasesCallback("videoPlayBreak", {});
            this.isShowVideo = false;
            this.createVideo();
        });
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
            ks.vibrateLong({
                success(res) {
                },
                fail(res) {
                }
            });
        }
        else if (type == "short") {
            // @ts-ignore
            ks.vibrateShort({
                type: "heavy",
                success(res) {
                },
                fail(res) {
                }
            });
        }
    }

    shareApp(): void {
        // @ts-ignore
        ks.shareAppMessage({});
    }

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private callbackPayResultToClient(msg, object): void {
        if (!this.payResultCallback) return;
        if (this.completeOrders.indexOf(object["orderNo"]) != -1) return;
        this.payResultCallback(msg, object);
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

    private checkSession(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            ks.checkSession({
                success: () => {
                    //session_key 未过期，并且在本生命周期一直有效
                    resolve(true);
                },
                fail: (res) => {
                    this.xLog("checkSession fail, res: " + JSON.stringify(res));
                    // session_key 已经失效，需要重新执行登录流程
                    resolve(false);
                }
            })
        });
    }

    //登录再重试支付
    private loginRetryPay(params, callback): void {
        this.xLog("loginRetryPay...", params);
        // @ts-ignore
        ks.showLoading({ title: "请求中...请稍等", mask: true });
        setTimeout(() => {
            // @ts-ignore
            ks.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.channelLogin(() => {
            // @ts-ignore
            ks.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            ks.hideLoading();
            //登录失败，再次尝试支付
            this.pay(params, callback);
        });
    }

    private preOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.KS_PRE_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId, platformType: this.systemInfo.platform.toUpperCase() }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private requestGamePayment(params): Promise<any> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            ks.requestGamePayment({
                zone_id: params.data.zoneId,
                os: params.data.os.toLowerCase(),
                currency_type: "CNY",
                buy_quantity: params.data.buyQuantity,
                third_party_trade_no: params.data.thirdPartyTradeNo,
                extension: params.data.extension,
                product_type: 1,
                goods_category: params.data.product.kuaishouProductCategoryId,
                goods_name: params.data.product.name,
                sign: params.data.sign,
                success: (result) => {
                    this.xLog("支付成功结果: " + JSON.stringify(result));
                    resolve({ ret: true });
                },
                fail: (result) => {
                    this.xLog("支付失败: " + JSON.stringify(result));
                    resolve({ ret: false, code: result["code"], codeMsg: result["codeMsg"] });
                }
            });
        });
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
        if (!this.loginParams["kuaishou"]["jsCode"] || !sessionPass) {
            this.xLog("用户未登录或登录已过期");
            this.xLog("code:" + this.loginParams["kuaishou"]["jsCode"], "sessionPass:" + sessionPass);
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryPay(params, callback);
            } else {
                // @ts-ignore
                ks.showToast({ title: "payError" });
                this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录或登录已过期"));
            }
            return;
        }

        // @ts-ignore
        ks.showToast({ title: "请求支付中...", mask: true });

        let productExternalId: string = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        let payBalanceSuccess = false;
        let payFail = (msg) => {
            this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        };
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);

        // 预下单
        let preOrderObj = await this.preOrder(productExternalId);
        if (!preOrderObj.ret) {
            // @ts-ignore
            ks.showToast({ title: "preOrderFail" });
            payFail("preOrderFail");
            return;
        }
        try {
            orderNo = preOrderObj.res.data.orderNo;
            code = preOrderObj.res.code;
            codeMsg = preOrderObj.res.codeMsg;
        } catch (error) {
            // @ts-ignore
            ks.showToast({ title: "preMidasOrderObjDataFail" });
            payFail("preMidasOrderObjDataFail");
            return;
        }

        //消费余额
        let tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
        if (!tryConsumeBalanceObj.ret) {
            // @ts-ignore
            ks.showToast({ title: "orderPayFail" });
            payFail("orderPayFail");
            return;
        }
        try {
            payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
            code = tryConsumeBalanceObj.res.code;
            codeMsg = tryConsumeBalanceObj.res.codeMsg;
        } catch (error) {
            // @ts-ignore
            ks.showToast({ title: "tryConsumeBalanceDataFail" });
            payFail("tryConsumeBalanceDataFail");
            return;
        }

        // 余额不够，充值
        if (!payBalanceSuccess) {
            let requestGamePaymentObj = await this.requestGamePayment(preOrderObj.res);
            if (!requestGamePaymentObj.ret) {
                code = requestGamePaymentObj.code;
                codeMsg = requestGamePaymentObj.codeMsg;
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
        if (this.systemInfo.platform == "ios") {
            this.reqNotCompleteOrders();
        }
    }

    orderComplete(orderNo: string): void {
        this.consumeOrder(orderNo);
        if (this.completeOrders.indexOf(orderNo) == -1) {
            this.completeOrders.push(orderNo);
            LocalStorage.setStringData("completeOrders", JSON.stringify(this.completeOrders));
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
        if (this.switch_ad) {
            return this.switch_ad[key];
        }
        return false;
    }

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void {

    }

    isSupportSidebar(callback: (isSupport: boolean) => void): void {
        // @ts-ignore
        ks.checkSliderBarIsAvailable({
            success: (res) => {
                this.xLog("侧边栏调用成功:" + JSON.stringify(res));
                if (res.available) callback(true);
                else callback(false);
            },
            fail: (res) => {
                this.xLog("侧边栏调用失败:" + JSON.stringify(res));
                callback(false);
            },
        });
    }
    gotoSidebar(): void {
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        this.sidebarCallback = callback;
        this.callbackGameFromResult();
    }

    private callbackGameFromResult() {
        if (!this.sidebarCallback || !this.getLocationSuccess) {
            return;
        }
        this.sidebarCallback(this.location == "sidebar_miniprogram");
        this.getLocationSuccess = false;
        this.location = "";
        this.sidebarCallback = null;
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        // @ts-ignore
        ks.checkShortcut({
            success: (res) => {
                //根据res.installed来判断是否添加成功  
                this.xLog("是否已添加快捷方式 " + JSON.stringify(res));
                if (res.installed) callback(false);
                else callback(true);
            },
            fail: (res) => {
                this.xLog("检查快捷方式失败 " + JSON.stringify(res));
                callback(false);
            },
        });
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        ks.addShortcut({
            success: (res) => {
                this.xLog("添加桌面成功 " + JSON.stringify(res));
                callback(true);
            },
            fail: (res) => {
                this.xLog("添加桌面失败 " + JSON.stringify(res));
                callback(false);
            },
        });
    }

    startGameVideo(duration: number): void {
        if (!this.gameRecord) {
            // @ts-ignore
            this.gameRecord = ks.getGameRecorder();
            this.gameRecord.on("start", () => {
                this.xLog("startGameVideo");
            });
            this.gameRecord.on("pause", () => {
                this.xLog("pauseGameVideo");
            });
            this.gameRecord.on("resume", () => {
                this.xLog("resumeGameVideo");
            });
            this.gameRecord.on("stop", (res) => {
                this.xLog("stopGameVideo " + res.videoID);
                this.videoPath = res.videoID;
                this.stopGameVideoCallback(this.videoPath);
                this.videoPath = "";
                this.stopGameVideoCallback = null;
            });
            this.gameRecord.on("error", (res) => {
                this.xLog("查看错误文档:https://open.kuaishou.com/miniGameDocs/gameDev/api/record/GameRecorder.html");
            });
        }
        this.gameRecord.start();
    }
    pauseGameVideo(): void {
        if (!this.gameRecord) return;
        this.gameRecord.pause();
    }
    resumeGameVideo(): void {
        if (!this.gameRecord) return;
        this.gameRecord.resume();
    }
    stopGameVideo(callback: (videoPath: string) => void): void {
        if (!this.gameRecord) {
            callback("");
            return;
        }
        this.stopGameVideoCallback = callback;
        this.gameRecord.stop();
    }
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        if (!this.gameRecord) {
            callback(false);
            return;
        }
        let vdId = Number(videoPath);
        if (isNaN(vdId)) {
            callback(false);
            return;
        }
        this.gameRecord.publishVideo({
            video: vdId,
            callback: (res) => {
                if (res) {
                    this.xLog("分享录屏失败 " + JSON.stringify(res));
                    callback(false);
                } else {
                    this.xLog("分享录屏成功");
                    callback(true);
                }
            }
        });
    }

    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {
        if (!path) {
            callback && callback(false);
            return;
        }
        switch (type) {
            // 图片
            case 1:
                // @ts-ignore
                ks.shareImageToGameClub({
                    path: path ? path : undefined,
                    mouldId: mouldId ? mouldId : undefined,
                    success: (res) => {
                        this.xLog("分享图片到游戏圈成功");
                        callback && callback(true);
                    },
                    fail: (res) => {
                        this.xLog("分享图片到游戏圈失败");
                        callback && callback(false);
                    }
                });
                break;
            // 录屏
            case 2:
                if (!this.gameRecord) {
                    callback && callback(false);
                    return;
                }
                let vdId = Number(path);
                if (isNaN(vdId)) {
                    callback && callback(false);
                    return;
                }
                this.gameRecord.publishVideo({
                    type: 2,
                    mouldId: mouldId ? mouldId : undefined,
                    video: vdId,
                    callback: (res) => {
                        if (res) {
                            this.xLog("分享录屏失败 " + JSON.stringify(res));
                            callback && callback(false);
                        } else {
                            this.xLog("分享录屏成功");
                            callback && callback(true);
                        }
                    }
                });
                break;
            default:
                this.xLog("不存在该类型:" + type);
                callback && callback(false);
                break;
        }
    }

    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        // @ts-ignore
        ks.jumpToGameClub({
            success: () => {
                this.xLog("跳转游戏圈成功");
                callback && callback("jumpToGameClubSuccess", {});
            },
            fail: (res) => {
                this.xLog("跳转游戏圈失败", JSON.stringify(res))
                callback && callback("jumpToGameClubFail", { msg: JSON.stringify(res) })
            }
        });
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
        HttpRequest.getInstance().request(RequestUrl.KS_TASK_UPLOAD, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { eventType: eventType, eventValue: eventValue }, (ret, res) => {
                this.xLog("reportKSGameEvent ret:" + ret + " res:" + JSON.stringify(res));
                if (ret) {
                    callback("reportKSGameEventSuccess", res);
                } else {
                    callback("reportKSGameEventFail", res);
                }
            });
    }

    setUserProperty(params: object): void {
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {
    }
}