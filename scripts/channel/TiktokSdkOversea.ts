import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrlOvs, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-TiktokOvs";
/*
 * @Author: Vae 
 * @Date: 2023-11-03 11:02:42 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 16:24:52
 */
export default class TiktokSdkOversea implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "tiktokOverseas": {
            "code": "",
        }
    }

    private initSdkPhasesCallback: (phases: string, res: object) => void;
    private showIntersPhasesCallback: ((phases: string, res: object) => void) | null;
    private showVideoPhasesCallback: (phases: string, res: object) => void;

    // 广告开关
    private switch_screen: boolean = false;
    private switch_video: boolean = false;

    // 广告id
    private id_screen: string = "";
    private id_video: string = "";

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

    // system inters
    private systemIntersAd: any = null;
    private load_success_system_inters: boolean = false;
    private hasShowInters: boolean = false;
    private timestamp_last_hide_inters: number = 0;
    private num_inters_now_show: number = 0;
    private num_system_inters_now_show: number = 0;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;
    private systemIntersOnCloseCallback: () => void;
    private time_system_inters_show_interval: number = 10;
    private num_inters_r_show: number = 0;
    private systemIntersOnErrorCallback: () => void;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private hasShowVideo: boolean = false;
    private timeout_retry_load_video: number = -1;

    // desktop
    private num_desktop_auto_appear: number = 0;
    private number_inters_to_desktop: number = 0;

    // force
    private time_now_force: number = 0;
    private achieveFirstForce: boolean = false;
    private number_now_force: number = 0;
    private num_now_real_force: number = 0;
    private num_continue_pop: number = 1;
    private num_now_has_show_ad: number = 0;
    private isTrigMoreForceAd: boolean = false;
    private isShowVideo: boolean = false;

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

    private systemInfo: { isStand: boolean, platform: string, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
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

    // 广告开关参数
    private switch_ad: object;

    // 是否跳转侧边栏导致的游戏进入后台
    private isSidebarGoto: boolean = false;
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
            // this.doForce();
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
        // this.onAppShow();
        this.addOnHideListener();
        this.runPerSecond();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        TTMinis.game.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        if (this.userInfo) {
            callback && callback({ ret: true, userInfo: this.userInfo });
            return;
        }
        // @ts-ignore
        TTMinis.game.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["tiktokOverseas"]["code"] = res["code"];
                    HttpRequest.getInstance().request(RequestUrlOvs.SIGN_IN_URL, "POST", { "content-type": "application/json" }, this.loginParams, (ret: boolean, res: object) => {
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
        TTMinis.game.onShow((res) => {
            // if (this.isIosOpenCustomer) {
            //     setTimeout(() => {
            //         this.reqNotCompleteOrders();
            //         this.isIosOpenCustomer = false;
            //     }, 500);
            // }
            // if (this.isSidebarGoto) {
            //     this.xLog("onShow res:" + JSON.stringify(res));
            //     this.location = res.location;
            //     this.getLocationSuccess = true;
            //     this.callbackGameFromResult();
            // }
        });
    }

    private reqNotConsumeOrders(callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrlOvs.NOT_CONSUME_LIST, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") }, {},
            (ret: boolean, res: object) => {
                callback(ret, res);
            });
    }

    private consumeOrder(orderNo: string): void {
        HttpRequest.getInstance().request(RequestUrlOvs.CONSUME_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        let info = TTMinis.game.getSystemInfoSync();
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

    private getInitContent(callback: (phases: string, res: object) => void): void {
        let gameChannelCodeNo: string = sdkConfig.gameChannelCodeNo;
        HttpRequest.getInstance().request(RequestUrlOvs.INIT_CONTENT, "GET", { "content-type": "application/json" },
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
        TTMinis.game.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["tiktokOverseas"]["code"] = res["code"];
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

    private serverLogin(): void {
        HttpRequest.getInstance().request(RequestUrlOvs.SIGN_IN_URL, "POST", { "content-type": "application/json" }, this.loginParams, (ret: boolean, res: object) => {
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
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
            }
            this.reqAdParams();
        })
    }

    private reqAdParams(): void {
        HttpRequest.getInstance().request(RequestUrlOvs.GAME_CONTENT, "GET", { "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        // if (!adParams["data"]["paymentStatus"] || !adParams["data"]["paymentAndroidStatus"]) {
        //     this.xLog("#####支付总开关未开启或支付配置未设置#####");
        // } else {
        //     if (this.loginParams["tiktokOverseas"]["code"]) {
        //         this.switch_pay = true;
        //         this.reqNotCompleteOrders();
        //     } else {
        //         this.xLog("#####渠道登录未成功,不开启onShow监听#####");
        //     }
        // }
        if (!adParams["data"]["adStatus"]) {
            this.xLog("#####广告总开关未开启#####");
            this.phasesCallbackToInitSdk("createAdFail", adParams);
            return;
        }

        let switch_ad: object = adParams["data"]["ad"];
        if (switch_ad) {
            this.switch_ad = switch_ad;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_screen = switch_ad["screen"] ? switch_ad["screen"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        if (id_ad) {
            this.id_screen = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
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
            this.number_inters_popup = params_inters_control["popupIndex"] ?
                params_inters_control["popupIndex"] : 0;
            this.intersPopupType = params_inters_control["popupType"] ?
                params_inters_control["popupType"] : "SCREEN";
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

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_screen)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemIntersAd) {
            this.systemIntersOnErrorCallback && this.systemIntersAd.offError(this.systemIntersOnErrorCallback);
            this.systemIntersOnCloseCallback && this.systemIntersAd.offClose(this.systemIntersOnCloseCallback);
        }
        // @ts-ignore
        this.systemIntersAd = TTMinis.game.createInterstitialAd({
            adUnitId: this.id_screen
        });
        this.load_success_system_inters = true;
        this.systemIntersOnErrorCallback = () => {
            this.xLog("#####系统插屏广告加载失败#####");
            this.load_success_system_inters = false;
            setTimeout(() => {
                this.createSystemInters();
            }, 30 * 1000);
        }
        this.systemIntersOnCloseCallback = () => {
            this.xLog("系统插屏广告关闭");
            this.load_success_system_inters = false;
            this.hasShowInters = false;
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
            // this.systemIntersAd.destroy();
            setTimeout(() => {
                this.createSystemInters();
            }, 30 * 1000);
        }
        this.systemIntersAd.onError(this.systemIntersOnErrorCallback);
        this.systemIntersAd.onClose(this.systemIntersOnCloseCallback);
    }

    private onCloseVideo(): void {
        setTimeout(() => {
            if (this.switch_video_wc && this.num_video_wc_max > 0) {
                if (this.num_now_video_wc < this.num_video_wc_max) {
                    this.showVideo({}, (a, b) => {
                        this.num_now_video_wc++;
                    });
                } else {
                    this.num_now_video_wc = 0;
                }
            }
        }, 1000);
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = TTMinis.game.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.load_success_video = true;
        this.videoAd.onClose((res) => {
            if (res.isEnded) {
                this.xLog("视频广告播放完成");
                this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayFinish", {});
            } else {
                this.xLog("视频广告取消播放");
                this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayBreak", {});
            }
            this.hasShowVideo = false;
            this.onCloseVideo();
            this.createVideo();
        });
    }

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
    }

    hideBanner(): void {
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
        if (this.systemIntersAd && this.load_success_system_inters && (new Date().getTime() - this.timestamp_last_hide_inters >= this.time_system_inters_show_interval * 1000)) {
            this.num_system_inters_now_show++;
            this.xLog("showSystemInters:" + this.num_system_inters_now_show);
            this.systemIntersAd.show().then(() => {
                this.hasShowInters = true;
            }).catch((error) => {
                this.xLog("#####系统插屏广告展示失败#####", JSON.stringify(error));
                this.hasShowInters = false;
                this.load_success_system_inters = false;
                this.intersPhasesCallback("intersShowFail");
                setTimeout(() => {
                    this.createSystemInters();
                }, 20000);
            });
        }
        // this.systemIntersAd.show().then(() => {
        //     this.xLog("showSystemInters");
        //     this.hasShowInters = true;
        // }).catch((err) => {
        //     this.xLog("showSystemInters fail. Error: " + JSON.stringify(err));
        //     this.hasShowInters = false;
        //     this.load_success_system_inters = false;
        //     setTimeout(() => {
        //         this.createSystemInters();
        //     }, 20000);
        // });
    }

    getVideoFlag(): boolean {
        return this.load_success_video;
    }

    showVideo(params: object, callback: (phases: string, res: object) => void): void {
        if (this.hasShowVideo) {
            this.xLog("激励视频正在播放,请勿连续多次点击");
            return;
        }
        if (!this.getVideoFlag()) {
            callback("videoNotLoad", {});
            return;
        }
        this.showVideoPhasesCallback = callback;
        this.hasShowVideo = true;
        if (this.videoAd) {
            this.videoAd.show()
                .then(() => {
                    this.xLog("激励视频广告展示成功");
                })
                .catch((err) => {
                    this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
                    this.hasShowVideo = false;
                    this.load_success_video = false;
                    callback("videoPlayBreak", {});
                    this.createVideo();
                });
        } else {
            this.hasShowVideo = false;
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
        // if (type == "long") {
        //     // @ts-ignore
        //     TTMinis.game.vibrateLong({
        //         success(res) {
        //         },
        //         fail(res) {
        //             this.xLog("vibrateLong fail:" + JSON.stringify(res));
        //         }
        //     });
        // } else {
        //     // @ts-ignore
        //     TTMinis.game.vibrateShort({
        //         success(res) {
        //         },
        //         fail(res) {
        //             this.xLog("vibrateShort fail:" + JSON.stringify(res));
        //         }
        //     });
        // }
    }

    shareApp(): void {
        // // @ts-ignore
        // TTMinis.game.shareAppMessage({});
    }

    private preOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrlOvs.TIKTOK_PRE_ORDER_DEFAULT, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preJsPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrlOvs.TIKTOK_PRE_ORDER_JSPAY, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preJsPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preIosPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrlOvs.TIKTOK_PRE_ORDER_IOS_PAY2, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preIosPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    // 尝试消费游戏币余额
    private tryConsumeBalance(orderNo: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrlOvs.TIKTOK_PAY_BALANCE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        if (this.completeOrders.indexOf(object["orderNo"]) != -1) return;
        this.payResultCallback(msg, object);
    }

    private checkSession(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            TTMinis.game.checkSession({
                success: () => {
                    resolve(true);
                },
                fail: () => {
                    resolve(false);
                }
            });
        });
    }

    private requestGamePayment(buyQuantity, orderNo, price, productName): Promise<any> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            if (price < 1 && TTMinis.game.canIUse("requestGamePayment.object.goodType")) {
                // @ts-ignore
                TTMinis.game.requestGamePayment({
                    mode: "game",
                    env: 0,
                    currencyType: "CNY",
                    platform: "android",
                    customId: orderNo,
                    goodType: 2,
                    orderAmount: price * 100,
                    goodName: productName,
                    success: (res) => {
                        this.xLog("requestGamePayment pay success:" + JSON.stringify(res));
                        resolve({ ret: true });
                    },
                    fail: (res) => {
                        this.xLog("requestGamePayment pay fail:" + JSON.stringify(res));
                        resolve({ ret: false, code: res["errCode"], codeMsg: "" });
                    }
                })
            } else {
                // @ts-ignore
                TTMinis.game.requestGamePayment({
                    mode: "game",
                    env: 0,
                    currencyType: "CNY",
                    platform: "android",
                    buyQuantity: buyQuantity,
                    customId: orderNo,
                    success: (res) => {
                        this.xLog("requestGamePayment pay success:" + JSON.stringify(res));
                        resolve({ ret: true });
                    },
                    fail: (res) => {
                        this.xLog("requestGamePayment pay fail:" + JSON.stringify(res));
                        resolve({ ret: false, code: res["errCode"], codeMsg: "" });
                    }
                })
            }
        });
    }

    //登录再重试支付
    private loginRetryPay(params, callback): void {
        this.xLog("loginRetryPay...", params);
        // @ts-ignore
        TTMinis.game.showLoading({ title: "请求中...请稍等", mask: true });
        setTimeout(() => {
            // @ts-ignore
            TTMinis.game.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.channelLogin(() => {
            // @ts-ignore
            TTMinis.game.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            TTMinis.game.hideLoading();
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
        // this.xLog("pay...", JSON.stringify(params));
        // //是否触发过登录重试
        // let retryLogin = false;
        // if (params["retryLogin"]) {
        //     retryLogin = params["retryLogin"];
        // }
        // this.payResultCallback = callback;

        // if (!this.switch_pay) {
        //     this.xLog("#####支付总开关未开启或支付配置未设置#####");
        //     this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", CallbackMsg.PAY_SWITCH_NOT_ENABLE));
        //     return;
        // }

        // let sessionPass = await this.checkSession();
        // if (!this.loginParams["tiktokOverseas"]["code"] || !sessionPass) {
        //     this.xLog("用户未登录或登录已过期");
        //     if (!retryLogin) {
        //         params["retryLogin"] = true;
        //         this.loginRetryPay(params, callback);
        //     } else {
        //         // @ts-ignore
        //         TTMinis.game.showToast({ title: "payError" });
        //         this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录或登录已过期"));
        //     }
        //     return;
        // }

        // // @ts-ignore
        // TTMinis.game.showToast({ title: "请求支付中...", mask: true });

        // let productExternalId: string = params["productExternalId"];
        // let orderNo = "-1";
        // let code = "-1";
        // let codeMsg = "";
        // let buyQuantity;
        // let price;
        // let productName;
        // let payBalanceSuccess = false;
        // let payFail = (msg) => {
        //     this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        // };
        // this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // // android
        // if (this.systemInfo.platform === "android") {
        //     // 预下单
        //     let preOrderObj = await this.preOrder(productExternalId);
        //     if (!preOrderObj.ret) {
        //         // @ts-ignore
        //         TTMinis.game.showToast({ title: "preOrderFail" });
        //         payFail("preOrderFail");
        //         return;
        //     }
        //     try {
        //         orderNo = preOrderObj.res.data.orderNo;
        //         code = preOrderObj.res.code;
        //         codeMsg = preOrderObj.res.codeMsg;
        //         buyQuantity = preOrderObj.res.data.buyQuantity;
        //         price = preOrderObj.res.data.product.price;
        //         productName = preOrderObj.res.data.product.name;
        //     } catch (error) {
        //         // @ts-ignore
        //         TTMinis.game.showToast({ title: "preOrderObjDataFail" });
        //         payFail("preOrderObjDataFail");
        //         return;
        //     }

        //     this.easPayEventReport(orderNo, "create");

        //     // @ts-ignore
        //     if (price < 1 && TTMinis.game.canIUse("requestGamePayment.object.goodType")) {
        //         let requestGamePaymentObj = await this.requestGamePayment(buyQuantity, orderNo, price, productName);
        //         if (!requestGamePaymentObj.ret) {
        //             code = requestGamePaymentObj.code;
        //             codeMsg = requestGamePaymentObj.codeMsg;
        //             payFail("orderPayFail");
        //             return;
        //         }
        //     } else {
        //         // 消费余额
        //         let tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
        //         if (!tryConsumeBalanceObj.ret) {
        //             // @ts-ignore
        //             TTMinis.game.showToast({ title: "orderPayFail" });
        //             payFail("orderPayFail");
        //             return;
        //         }
        //         try {
        //             payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
        //             code = tryConsumeBalanceObj.res.code;
        //             codeMsg = tryConsumeBalanceObj.res.codeMsg;
        //         } catch (error) {
        //             // @ts-ignore
        //             TTMinis.game.showToast({ title: "tryConsumeBalanceDataFail" });
        //             payFail("tryConsumeBalanceDataFail");
        //             return;
        //         }

        //         // 余额不够,充值
        //         if (!payBalanceSuccess) {
        //             let requestGamePaymentObj = await this.requestGamePayment(buyQuantity, orderNo, price, productName);
        //             if (!requestGamePaymentObj.ret) {
        //                 code = requestGamePaymentObj.code;
        //                 codeMsg = requestGamePaymentObj.codeMsg;
        //                 payFail("orderPayFail");
        //                 return;
        //             }

        //             // 充值成功,再次尝试扣款
        //             tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
        //             // 扣款再次失败
        //             if (!tryConsumeBalanceObj.ret) {
        //                 payFail("orderPayFail");
        //                 return;
        //             }
        //             try {
        //                 payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
        //                 code = tryConsumeBalanceObj.res.code;
        //                 codeMsg = tryConsumeBalanceObj.res.codeMsg;
        //             } catch (error) {
        //                 payFail("tryConsumeBalanceDataFail");
        //                 return;
        //             }
        //             if (!payBalanceSuccess) {
        //                 // 余额不够，再次扣款失败
        //                 payFail("orderPayFail");
        //                 return;
        //             }
        //         }
        //     }

        //     //支付成功
        //     this.callbackPayResultToClient("orderPayFinish", this.genPayResponseObject(
        //         productExternalId, orderNo, code, codeMsg));
        // } else {
        //     // let preJsPayOrderObj = await this.preJsPayOrder(productExternalId);
        //     let preIosPayOrderObj = await this.preIosPayOrder(productExternalId);

        //     //支付失败
        //     if (!preIosPayOrderObj.ret) {
        //         // @ts-ignore
        //         TTMinis.game.showToast({ title: "preOrderFail" });
        //         payFail("preOrderFail");
        //         return;
        //     }

        //     let buyQuantity;
        //     try {
        //         buyQuantity = preIosPayOrderObj.res.data.buyQuantity;
        //         price = preIosPayOrderObj.res.data.product.price;
        //         productName = preIosPayOrderObj.res.data.product.name;
        //         orderNo = preIosPayOrderObj.res.data.orderNo;
        //     } catch (error) {
        //         // @ts-ignore
        //         TTMinis.game.showToast({ title: "preIosPayOrderObjDataFail" });
        //         payFail("preIosPayOrderObjDataFail");
        //         return;
        //     }
        //     this.easPayEventReport(orderNo, "create");

        //     this.isIosOpenCustomer = true;
        //     // 小额支付
        //     if (price < 1) {
        //         // 使用道具直购
        //         // @ts-ignore
        //         if (TTMinis.game.canIUse("openAwemeCustomerService.object.goodType")) {
        //             // @ts-ignore
        //             TTMinis.game.openAwemeCustomerService({
        //                 goodType: 2, // 道具直购
        //                 orderAmount: price * 100, // 道具现金价值，单位分
        //                 goodName: productName, // 道具名称
        //                 currencyType: "DIAMOND", // 币种：目前仅为"DIAMOND"
        //                 zoneId: "1",
        //                 customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
        //                 extraInfo: orderNo, //extraInfo要转成字符串
        //                 success: (res) => {
        //                     this.xLog("调用函数成功");
        //                 },
        //                 fail: (res) => {
        //                     this.xLog("调用函数失败");
        //                 },
        //                 complete: (res) => {
        //                     this.xLog("调用完成");
        //                 },
        //             });
        //         } else {
        //             // @ts-ignore
        //             TTMinis.game.openAwemeCustomerService({
        //                 currencyType: "DIAMOND_PROP", // 币种：目前仅为"DIAMOND"
        //                 buyQuantity: buyQuantity, // 购买游戏币数量
        //                 zoneId: "1",
        //                 customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
        //                 extraInfo: orderNo,  //extraInfo要转成字符串
        //                 success: (res) => {
        //                     this.xLog("调用函数成功");
        //                 },
        //                 fail: (res) => {
        //                     this.xLog("调用函数失败");
        //                 },
        //                 complete: (res) => {
        //                     this.xLog("调用完成");
        //                 },
        //             });
        //         }
        //     } else {
        //         // @ts-ignore
        //         TTMinis.game.openAwemeCustomerService({
        //             currencyType: "DIAMOND", // 币种：目前仅为"DIAMOND"
        //             buyQuantity: buyQuantity, // 购买游戏币数量
        //             zoneId: "1",
        //             customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
        //             extraInfo: orderNo,  //extraInfo要转成字符串
        //             success: (res) => {
        //                 this.xLog("调用函数成功");
        //             },
        //             fail: (res) => {
        //                 this.xLog("调用函数失败");
        //             },
        //             complete: (res) => {
        //                 this.xLog("调用完成");
        //             },
        //         });
        //     }
        // }
    }

    orderComplete(orderNo: string): void {
        // this.consumeOrder(orderNo);
        // if (this.completeOrders.indexOf(orderNo) == -1) {
        //     this.completeOrders.push(orderNo);
        //     LocalStorage.setStringData("completeOrders", JSON.stringify(this.completeOrders));
        // }
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        let platform: string = this.systemInfo.platform === "android" ? "ANDROID" : "IOS";
        HttpRequest.getInstance().request(RequestUrlOvs.GIFT_EXCHANGE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.GET_ARCHIVE, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.SYNC_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.SYNC_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.CLEAR_ARCHIVE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
            HttpRequest.getInstance().request(RequestUrlOvs.GET_RANK_DATA, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
            HttpRequest.getInstance().request(RequestUrlOvs.GET_RANK_DATA_V2, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
            HttpRequest.getInstance().request(RequestUrlOvs.UPLOAD_USER_RANK_DATA, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
            HttpRequest.getInstance().request(RequestUrlOvs.UPLOAD_USER_RANK_DATA_V2, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.GAME_JSON, "GET", { "content-type": "application/json" },
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
        HttpRequest.getInstance().request(RequestUrlOvs.UPLOAD_SHARE_TASK, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        HttpRequest.getInstance().request(RequestUrlOvs.GET_SHARE_TASK_DETAIL, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
        // // @ts-ignore
        // TTMinis.game.checkScene({
        //     scene: "sidebar",
        //     success: (res) => {
        //         this.xLog("check scene success:", JSON.stringify(res));
        //         //成功回调逻辑
        //         callback(res.isExist);
        //     },
        //     fail: (res) => {
        //         this.xLog("check scene fail:", JSON.stringify(res));
        //         //失败回调逻辑
        //         callback(false);
        //     }
        // });
        callback(false);
    }
    gotoSidebar(): void {
        // // @ts-ignore
        // TTMinis.game.navigateToScene({
        //     scene: "sidebar",
        //     success: (res) => {
        //         this.xLog("navigate to scene success");
        //         // 跳转成功回调逻辑
        //         this.isSidebarGoto = true;
        //     },
        //     fail: (res) => {
        //         this.xLog("navigate to scene fail: ", JSON.stringify(res));
        //         // 跳转失败回调逻辑
        //         this.isSidebarGoto = false;
        //     },
        // });
        //@ts-ignore
        TTMinis.game.startEntranceMission({
            success:()=>{
                console.log("startEntranceMission success")
                //this.intoGameFromSidebar(this.sidebarCallback)
                this.sidebarCallback()
            },fail:()=>{
                console.log("startEntranceMission fail")
            },
            complete:() => {
                console.log("startEntranceMission complete");
            }
        })  
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        this.sidebarCallback = callback;
        // this.callbackGameFromResult();
        //@ts-ignore
        TTMinis.game.getEntranceMissionReward({
            success:({canReceiveReward})=>{
                console.log("getEntranceMissionReward success",canReceiveReward)
                callback(canReceiveReward);
            },fail:()=>{
                console.log("getEntranceMissionReward fail")
                
            },
            complete:() => {
                console.log("getEntranceMissionReward complete");
            }
        })
    }

    private callbackGameFromResult() {
        if (!this.sidebarCallback || !this.getLocationSuccess) {
            return;
        }
        this.sidebarCallback(this.location == "sidebar_card");
        this.getLocationSuccess = false;
        this.location = "";
        this.sidebarCallback = null;
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        // // @ts-ignore
        // TTMinis.game.checkShortcut({
        //     success: (res) => {
        //         if (!res.status.exist || res.status.needUpdate) {
        //             this.xLog("checkShortcut res:", JSON.stringify(res));
        //             this.xLog("未创建桌面图标或图标需要更新");
        //             callback(true);
        //         } else {
        //             this.xLog("已创建桌面图标");
        //             callback(false);
        //         }
        //     },
        //     fail: (res) => {
        //         this.xLog("添加桌面图标失败：", JSON.stringify(res));
        //         callback(false);
        //     }
        // })
        callback(true);

        //@ts-ignore
        TTMinis.game.getShortcutMissionReward({
            success:({canReceiveReward})=>{
                console.log("getShortcutMissionReward success",canReceiveReward)
                callback(canReceiveReward)
            },fail:()=>{
                console.log("getShortcutMissionReward fail")
                //EngineUtils.ShowText("添加失败")
            },
            complete:() => {
                console.log("getShortcutMissionReward complete");
            }
        })
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        TTMinis.game.addShortcut({
            success: (res) => {
                this.xLog("添加桌面成功");
                callback(true);
            },
            fail: (res) => {
                this.xLog("添加桌面失败", JSON.stringify(res));
                //callback(false);
            },
        });
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
        callback && callback("jumpToGameClubFail", { msg: "不存在游戏圈" })
    }

    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
    }
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
    }
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
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