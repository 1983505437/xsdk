import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Tiktok";
/*
 * @Author: Vae 
 * @Date: 2023-11-03 11:02:42 
 * @Last Modified by: Vae
 * @Last Modified time: 2026-01-23 11:09:45
 */
export default class TiktokSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "tiktok": {
            "code": "",
            "anonymousCode": ""
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
    private number_inters_popup: number = 0;
    private intersPopupType: string = "SCREEN";

    // force 强弹广告
    private switch_force: boolean = false;
    private time_first_force_delay: number = 30;
    private time_force_interval: number = 30;
    private forceType: string = "SCREEN";
    private number_force_start: number = 0;
    private num_force_max: number = 0;

    // 误触控制
    private num_video_max_show: number = 0;

    // 以下为代码控制控制变量===============================================
    // banner
    private bannerAd: any = null;
    private load_success_system_banner: boolean = false;
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
    private num_inters_now_show_2: number = 0;
    private num_inters_now_interval: number = 0;
    private hasAttachIntersStart: boolean = false;
    private systemIntersOnLoadCallback: () => void;
    private systemIntersOnCloseCallback: () => void;
    private systemIntersOnErrorCallback: (err) => void;

    // video
    private videoAd: any = null;
    private load_success_video: boolean = false;
    private hasShowVideo: boolean = false;
    private timeout_retry_load_video: number = -1;
    private num_video_now_show: number = 0;

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

    private systemInfo: { isStand: boolean, platform: string, appName: string, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
        appName: "Douyin",
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
    // 是否是广告投放用户
    private isADPUser: boolean = false;

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
        this.checkUpdate();
        this.getSystemInfo();
        this.getLaunchOptionsSync();
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin(null, null);
        })
        this.onAppShow();
        if (params && params["accessToken"]) this.accessToken = params["accessToken"];
        if (params && params["versionCode"]) this.versionCode = params["versionCode"];
        if (params && params["easAppId"]) this.easAppId = params["easAppId"];
        if (params && params["versionName"]) this.versionName = params["versionName"];
        if (params && params["pkgName"]) this.pkgName = params["pkgName"];
        this.runPerSecond();
        this.addOnHideListener();
    }

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    private addOnHideListener(): void {
        // @ts-ignore
        tt.onHide(() => {
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
        tt.login({
            force: false,
            success: (res) => {
                if (res && res["isLogin"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["tiktok"]["code"] = res["code"];
                    this.loginParams["tiktok"]["anonymousCode"] = res["anonymousCode"];
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
        tt.onShow((res) => {
            if (this.isIosOpenCustomer) {
                setTimeout(() => {
                    this.reqNotCompleteOrders();
                    this.isIosOpenCustomer = false;
                }, 500);
            }
            if (this.isSidebarGoto) {
                this.xLog("onShow res:" + JSON.stringify(res));
                this.location = res.location;
                this.getLocationSuccess = true;
                this.callbackGameFromResult();
            }
        });
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
        let info = tt.getSystemInfoSync();
        this.systemInfo.platform = info.platform;
        this.loginParams["platformType"] = info.platform == "ios" ? "IOS" : "ANDROID";
        this.systemInfo.appName = info.appName;
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
    }

    private getLaunchOptionsSync(): void {
        // @ts-ignore
        let info = tt.getLaunchOptionsSync();
        let sceneId = info.scene;
        switch (sceneId) {
            case "025001":
                this.sceneValue = sceneId + "-抖音广告投放";
                this.isADPUser = true;
                break;
            case "105001":
                this.sceneValue = sceneId + "-抖极广告投放";
                this.isADPUser = true;
                break;
            case "235001":
                this.sceneValue = sceneId + "-抖火广告投放";
                this.isADPUser = true;
                break;
            // case "023001":
            //     this.sceneValue = sceneId + "-抖音视频锚点";
            //     break;
            // case "233001":
            //     this.sceneValue = sceneId + "-抖音火山左下角小程序链接";
            //     break;
            // case "103001":
            //     this.sceneValue = sceneId + "-抖极视频锚点";
            //     break;
            default:
                this.sceneValue = sceneId;
                break;
        }
    }

    private checkUpdate(): void {
        //@ts-ignore
        const updateManager = tt.getUpdateManager();
        updateManager.onUpdateReady((res) => {
            // @ts-ignore
            tt.showModal({
                title: "更新提示",
                content: "新版本已经准备好，是否重启小游戏？",
                success: (res) => {
                    if (res && res["confirm"]) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                },
            });
        });

        updateManager.onUpdateFailed((err) => {
            // 新的版本下载失败
            this.xLog("版本下载失败原因", JSON.stringify(err));
            // @ts-ignore
            tt.showToast({
                title: "新版本下载失败，请稍后再试",
                icon: "none",
            });
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
        tt.login({
            force: false,
            success: (res) => {
                if (res && res["isLogin"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["tiktok"]["code"] = res["code"];
                    this.loginParams["tiktok"]["anonymousCode"] = res["anonymousCode"];
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
            store: "douyin", // 投放市场
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
                // this.ge.adShowEvent("interstitial", this.id_inters, {});
                this.eas.trackAdShowEvent("tiktok", this.id_screen, this.id_screen, "interstitial", "tiktok", 1, "CNY");
                break;
            case "video":
                // this.ge.adShowEvent("reward", this.id_video, {});
                this.eas.trackAdShowEvent("tiktok", this.id_video, this.id_video, "reward", "tiktok", 1, "CNY");
                break;
        }
    }

    // eas付费事件上报
    private easPayEventReport(orderNo: string, type: string): void {
        if (!this.isInitEAS) return;
        this.getProductInfoByOrderNo(orderNo, (ret: boolean, res: object) => {
            if (!ret || !res) return;
            let name = res["data"]["name"];
            let price = res["data"]["price"];
            let externalId = res["data"]["externalId"];
            this.eas.trackPayEvent(price * 100, "CNY", orderNo, 1, name, "tiktok", type == "create" ? 2 : 1, {
                pay_action: type == "create" ? "pay_try" : "pay_success", pay_order_id: orderNo, pay_product_id: externalId
            });
        });
    }

    private getProductInfoByOrderNo(orderNo: string, callback: (ret: boolean, res: object) => void) {
        HttpRequest.getInstance().request(RequestUrl.GET_PRODUCT_INFO, "GET", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") }, { orderNo: orderNo }, (ret: boolean, res: object) => {
            callback(ret, res);
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
            } else {
                this.phasesCallbackToInitSdk("serverLoginFail", res);
            }
            this.reqAdParams();
        })
    }

    private reqAdParams(): void {
        HttpRequest.getInstance().request(RequestUrl.GAME_CONTENT, "GET", { "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { gameChannelCodeNo: sdkConfig.gameChannelCodeNo, proxy: this.isADPUser ? "Y" : "N" }, (ret: boolean, adParams: object) => {
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
            if (this.loginParams["tiktok"]["code"]) {
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
        if (switch_ad) {
            this.switch_ad = switch_ad;
            this.switch_banner = switch_ad["banner"] ? switch_ad["banner"] : false;
            this.switch_video = switch_ad["video"] ? switch_ad["video"] : false;
            this.switch_screen = switch_ad["screen"] ? switch_ad["screen"] : false;
        }
        let id_ad: object = adParams["data"]["id"];
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_screen = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
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
            this.number_inters_popup = params_inters_control["popupIndex"] ?
                params_inters_control["popupIndex"] : 0;
            this.intersPopupType = params_inters_control["popupType"] ?
                params_inters_control["popupType"] : "SCREEN";
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
            this.num_video_max_show = params_video_wc["maxQty"] ? params_video_wc["maxQty"] : 0;
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
        this.bannerAd = tt.createBannerAd({
            adUnitId: this.id_banner,
            style: {
                left: -1000,
                top: -1000,
            },
        });

        this.bannerAd.onResize((size) => {
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
    }

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_screen)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        if (this.systemIntersAd) {
            this.systemIntersOnLoadCallback && this.systemIntersAd.offLoad(this.systemIntersOnLoadCallback);
            this.systemIntersOnErrorCallback && this.systemIntersAd.offError(this.systemIntersOnErrorCallback);
            this.systemIntersOnCloseCallback && this.systemIntersAd.offClose(this.systemIntersOnCloseCallback);
        }
        if (this.systemInfo.appName != "Toutiao" && this.systemInfo.appName != "Douyin") {
            this.xLog("非抖音、今日头条平台，当前app:" + this.systemInfo.appName + "不支持系统插屏广告");
            return;
        }
        // @ts-ignore
        this.systemIntersAd = tt.createInterstitialAd({
            adUnitId: this.id_screen
        });

        this.systemIntersOnLoadCallback = () => {
            this.xLog("@@@@@系统插屏广告加载成功@@@@@");
            this.load_success_system_inters = true
        }
        this.systemIntersOnErrorCallback = (err) => {
            this.xLog("#####系统插屏广告加载失败#####", JSON.stringify(err));
            this.load_success_system_inters = false;
            setTimeout(() => {
                this.systemIntersAd && this.systemIntersAd.load()
            }, 30 * 1000)
        }
        this.systemIntersOnCloseCallback = () => {
            this.xLog("系统插屏广告关闭");
            this.load_success_system_inters = false;
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
            this.systemIntersAd.destroy();
            setTimeout(() => {
                this.createSystemInters();
            }, 30 * 1000)
        }
        this.systemIntersAd.onLoad(this.systemIntersOnLoadCallback);
        this.systemIntersAd.onError(this.systemIntersOnErrorCallback);
        this.systemIntersAd.onClose(this.systemIntersOnCloseCallback);
        this.systemIntersAd.load();
    }

    private createVideo(): void {
        this.xLog("*****createVideo*****");
        if (StringUtil.containSpace(this.id_video)) {
            this.xLog("#####视频广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.videoAd = tt.createRewardedVideoAd({
            adUnitId: this.id_video
        });
        this.videoAd.onLoad(() => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
        });
        this.videoAd.onError((err) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(err));
            this.load_success_video = false;

            if (this.timeout_retry_load_video != -1) return;
            this.timeout_retry_load_video =
                setTimeout(() => {
                    this.videoAd && this.videoAd.load()
                    this.timeout_retry_load_video = -1;
                }, 30 * 1000)
        });
        this.videoAd.onClose((res) => {
            setTimeout(() => {
                if (res.isEnded) {
                    this.xLog("视频广告播放完成");
                    if (this.showVideoPhasesCallback) {
                        this.showVideoPhasesCallback("videoPlayFinish", {});
                        this.load_success_video = false;
                        this.videoAd.load();
                    }
                } else {
                    this.xLog("视频广告取消播放");
                    if (this.showVideoPhasesCallback) {
                        this.showVideoPhasesCallback("videoPlayBreak", {});
                        this.load_success_video = false;
                        this.videoAd.load();
                    }
                }
                this.hasShowVideo = false;
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

    private showSystemBanner(): void {
        if (this.bannerAd && this.load_success_system_banner) {
            this.xLog("showSystemBanner");
            this.bannerAd.show();
        }
    }

    private interiorShowBanner(): void {
        this.showBanner({}, this.showBannerPhasesCallback);
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

    getIntersFlag(): boolean {
        return true;
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
        this.num_inters_now_show++;
        if (!this.isAttainIntersLimit()) {
            this.intersPhasesCallback("intersNotLoad");
            return;
        }
        this.num_inters_now_show_2++;
        let willShowType: string = "inters";
        // 如果是固定弹出视频广告，未达到最大弹出次数
        if (this.intersPopupType != "SCREEN" && (this.num_video_max_show <= 0 || this.num_video_now_show < this.num_video_max_show)) {
            // 达到指定固定弹出次数
            if (this.num_inters_now_show_2 >= this.number_inters_popup) {
                willShowType = "video";
                if (!this.load_success_video) {
                    this.intersPhasesCallback("intersNotLoad");
                    return;
                } else {
                    this.num_inters_now_show_2 = 0;
                }
            }
        }

        if (willShowType == "video") {
            this.num_video_now_show++;
        } else if (!this.load_success_system_inters) {
            this.intersPhasesCallback("intersNotLoad");
            return;
        }

        // 判断是否有插屏延时控制
        if (this.probability_inters_delay > 0 && this.time_inters_delay > 0) {
            let ran: number = Math.random() * 100;
            if (ran < this.probability_inters_delay) {
                setTimeout(() => {
                    this.showIntersAdByType(willShowType);
                }, this.time_inters_delay);
            } else {
                this.showIntersAdByType(willShowType);
            }
        } else {
            this.showIntersAdByType(willShowType);
        }
    }

    private showSystemInters(): void {
        this.systemIntersAd.show().then(() => {
            this.xLog("showSystemInters");
            this.setIntersTimes();
        }).catch((err) => {
            this.xLog("showSystemInters fail. Error: " + JSON.stringify(err));
        });
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
        this.isShowVideo = true;
        if (this.videoAd) {
            this.videoAd.show()
                .then(() => {
                    this.xLog("激励视频广告展示成功");
                    this.setVideoTimes();
                })
                .catch((err) => {
                    this.xLog("#####激励视频广告播放失败#####", JSON.stringify(err));
                    this.hasShowVideo = false;
                    this.isShowVideo = false;
                    callback("videoPlayBreak", {});
                    this.videoAd.load();
                });
        }
        else {
            this.hasShowVideo = false;
            this.isShowVideo = false;
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
            tt.vibrateLong({
                success(res) {
                },
                fail(res) {
                    this.xLog("vibrateLong fail:" + JSON.stringify(res));
                }
            });
        } else {
            // @ts-ignore
            tt.vibrateShort({
                success(res) {
                },
                fail(res) {
                    this.xLog("vibrateShort fail:" + JSON.stringify(res));
                }
            });
        }
    }

    shareApp(): void {
        // @ts-ignore
        tt.shareAppMessage({});
    }

    private preOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.TIKTOK_PRE_ORDER_DEFAULT, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preJsPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.TIKTOK_PRE_ORDER_JSPAY, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preJsPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    private preIosPayOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.TIKTOK_PRE_ORDER_IOS_PAY2, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preIosPayOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                })
        });
    }

    // 尝试消费游戏币余额
    private tryConsumeBalance(orderNo: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.TIKTOK_PAY_BALANCE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
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
            tt.checkSession({
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
            if (price < 1 && tt.canIUse("requestGamePayment.object.goodType")) {
                // @ts-ignore
                tt.requestGamePayment({
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
                tt.requestGamePayment({
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
        tt.showLoading({ title: "请求中...请稍等", mask: true });
        setTimeout(() => {
            // @ts-ignore
            tt.hideLoading();
        }, 5000);
        this.isReLogin = true;
        this.channelLogin(() => {
            // @ts-ignore
            tt.hideLoading();
            this.pay(params, callback);
        }, () => {
            // @ts-ignore
            tt.hideLoading();
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
        if (!this.loginParams["tiktok"]["code"] || !sessionPass) {
            this.xLog("用户未登录或登录已过期");
            if (!retryLogin) {
                params["retryLogin"] = true;
                this.loginRetryPay(params, callback);
            } else {
                // @ts-ignore
                tt.showToast({ title: "payError" });
                this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录或登录已过期"));
            }
            return;
        }

        // @ts-ignore
        tt.showToast({ title: "请求支付中...", mask: true });

        let productExternalId: string = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        let buyQuantity;
        let price;
        let productName;
        let payBalanceSuccess = false;
        let payFail = (msg) => {
            this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        };
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // android
        if (this.systemInfo.platform === "android") {
            // 预下单
            let preOrderObj = await this.preOrder(productExternalId);
            if (!preOrderObj.ret) {
                // @ts-ignore
                tt.showToast({ title: "preOrderFail" });
                payFail("preOrderFail");
                return;
            }
            try {
                orderNo = preOrderObj.res.data.orderNo;
                code = preOrderObj.res.code;
                codeMsg = preOrderObj.res.codeMsg;
                buyQuantity = preOrderObj.res.data.buyQuantity;
                price = preOrderObj.res.data.product.price;
                productName = preOrderObj.res.data.product.name;
            } catch (error) {
                // @ts-ignore
                tt.showToast({ title: "preOrderObjDataFail" });
                payFail("preOrderObjDataFail");
                return;
            }

            this.easPayEventReport(orderNo, "create");

            // @ts-ignore
            if (price < 1 && tt.canIUse("requestGamePayment.object.goodType")) {
                let requestGamePaymentObj = await this.requestGamePayment(buyQuantity, orderNo, price, productName);
                if (!requestGamePaymentObj.ret) {
                    code = requestGamePaymentObj.code;
                    codeMsg = requestGamePaymentObj.codeMsg;
                    payFail("orderPayFail");
                    return;
                }
            } else {
                // 消费余额
                let tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
                if (!tryConsumeBalanceObj.ret) {
                    // @ts-ignore
                    tt.showToast({ title: "orderPayFail" });
                    payFail("orderPayFail");
                    return;
                }
                try {
                    payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
                    code = tryConsumeBalanceObj.res.code;
                    codeMsg = tryConsumeBalanceObj.res.codeMsg;
                } catch (error) {
                    // @ts-ignore
                    tt.showToast({ title: "tryConsumeBalanceDataFail" });
                    payFail("tryConsumeBalanceDataFail");
                    return;
                }

                // 余额不够,充值
                if (!payBalanceSuccess) {
                    let requestGamePaymentObj = await this.requestGamePayment(buyQuantity, orderNo, price, productName);
                    if (!requestGamePaymentObj.ret) {
                        code = requestGamePaymentObj.code;
                        codeMsg = requestGamePaymentObj.codeMsg;
                        payFail("orderPayFail");
                        return;
                    }

                    // 充值成功,再次尝试扣款
                    tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
                    // 扣款再次失败
                    if (!tryConsumeBalanceObj.ret) {
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
                        // 余额不够，再次扣款失败
                        payFail("orderPayFail");
                        return;
                    }
                }
            }

            //支付成功
            this.callbackPayResultToClient("orderPayFinish", this.genPayResponseObject(
                productExternalId, orderNo, code, codeMsg));
        } else {
            // let preJsPayOrderObj = await this.preJsPayOrder(productExternalId);
            let preIosPayOrderObj = await this.preIosPayOrder(productExternalId);

            //支付失败
            if (!preIosPayOrderObj.ret) {
                // @ts-ignore
                tt.showToast({ title: "preOrderFail" });
                payFail("preOrderFail");
                return;
            }

            let buyQuantity;
            try {
                buyQuantity = preIosPayOrderObj.res.data.buyQuantity;
                price = preIosPayOrderObj.res.data.product.price;
                productName = preIosPayOrderObj.res.data.product.name;
                orderNo = preIosPayOrderObj.res.data.orderNo;
            } catch (error) {
                // @ts-ignore
                tt.showToast({ title: "preIosPayOrderObjDataFail" });
                payFail("preIosPayOrderObjDataFail");
                return;
            }
            this.easPayEventReport(orderNo, "create");

            this.isIosOpenCustomer = true;
            // 小额支付
            if (price < 1) {
                // 使用道具直购
                // @ts-ignore
                if (tt.canIUse("openAwemeCustomerService.object.goodType")) {
                    // @ts-ignore
                    tt.openAwemeCustomerService({
                        goodType: 2, // 道具直购
                        orderAmount: price * 100, // 道具现金价值，单位分
                        goodName: productName, // 道具名称
                        currencyType: "DIAMOND", // 币种：目前仅为"DIAMOND"
                        zoneId: "1",
                        customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
                        extraInfo: orderNo, //extraInfo要转成字符串
                        success: (res) => {
                            this.xLog("调用函数成功");
                        },
                        fail: (res) => {
                            this.xLog("调用函数失败");
                        },
                        complete: (res) => {
                            this.xLog("调用完成");
                        },
                    });
                } else {
                    // @ts-ignore
                    tt.openAwemeCustomerService({
                        currencyType: "DIAMOND_PROP", // 币种：目前仅为"DIAMOND"
                        buyQuantity: buyQuantity, // 购买游戏币数量
                        zoneId: "1",
                        customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
                        extraInfo: orderNo,  //extraInfo要转成字符串
                        success: (res) => {
                            this.xLog("调用函数成功");
                        },
                        fail: (res) => {
                            this.xLog("调用函数失败");
                        },
                        complete: (res) => {
                            this.xLog("调用完成");
                        },
                    });
                }
            } else {
                // @ts-ignore
                tt.openAwemeCustomerService({
                    currencyType: "DIAMOND", // 币种：目前仅为"DIAMOND"
                    buyQuantity: buyQuantity, // 购买游戏币数量
                    zoneId: "1",
                    customId: orderNo, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
                    extraInfo: orderNo,  //extraInfo要转成字符串
                    success: (res) => {
                        this.xLog("调用函数成功");
                    },
                    fail: (res) => {
                        this.xLog("调用函数失败");
                    },
                    complete: (res) => {
                        this.xLog("调用完成");
                    },
                });
            }
        }
    }

    orderComplete(orderNo: string): void {
        this.consumeOrder(orderNo);
        if (this.completeOrders.indexOf(orderNo) == -1) {
            this.setPayTimes();
            this.easPayEventReport(orderNo, "complete");
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
    }

    onClickUserAgreementBtn(): void {
    }

    reportEvent(eventName: string, eventParams: object, level: number): void {
        if (!this.isInitEAS) return;
        if (!eventName) return;
        this.eas.track(eventName, eventParams);
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
        // @ts-ignore
        tt.checkScene({
            scene: "sidebar",
            success: (res) => {
                this.xLog("check scene success:", JSON.stringify(res));
                //成功回调逻辑
                callback(res.isExist);
            },
            fail: (res) => {
                this.xLog("check scene fail:", JSON.stringify(res));
                //失败回调逻辑
                callback(false);
            }
        });
    }
    gotoSidebar(): void {
        // @ts-ignore
        tt.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                this.xLog("navigate to scene success");
                // 跳转成功回调逻辑
                this.isSidebarGoto = true;
            },
            fail: (res) => {
                this.xLog("navigate to scene fail: ", JSON.stringify(res));
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
        this.sidebarCallback(this.location == "sidebar_card");
        this.getLocationSuccess = false;
        this.location = "";
        this.sidebarCallback = null;
    }

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void {
        // @ts-ignore
        tt.checkShortcut({
            success: (res) => {
                if (!res.status.exist || res.status.needUpdate) {
                    this.xLog("checkShortcut res:", JSON.stringify(res));
                    this.xLog("未创建桌面图标或图标需要更新");
                    callback(true);
                } else {
                    this.xLog("已创建桌面图标");
                    callback(false);
                }
            },
            fail: (res) => {
                this.xLog("添加桌面图标失败：", JSON.stringify(res));
                callback(false);
            }
        })
    }
    addDesktop(callback: (isSuccess: boolean) => void): void {
        // @ts-ignore
        tt.addShortcut({
            success: (res) => {
                this.xLog("添加桌面成功");
                callback(true);
            },
            fail: (res) => {
                this.xLog("添加桌面失败", JSON.stringify(res));
                callback(false);
            },
        });
    }

    startGameVideo(duration: number): void {
        if (!this.gameRecord) {
            // @ts-ignore
            this.gameRecord = tt.getGameRecorderManager();

            this.gameRecord.onStart((res) => {
                this.xLog("startGameVideo");
            });
            this.gameRecord.onPause((res) => {
                this.xLog("pauseGameVideo");
            });
            this.gameRecord.onResume((res) => {
                this.xLog("resumeGameVideo");
            });
            this.gameRecord.onStop(res => {
                this.xLog("stopGameVideo " + res.videoPath);
                this.videoPath = res.videoPath;
                this.stopGameVideoCallback(this.videoPath);
                this.videoPath = "";
                this.stopGameVideoCallback = null;
            });

            this.gameRecord.onError(errMsg => {
                this.xLog("录屏错误:" + JSON.stringify(errMsg));
            });
        }
        this.gameRecord.start({
            duration: duration
        });
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
        if (!this.gameRecord) return;
        this.stopGameVideoCallback = callback;
        this.gameRecord.stop();
    }
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void {
        if (!videoPath) {
            this.xLog("录屏地址为空");
            return;
        }
        // @ts-ignore
        tt.shareAppMessage({
            channel: "video",
            title: title,
            desc: desc,
            extra: {
                videoPath: videoPath, // 可替换成录屏得到的视频地址
                videoTopics: [topics], //该字段已经被hashtag_list代替，为保证兼容性，建议两个都填写。
                hashtag_list: [topics],
            },
            success: () => {
                this.xLog("分享录屏成功");
                callback(true);
            },
            fail: (res) => {
                this.xLog("分享录屏失败 ", JSON.stringify(res));
                callback(false);
            },
        });
    }

    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void {

    }

    jumpToGameClub(callback?: (phases: string, res: object) => void): void {
        callback && callback("jumpToGameClubFail", { msg: "不存在游戏圈" })
    }

    setImRankData(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.loginParams["tiktok"]["code"]) {
            callback("setImRankDataFail", { msg: "用户未登录" });
            return;
        }
        // @ts-ignore
        tt.setImRankData({
            extra: params["extra"],
            priority: params["priority"],
            zoneId: params["zoneId"],
            value: params["value"],
            dataType: params["dataType"],
            success: (res) => {
                this.xLog("写入排行榜数据成功, res:", JSON.stringify(res));
                callback && callback("setImRankDataSuccess", {});
            },
            fail: (res) => {
                this.xLog("写入排行榜数据失败, res:", JSON.stringify(res));
                callback && callback("setImRankDataFail", {});
            }
        });
    }
    getImRankData(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.loginParams["tiktok"]["code"]) {
            callback("getImRankDataFail", { msg: "用户未登录" });
            return;
        }
        // @ts-ignore
        tt.getImRankData({
            zoneId: params["zoneId"],
            dataType: params["dataType"],
            relationType: params["relationType"],
            pageSize: params["pageSize"],
            rankType: params["rankType"],
            pageNum: params["pageNum"],
            success: (res) => {
                this.xLog("获取排序好的「好友/总榜」数据源成功, res:", JSON.stringify(res));
                callback && callback("getImRankDataSuccess", { res });
            },
            fail: (res) => {
                this.xLog("获取排序好的「好友/总榜」数据源失败, res:", JSON.stringify(res));
                callback && callback("getImRankDataFail", {});
            }
        });
    }
    getImRankList(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.loginParams["tiktok"]["code"]) {
            callback("getImRankListFail", { msg: "用户未登录" });
            return;
        }
        // @ts-ignore
        tt.getImRankList({
            zoneId: params["zoneId"],
            suffix: params["suffix"],
            rankTitle: params["rankTitle"],
            dataType: params["dataType"],
            relationType: params["relationType"],
            rankType: params["rankType"],
            success: (res) => {
                this.xLog("自动绘制游戏好友排行榜成功, res:", JSON.stringify(res));
                callback && callback("getImRankListSuccess", {});
            },
            fail: (res) => {
                this.xLog("自动绘制游戏好友排行榜失败, res:", JSON.stringify(res));
                callback && callback("getImRankListFail", {});
            }
        });
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