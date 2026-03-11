import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Bilibili";
export default class BilibliSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "bilibili": {
            "jsCode": ""
        }
    }

    private initSdkPhasesCallback: (phases: string, res: object) => void;
    private showBannerPhasesCallback: (phases: string, res: object) => void;
    private showIntersPhasesCallback: ((phases: string, res: object) => void) | null;
    private showVideoPhasesCallback: (phases: string, res: object) => void;

    // 广告开关
    private switch_video: boolean = false;

    // 广告id
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

    // inters
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

    // force
    private time_now_force: number = 0;
    private achieveFirstForce: boolean = false;
    private number_now_force: number = 0;
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
    private completeOrders: string[] = [];
    private timeout_req_not_complete_orders: number = -1;
    private reqNum: number = 0;
    private payResultCallback: any;
    private isIosOpenCustomer: boolean = false;

    private systemInfo: { isStand: boolean, platform: string, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
        windowWidth: 0,
        windowHeight: 0
    };
    private userInfo: object;

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
        if (this.isNaturalFlow) return;
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
            case "VIDEO":
                return this.getVideoFlag();
            default:
                return false;
        }
    }

    private showAdByForce(): void {
        this.num_now_real_force++;
        switch (this.forceType) {
            case "VIDEO":
                this.getVideoFlag() && this.showVideo({}, (phases, res) => { });
                break;
        }
    }

    private phasesCallbackToInitSdk(phases: string, res: object): void {
        if (this.isReLogin) return;
        this.initSdkPhasesCallback && this.initSdkPhasesCallback(phases, res);
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
            this.getLocalstorage();
            this.channelLogin(null, null);
        });
        this.completeOrders = StringUtil.stringToArray(LocalStorage.getStringData("completeOrders"));
        this.onAppShow();
        if (params && params["accessToken"]) this.accessToken = params["accessToken"];
        if (params && params["versionCode"]) this.versionCode = params["versionCode"];
        this.runPerSecond();
        this.addOnHideListener();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        bl.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    // private isAttainTargetVersion(targetVer: string): boolean {
    //     let nowVer = this.systemInfo.version;
    //     let tarVerArray = targetVer.split('.').map(Number);
    //     let nowVerArray = nowVer.split('.').map(Number);
    //     return nowVerArray[0] * 100 + nowVerArray[1] * 10 + nowVerArray[2] * 1 >= tarVerArray[0] * 100 + tarVerArray[1] * 10 + tarVerArray[2] * 1;
    // }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = bl.getSystemInfoSync();
        this.xLog("info:" + JSON.stringify(info));
        this.systemInfo.platform = info.platform;
        this.loginParams["platformType"] = info.platform == "ios" ? "IOS" : "ANDROID";
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
    }

    private getLocalstorage(): void {
        this.firstRunApp = LocalStorage.getStringData("firstRunApp") == "";
        this.hasReportTargetAction = LocalStorage.getStringData("hasReportTargetAction") != "";
        this.isNaturalFlow = LocalStorage.getStringData("isNaturalFlow") == "";
        this.turbo_promoted_object_id = LocalStorage.getStringData("turbo_promoted_object_id");
        this.targetActionCountNow = Number(LocalStorage.getStringData("targetActionCountNow") == "" ? 0 : LocalStorage.getStringData("targetActionCountNow"));
    }

    private onAppShow(): void {
        // @ts-ignore
        bl.onShow((res) => {
            if (this.isIosOpenCustomer) {
                setTimeout(() => {
                    this.reqNotCompleteOrders();
                    this.isIosOpenCustomer = false;
                }, 500);
            }
            if (this.isSidebarGoto) {
                this.xLog("onShow res:" + JSON.stringify(res));
                this.location = res.query.scene;
                this.getLocationSuccess = true;
                this.callbackGameFromResult();
            }
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
        bl.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["bilibili"]["jsCode"] = res["code"];
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
            case "video":
                this.ge.adShowEvent("reward", this.id_video, {});
                break;
        }
    }

    private setNaturalFlow(naturalFlow: boolean): void {
        this.isNaturalFlow = naturalFlow;
        LocalStorage.setStringData("isNaturalFlow", naturalFlow ? "" : "2");
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
            if (this.loginParams["bilibili"]["jsCode"]) {
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
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        this.xLog("id_ad:" + JSON.stringify(id_ad));
        if (id_ad) {
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
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
        // if (this.switch_banner && this.id_banner) {
        //     this.createSystemBanner();
        // }
        // if (this.switch_inters && this.id_inters) {
        //     this.createSystemInters();
        // }
        if (this.switch_video && this.id_video) {
            this.createVideo();
        }
        setTimeout(() => {
            this.phasesCallbackToInitSdk("createAdFinish", {});
        }, 1000);
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
        this.videoAd = bl.createRewardedVideoAd({
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
            setTimeout(() => {
                if (res && res.isEnded) {
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
            }, 500)
        });
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        if (this.userInfo) {
            callback && callback({ ret: true, userInfo: this.userInfo });
            return;
        }
        // @ts-ignore
        bl.login({
            success: (res) => {
                if (res && res["code"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["bilibili"]["jsCode"] = res["code"];
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

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void {
    }

    hideBanner(): void {
    }

    getIntersFlag(): boolean {
        let videoLoad: boolean = this.load_success_video && this.probability_video > 0;
        return videoLoad;
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
            if (this.intersPopupType == "VIDEO") {
                canShowType.push("video");
            } else {
                canShowType.push("");
            }
            this.xLog("inters popup type:" + canShowType[0]);
            return canShowType[0];
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
            case "video":
                return this.probability_video;
            default:
                return 0;
        }
    }

    private showIntersAdByType(type: string): void {
        switch (type) {
            case "video":
                this.showVideo({}, (phases: string, res: object) => {
                    this.timestamp_last_hide_inters = new Date().getTime();
                });
                break;
            default:
                break;
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
        this.videoAd.show().then(() => {
            this.xLog("激励视频广告展示成功");
            this.geAdShowEventReport("video");
        }).catch((err) => {
            this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
            this.load_success_video = false;
            this.showVideoPhasesCallback("videoPlayBreak", {});
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
            bl.vibrateLong({
                success(res) {
                },
                fail(res) {
                }
            });
        }
        else if (type == "short") {
            // @ts-ignore
            bl.vibrateShort({
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
        bl.shareAppMessage({});
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
            bl.checkSession({
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
        bl.showLoading({ title: "请求中...请稍等", mask: true });
        setTimeout(() => {
            // @ts-ignore
            bl.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.channelLogin(() => {
            // @ts-ignore
            bl.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            bl.hideLoading();
            //登录失败，再次尝试支付
            this.pay(params, callback);
        });
    }

    private preOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.BL_PRE_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId, platformType: this.systemInfo.platform.toUpperCase() }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preOrderV2(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.BL_PRE_ORDER_V2, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId, platformType: this.systemInfo.platform.toUpperCase() }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preJsPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.BL_PRE_ORDER_JSPAY, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preJsPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private requestGamePayment(params): Promise<any> {
        return new Promise((resolve, reject) => {
            this.xLog("requestGamePayment payData:", JSON.stringify(params['data']['payData']));
            // @ts-ignore
            bl.requestRecharge({
                ...params['data']['payData'],
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
        if (!this.loginParams["bilibili"]["jsCode"] || !sessionPass) {
            this.xLog("用户未登录或登录已过期");
            this.xLog("code:" + this.loginParams["bilibili"]["jsCode"], "sessionPass:" + sessionPass);
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryPay(params, callback);
            } else {
                // @ts-ignore
                bl.showToast({ title: "payError" });
                this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录或登录已过期"));
            }
            return;
        }

        // @ts-ignore
        bl.showToast({ title: "请求支付中...", mask: true });

        let productExternalId: string = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        let payBalanceSuccess = false;
        let payFail = (msg) => {
            this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        };
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // android
        if (this.systemInfo.platform === "android" || this.systemInfo.platform === "windows" || this.systemInfo.platform === "mac") {
            // 预下单
            let preOrderObj = await this.preOrderV2(productExternalId);
            if (!preOrderObj.ret) {
                // @ts-ignore
                bl.showToast({ title: "preOrderFail" });
                payFail("preOrderFail");
                return;
            }
            try {
                orderNo = preOrderObj.res.data.orderNo;
                code = preOrderObj.res.code;
                codeMsg = preOrderObj.res.codeMsg;
            } catch (error) {
                // @ts-ignore
                bl.showToast({ title: "preOrderObjDataFail" });
                payFail("preOrderObjDataFail");
                return;
            }

            // 充值
            let requestGamePaymentObj = await this.requestGamePayment(preOrderObj.res);
            if (!requestGamePaymentObj.ret) {
                code = requestGamePaymentObj.code;
                codeMsg = requestGamePaymentObj.codeMsg;
                payFail("orderPayFail");
                return;
            }

            //支付成功
            this.callbackPayResultToClient("orderPayFinish", this.genPayResponseObject(
                productExternalId, orderNo, code, codeMsg));
        } else {
            let preJsPayOrderObj = await this.preJsPayOrder(productExternalId);

            if (!preJsPayOrderObj.ret) {
                // @ts-ignore
                bl.showToast({ title: "preOrderFail" });
                //支付失败
                payFail("preOrderFail");
                return;
            }

            let url;
            try {
                url = preJsPayOrderObj.res.data.url;
                orderNo = preJsPayOrderObj.res.data.orderNo;
            } catch (error) {
                // @ts-ignore
                bl.showToast({ title: "preJsPayOrderObjDataFail" });
                payFail("preJsPayOrderObjDataFail");
                return;
            }
            this.isIosOpenCustomer = true;
            // @ts-ignore
            bl.setClipboardData({ data: url });
            this.isIosOpenCustomer = true;
            // @ts-ignore
            bl.showModal({
                title: "下单成功",
                content: "支付链接已复制，请粘贴到微信搜索框或者聊天后点击支付",
                showCancel: false,
            });
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
        bl.checkScene({
            scene: "sidebar",
            success: (res) => {
                this.xLog("check scene success:" + JSON.stringify(res));
                //成功回调逻辑
                callback(true);
            },
            fail: (res) => {
                this.xLog("check scene fail:" + JSON.stringify(res));
                //失败回调逻辑
                callback(false);
            }
        });
    }
    gotoSidebar(): void {
        // @ts-ignore
        bl.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                this.xLog("navigate to scene success");
                // 跳转成功回调逻辑
                this.isSidebarGoto = true;
            },
            fail: (res) => {
                this.xLog("navigate to scene fail:" + JSON.stringify(res));
                // 跳转失败回调逻辑
                this.isSidebarGoto = false;
            },
        });
    }
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void {
        this.sidebarCallback = callback;
        this.callbackGameFromResult();
    }

    private callbackGameFromResult() {
        if (!this.sidebarCallback || !this.getLocationSuccess) {
            return;
        }
        this.sidebarCallback(this.location == "021036");
        this.getLocationSuccess = false;
        this.location = "";
        this.sidebarCallback = null;
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        // @ts-ignore
        bl.checkShortcut({
            success: (res) => {
                this.xLog("检查快捷方式 " + JSON.stringify(res));
                if (res.status.exist) callback(false);
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
        bl.addShortcut({
            success: () => {
                this.xLog("添加桌面成功");
                callback(true);
            },
            fail: (err) => {
                this.xLog("添加桌面失败 " + err.errMsg);
                callback(false);
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