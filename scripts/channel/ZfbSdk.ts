import IXSdk from "../IXSdk";
import { sdkConfig } from "../SdkConfig";
import EngineUtils from "../utils/EngineUtils";
import { CallbackMsg, RequestUrl, TAG } from "../utils/Enums";
import HttpRequest from "../utils/HttpRequest";
import LocalStorage from "../utils/LocalStorage";
import StringUtil from "../utils/StringUtil";

const TAG_CHANNEL = TAG + "-Zfb";
export default class ZfbSdk implements IXSdk {

    private loginParams: object = {
        "gameChannelCodeNo": sdkConfig.gameChannelCodeNo,
        "platformType": "IOS",
        "type": "USER",
        "guestGameUserId": "",
        "alipay": {
            "authCode": "string"
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

    // 广告id
    private id_banner: string = "";
    private id_inters: string = "";
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
    private probability_video: number = 0;

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

    private systemInfo: { isStand: boolean, platform: string, platformVersionCode: number, windowWidth: number, windowHeight: number } = {
        isStand: true,
        platform: "android",
        platformVersionCode: 1060,
        windowWidth: 0,
        windowHeight: 0
    };
    // pay
    private payCallback: (res: object[]) => void;

    // 进入游戏时的时间戳
    private time_into_game: number = 0;
    private switch_pay: boolean = false;
    private completeOrdersString: string = "";
    private timeout_req_not_complete_orders: number = -1;
    private reqNum: number = 0;
    private payResultCallback: any;
    //处理待扣除虚拟币的订单
    private handlePendingOrderComplete: boolean = false;
    // 最后一次同步存档回调
    private lastSyncArchiveCallback: (phases: string, res: object) => void;
    // 最后一次同步存档参数
    private lastSyncArchiveParams: object;

    // 广告开关参数
    private switch_ad: object;


    private phasesCallbackToInitSdk(phases: string, res: object): void {
        this.initSdkPhasesCallback && this.initSdkPhasesCallback(phases, res);
    }

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void {
        this.getSystemInfo();
        this.time_into_game = new Date().getTime();
        if (callback) this.initSdkPhasesCallback = callback;
        this.getInitContent((phases: string, res: object) => {
            if (phases == "getInitContentSuccess" && res["data"] && res["data"]["blockCity"]) {
                this.phasesCallbackToInitSdk("channelLoginFail", res);
                EngineUtils.showToast("游戏暂停服务，维护中！");
                return;
            }
            this.channelLogin();
        });
        this.completeOrdersString = LocalStorage.getStringData("completeOrdersString");
        this.addOnHideListener();
    }

    private addOnHideListener(): void {
        // @ts-ignore
        my.onHide(() => {
            if (this.lastSyncArchiveParams) {
                this.lastSyncArchiveParams["sdkCall"] = true;
                this.setArchive(this.lastSyncArchiveParams, this.lastSyncArchiveCallback);
            }
        });
    }

    private getSystemInfo(): void {
        // @ts-ignore
        let info = my.getSystemInfoSync();
        this.systemInfo.platform = (info.platform == "iOS" || info.platform == "iPhone OS") ? "ios" : "android";
        this.loginParams["platformType"] = (info.platform == "iOS" || info.platform == "iPhone OS") ? "IOS" : "ANDROID";
        this.systemInfo.windowWidth = Number(info.windowWidth);
        this.systemInfo.windowHeight = Number(info.windowHeight);
        if (this.systemInfo.windowWidth > this.systemInfo.windowHeight) {
            this.systemInfo.isStand = false;
        }
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
        my.getAuthCode({
            scopes: 'auth_base',//建议使用默认授权方式
            success: (res) => {
                if (res && res["authCode"]) {
                    this.xLog("登录成功", res);
                    this.loginParams["alipay"]["authCode"] = res.authCode;
                    this.phasesCallbackToInitSdk("channelLoginSuccess", res);
                } else {
                    this.xLog("登录失败：", res);
                    this.loginParams["type"] = "GUEST";
                    this.loginParams["guestGameUserId"] = LocalStorage.getStringData("gameUserId");
                    this.phasesCallbackToInitSdk("channelLoginFail", res);
                }
                this.serverLogin();
            },
            fail: (err) => {
                this.xLog('my.getAuthCode 调用失败:' + err)
            }
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
        if (!adParams["data"]["paymentStatus"] || (!adParams["data"]["paymentAndroidStatus"] && !adParams["data"]["paymentIOSStatus"])) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
        } else {
            if (this.loginParams["alipay"]["authCode"]) {
                this.switch_pay = true;
                this.reqNotCompleteOrders();
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
        }
        let id_ad: object = adParams["data"]["id"];
        this.xLog("id_ad:" + JSON.stringify(id_ad));
        if (id_ad) {
            this.id_banner = id_ad["banner"] ? id_ad["banner"] : "";
            this.id_inters = id_ad["screen"] ? id_ad["screen"] : "";
            this.id_video = id_ad["video"] ? id_ad["video"] : "";
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
        }
        let params_inters_more: object = adParams["data"]["screens"];
        this.xLog("params_inters_more:" + JSON.stringify(params_inters_more));
        if (params_inters_more && params_inters_more["status"]) {
            this.probability_inters = params_inters_more["screenRate"] ? params_inters_more["screenRate"] : 0;
            this.probability_video = params_inters_more["videoRate"] ? params_inters_more["videoRate"] : 0;
        }

        this.createAd();
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
                this.payCallback && this.payCallback(finalList);
            }
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

    setPaySuccessListener(callback: (res: object[]) => void): void {
        this.payCallback = callback;
    }

    private reqNotConsumeOrders(callback: (ret: boolean, res: object) => void): void {
        HttpRequest.getInstance().request(RequestUrl.NOT_CONSUME_LIST, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            {}, (ret: boolean, res: object) => {
                callback(ret, res);
            });
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
        // @ts-ignore
        this.bannerAd = my.createBannerAd({
            adUnitId: this.id_banner,
            style: {
                left: 0,
                top: 76,
                width: this.systemInfo.isStand ? this.systemInfo.windowWidth : 300
            },
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

    private createSystemInters(): void {
        this.xLog("*****createSystemInters*****");
        if (StringUtil.containSpace(this.id_inters)) {
            this.xLog("#####插屏广告ID存在空格,请检查后台#####");
            return;
        }
        // @ts-ignore
        this.systemIntersAd = my.createInterstitialAd({
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
        this.systemIntersAd.onClose((res) => {
            this.timestamp_last_hide_inters = new Date().getTime();
            this.intersPhasesCallback("intersClose");
        });
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
        this.videoAd = my.createRewardedAd({
            adUnitId: this.id_video
        });
        this.videoAd.onLoad((res) => {
            this.xLog("@@@@@视频广告加载成功@@@@@");
            this.load_success_video = true;
        });
        this.videoAd.onError((error) => {
            this.xLog("#####视频广告加载失败#####", JSON.stringify(error));
            this.load_success_video = false;
            this.retryLoadVideo();
        });
        this.videoAd.onClose((res) => {
            if (res && res.isEnded) {
                this.xLog("视频广告播放完成");
                this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayFinish", {});
                this.videoAd.load();
            } else {
                this.xLog("视频广告取消播放");
                this.showVideoPhasesCallback && this.showVideoPhasesCallback("videoPlayBreak", {});
                this.videoAd.load();
            }
        });
        this.videoAd.load();
    }

    private retryLoadVideo(): void {
        if (this.timeout_retry_load_video != -1) return;
        this.timeout_retry_load_video =
            setTimeout(() => {
                this.videoAd && this.videoAd.load();
                clearTimeout(this.timeout_retry_load_video);
                this.timeout_retry_load_video = -1;
            }, 20 * 1000)
    }

    private retryLoadBanner(): void {
        this.timeout_retry_load_banner =
            setTimeout(() => {
                this.createSystemBanner();
                clearTimeout(this.timeout_retry_load_banner);
                this.timeout_retry_load_banner = -1;
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

    setOnResultListener(callback: (code: number, res: string) => void): void {
    }

    getUserInfo(callback: (userInfo: { ret: boolean; userInfo: object; }) => void): void {
        callback({ ret: false, userInfo: {} });
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

    private getShowInterTypeBySetting(): string {
        let canShowType: string[] = [];
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
            this.systemIntersAd.show();
        }
    }

    getIntersFlag(): boolean {
        let systemIntersLoad: boolean = this.load_success_system_inters && this.probability_inters > 0 && this.num_system_inters_now_show < this.num_system_inters_max_show;
        let videoLoad: boolean = this.load_success_video && this.probability_video > 0;
        return systemIntersLoad || videoLoad;
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
    }

    shareApp(): void {
    }

    private callbackPayResultToClient(msg, object): void {
        if (!this.payResultCallback) return;
        if (this.completeOrdersString.includes(object["orderNo"])) return;
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

    private preOrder(productExternalId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.ZFB_PRE_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { productExternalId: productExternalId }, (ret: boolean, res: object) => {
                    this.xLog("preOrder ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                });
        });
    }

    // 尝试消费游戏币余额
    private tryConsumeBalance(orderNo: string): Promise<any> {
        return new Promise((resolve, reject) => {
            HttpRequest.getInstance().request(RequestUrl.ZFB_PAY_BALANCE, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
                { orderNo: orderNo }, (ret: boolean, res: object) => {
                    this.xLog("tryConsumeBalance ret:" + ret + " res:" + JSON.stringify(res));
                    resolve({ ret, res });
                });
        });
    }

    private requestGamePayment(buyQuantity, orderNo): Promise<any> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            my.requestGamePayment({
                buyQuantity: buyQuantity, // 购买数量，必须满足：金币数量*金币单价 = 限定价格等级（详见金币限定等级）
                customId: orderNo, //开发者自定义唯一订单号
                extraInfo: {
                    key: "value"
                },
                success: (res) => {
                    this.xLog("requestGamePayment pay success:" + JSON.stringify(res));
                    if (res && res.resultCode == "9000") {
                        resolve({ ret: true });
                    } else {
                        resolve({ ret: false, code: res["resultCode"], codeMsg: "" });
                    }
                },
                fail: (res) => {
                    this.xLog("requestGamePayment pay fail:" + JSON.stringify(res));
                    resolve({ ret: false, code: res["code"], codeMsg: res["codeMsg"] });
                }
            })

        });
    }

    async pay(params: object, callback: (phases: string, res: object) => void): Promise<void> {
        this.payResultCallback = callback;
        if (this.systemInfo.platform != "android") {
            this.xLog("#####非安卓平台，无法调用支付接口#####");
            this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "非安卓平台，无法调用支付接口"));
            return;
        }
        if (!this.switch_pay) {
            this.xLog("#####支付总开关未开启或支付配置未设置#####");
            this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", CallbackMsg.PAY_SWITCH_NOT_ENABLE));
            return;
        }
        if (!this.loginParams["alipay"]["authCode"]) {
            this.xLog("用户未登录");
            // @ts-ignore
            my.showToast({ title: "payError" });
            this.callbackPayResultToClient("payError", this.genPayResponseObject(params["productExternalId"], "-1", "-1", "用户未登录"));
            return;
        }
        // @ts-ignore
        my.showToast({ title: "请求支付中...", mask: true });

        let productExternalId: string = params["productExternalId"];
        let orderNo = "-1";
        let code = "-1";
        let codeMsg = "";
        let buyQuantity;
        let payBalanceSuccess = false;
        let payFail = (msg) => {
            this.callbackPayResultToClient(msg, this.genPayResponseObject(productExternalId, orderNo, code, codeMsg));
        };
        this.xLog("platform:" + this.systemInfo.platform, "productExternalId:" + productExternalId);
        // 预下单
        let preOrderObj = await this.preOrder(productExternalId);
        if (!preOrderObj.ret) {
            // @ts-ignore
            my.showToast({ title: "preOrderFail" });
            payFail("preOrderFail");
            return;
        }
        try {
            orderNo = preOrderObj.res.data.orderNo;
            code = preOrderObj.res.code;
            codeMsg = preOrderObj.res.codeMsg;
            buyQuantity = preOrderObj.res.data.buyQuantity;
        } catch (error) {
            // @ts-ignore
            my.showToast({ title: "preOrderObjDataFail" });
            payFail("preOrderObjDataFail");
            return;
        }

        //消费余额
        let tryConsumeBalanceObj = await this.tryConsumeBalance(orderNo);
        if (!tryConsumeBalanceObj.ret) {
            // @ts-ignore
            my.showToast({ title: "orderPayFail" });
            payFail("orderPayFail");
            return;
        }
        try {
            payBalanceSuccess = tryConsumeBalanceObj.res.data.payBalanceSuccess;
            code = tryConsumeBalanceObj.res.code;
            codeMsg = tryConsumeBalanceObj.res.codeMsg;
        } catch (error) {
            // @ts-ignore
            my.showToast({ title: "tryConsumeBalanceDataFail" });
            payFail("tryConsumeBalanceDataFail");
            return;
        }

        // 余额不够，充值
        if (!payBalanceSuccess) {
            let requestPaymentObj = await this.requestGamePayment(buyQuantity, orderNo);
            if (!requestPaymentObj.ret) {
                code = requestPaymentObj.code;
                codeMsg = requestPaymentObj.codeMsg;
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

    }

    private consumeOrder(orderNo: string): void {
        HttpRequest.getInstance().request(RequestUrl.CONSUME_ORDER, "POST", { "content-type": "application/json", "Authorization": "Bearer " + LocalStorage.getStringData("token") },
            { orderNo: orderNo }, (ret: boolean, res: object) => {
                if (ret) {
                    this.xLog("orderNo:" + orderNo + " 订单完成");
                }
            });
    }

    orderComplete(orderNo: string): void {
        this.xLog("orderComplete:" + orderNo, "this.completeOrdersString:" + this.completeOrdersString);
        this.consumeOrder(orderNo);
        if (!this.completeOrdersString.includes(orderNo)) {
            this.completeOrdersString = this.completeOrdersString + "," + orderNo;
            LocalStorage.setStringData("completeOrdersString", this.completeOrdersString);
        }
    }

    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void {
        callback && callback("giftExchangeFail", {});
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
        callback && callback("getRankDataFail", {});
    }

    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void {
        callback && callback("uploadUserRankDataFail", {});
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

    setUserProperty(params: object): void {
    }

    getChannelId(): number {
        return 0;
    }

    gotoOppoGameCenter(): void {
    }
}