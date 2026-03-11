import XSdk from "../XSdk";
import EngineUtils from "./EngineUtils";
import { TAG } from "./Enums";
import LocalStorage from "./LocalStorage";

/*
 * @Author: Vae 
 * @Date: 2023-10-24 12:19:42 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-01-09 12:14:27
 */
export default class PrivacyAgreement {
    private static instance: PrivacyAgreement;

    /**
     * PrivacyAgreement 单例
     */
    public static getInstance(): PrivacyAgreement {
        if (!PrivacyAgreement.instance) {
            PrivacyAgreement.instance = new PrivacyAgreement();
        }
        return PrivacyAgreement.instance;
    }

    private isStand: boolean = true;
    private sceneWidth: number = 0;
    private sceneHeight: number = 0;
    private onlyPrivacy: boolean = true;
    private loadSuccessRes: boolean = false;
    private loadSuccessRemoteRes: boolean = false;
    private company: string = "yx";
    private privacyRes: object;
    private remoteRes: any[];
    private hasAgree: boolean = true;
    private agreeCallback: (phases: string, res: object) => void;
    private maxRetryTimes: number = 30;
    private nowRetryTimes: number = 0;

    private group: string;
    private nodePrivacyAgreement: cc.Node;


    public setPrivacyConfig(hasPrivacy: boolean, onlyPrivacy: boolean, callback?: (phases: string, res: object) => void): void {
        if (callback) this.agreeCallback = callback;
        this.onlyPrivacy = onlyPrivacy;
        if (hasPrivacy) {
            this.group = LocalStorage.getStringData("group");
            this.company = LocalStorage.getStringData("company");
            this.sceneWidth = cc.winSize.width;
            this.sceneHeight = cc.winSize.height;
            this.isStand = this.sceneWidth < this.sceneHeight;

            this.hasAgree = LocalStorage.getStringData("agreePrivacy") == "1";
            if (this.hasAgree) {
                this.agreeCallback && this.agreeCallback("agreePrivacy", {});
                this.loadRes((ret: boolean) => { });
                return;
            }

            this.loadRes((ret: boolean) => {
                if (!ret) {
                    this.agreeCallback && this.agreeCallback("loadPrivacyAtlasFail", { msg: "隐私协议图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下" });
                } else {
                    onlyPrivacy ? this.showOnlyPrivacyPopup() : this.showTwoAgreementPopup();
                }
            });
        } else {
            this.agreeCallback && this.agreeCallback("agreePrivacy", {});
        }
    }

    private loadRes(callback: (ret: boolean) => void): void {
        let loadAtlasResSuccess = false;
        let loadRemoteResSuccess = false;
        let loadTimes = 0;
        let cb = () => {
            loadTimes++;
            if (loadTimes >= 2) callback(loadAtlasResSuccess && loadRemoteResSuccess);
        }
        EngineUtils.loadPrivacyAtlas((ret1: boolean, res: object) => {
            this.loadSuccessRes = ret1;
            this.privacyRes = res;
            loadAtlasResSuccess = ret1;
            console.log(TAG, "loadAtlasRes:" + ret1);
            cb();
        });
        let companyEnd: string = "textYX.png";
        switch (this.company) {
            case "mq":
                companyEnd = "textMQ.png";
                break;
            case "xyy":
                companyEnd = "textXYY.png";
                break;
            case "xmy":
                companyEnd = "textXMY.png";
                break;
            case "qyw":
                companyEnd = "textQYW.png";
                break;
            case "mml":
                companyEnd = "textMML.png";
                break;
            case "ob":
                companyEnd = "textOB.png";
                break;
            case "hks":
                companyEnd = "textHKS.png";
                break;
            case "ylly":
                companyEnd = "textYLLY.png";
                break;
            default:
                break;
        }
        let companyUrl: string = "https://xgamesdk.xplaymobile.com/minigame/privacy/" + companyEnd;
        let textService: string = "https://xgamesdk.xplaymobile.com/minigame/privacy/textService.png";
        let loaded: string[] = this.onlyPrivacy ? [companyUrl] : [companyUrl, textService];

        if (LocalStorage.getStringData("channelNameEn") == "huawei") {
            this.loadSuccessRemoteRes = true;
            loadRemoteResSuccess = true;
            console.log(TAG, "loadRemoteRes:true");
            cb();
            return;
        }

        EngineUtils.loadResArray(loaded, (ret: boolean, res: any[]) => {
            this.loadSuccessRemoteRes = ret;
            this.remoteRes = res;
            loadRemoteResSuccess = ret;
            console.log(TAG, "loadRemoteRes:" + ret);
            cb();
        });
    }

    private setGroup(node: cc.Node): void {
        if (this.group) node.group = this.group;
    }

    private showOnlyPrivacyPopup(): void {
        console.log(TAG, "loadSuccessRes:" + this.loadSuccessRes + ";loadSuccessRemoteRes:" + this.loadSuccessRemoteRes);
        if (!this.loadSuccessRes || !this.loadSuccessRemoteRes) {
            this.nowRetryTimes++;
            if (this.nowRetryTimes >= this.maxRetryTimes) return;
            setTimeout(() => {
                this.showOnlyPrivacyPopup();
            }, 100);
            return;
        }
        console.log(TAG, "showOnlyPrivacyPopup");
        let scene: cc.Scene = cc.director.getScene();
        // 隐私协议主节点
        this.nodePrivacyAgreement = new cc.Node("nodePrivacyAgreement");
        scene.addChild(this.nodePrivacyAgreement);
        this.nodePrivacyAgreement.x = this.sceneWidth * 0.5;
        this.nodePrivacyAgreement.y = this.sceneHeight * 0.5;
        this.nodePrivacyAgreement.scale = this.isStand ?
            cc.view.getDesignResolutionSize().width / 1080 : cc.view.getDesignResolutionSize().height / 1080;
        this.setGroup(this.nodePrivacyAgreement);
        this.nodePrivacyAgreement.zIndex = cc.macro.MAX_ZINDEX;
        // 黑色背景
        let black: cc.Node = new cc.Node("black");
        this.nodePrivacyAgreement.addChild(black);
        black.addComponent(cc.Sprite);
        black.getComponent(cc.Sprite).spriteFrame = this.privacyRes["black"];
        black.width = this.sceneWidth * 2;
        black.height = this.sceneHeight * 2;
        black.opacity = 150;
        black.addComponent(cc.BlockInputEvents);
        // 主窗口
        let bg: cc.Node = new cc.Node("bg");
        this.nodePrivacyAgreement.addChild(bg);
        bg.addComponent(cc.Sprite);
        bg.getComponent(cc.Sprite).spriteFrame = this.privacyRes["bg"];
        bg.width = 800;
        bg.height = 500;
        // 隐私协议按钮
        let btn: cc.Node = new cc.Node("btn");
        bg.addChild(btn);
        btn.addComponent(cc.Sprite);
        btn.getComponent(cc.Sprite).spriteFrame = this.privacyRes["btn"];
        btn.width = 308;
        btn.height = 40;
        btn.addComponent(cc.Widget);
        btn.getComponent(cc.Widget).isAlignRight = true;
        btn.getComponent(cc.Widget).right = 150;
        btn.getComponent(cc.Widget).isAlignBottom = true;
        btn.getComponent(cc.Widget).bottom = 143;
        // 同意按钮
        let agree: cc.Node = new cc.Node("agree");
        bg.addChild(agree);
        agree.addComponent(cc.Sprite);
        agree.getComponent(cc.Sprite).spriteFrame = this.privacyRes["agree"];
        agree.width = 250;
        agree.height = 92;
        agree.addComponent(cc.Widget);
        agree.getComponent(cc.Widget).isAlignRight = true;
        agree.getComponent(cc.Widget).right = 80;
        agree.getComponent(cc.Widget).isAlignBottom = true;
        agree.getComponent(cc.Widget).bottom = 25;
        // 拒绝按钮
        let refuse: cc.Node = new cc.Node("refuse");
        bg.addChild(refuse);
        refuse.addComponent(cc.Sprite);
        refuse.getComponent(cc.Sprite).spriteFrame = this.privacyRes["refuse"];
        refuse.width = 250;
        refuse.height = 92;
        refuse.addComponent(cc.Widget);
        refuse.getComponent(cc.Widget).isAlignLeft = true;
        refuse.getComponent(cc.Widget).left = 80;
        refuse.getComponent(cc.Widget).isAlignBottom = true;
        refuse.getComponent(cc.Widget).bottom = 25;
        // 监听用户点击隐私协议
        btn.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "点击隐私协议");
            this.openPrivacyAgreement();
        })
        // 监听用户点击同意
        agree.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "同意隐私协议");
            if (this.isCanTrigVd()) {
                XSdk.getInstance().showVideo({}, (p, c) => { });
            }
            this.destroyNode();
            LocalStorage.setStringData("agreePrivacy", "1");
            this.agreeCallback && this.agreeCallback("agreePrivacy", {});
        })
        // 监听用户点击拒绝
        refuse.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "拒绝隐私协议");
            if (this.isCanTrigVd()) {
                XSdk.getInstance().showVideo({}, (p, c) => { });
            } else {
                this.destroyNode();
                this.exitGame();
                this.agreeCallback && this.agreeCallback("refusePrivacy", {});
            }
        })
    }

    private isCanTrigVd(): boolean {
        let priClToVd = LocalStorage.getStringData("priClToVd");
        if (priClToVd == "1" && XSdk.getInstance().getVideoFlag()) {
            return true;
        }
        return false;
    }

    private showTwoAgreementPopup(): void {
        if (!this.loadSuccessRes || !this.loadSuccessRemoteRes) {
            this.nowRetryTimes++;
            if (this.nowRetryTimes >= this.maxRetryTimes) return;
            setTimeout(() => {
                this.showTwoAgreementPopup();
            }, 100);
            return;
        }
        console.log(TAG, "showTwoAgreementPopup");
        let scene: cc.Scene = cc.director.getScene();
        // 隐私协议主节点
        this.nodePrivacyAgreement = new cc.Node("nodePrivacyAgreement");
        scene.addChild(this.nodePrivacyAgreement);
        this.nodePrivacyAgreement.x = this.sceneWidth * 0.5;
        this.nodePrivacyAgreement.y = this.sceneHeight * 0.5;
        this.nodePrivacyAgreement.scale = this.isStand ?
            cc.view.getDesignResolutionSize().width / 1080 : cc.view.getDesignResolutionSize().height / 1080;
        this.setGroup(this.nodePrivacyAgreement);
        this.nodePrivacyAgreement.zIndex = cc.macro.MAX_ZINDEX;
        // 黑色背景
        let black: cc.Node = new cc.Node("black");
        this.nodePrivacyAgreement.addChild(black);
        black.addComponent(cc.Sprite);
        black.getComponent(cc.Sprite).spriteFrame = this.privacyRes["black"];
        black.width = this.sceneWidth * 2;
        black.height = this.sceneHeight * 2;
        black.opacity = 150;
        black.addComponent(cc.BlockInputEvents);
        // 主窗口
        let doubleBg: cc.Node = new cc.Node("doubleBg");
        this.nodePrivacyAgreement.addChild(doubleBg);
        doubleBg.addComponent(cc.Sprite);
        doubleBg.getComponent(cc.Sprite).spriteFrame = this.privacyRes["doubleBg"];
        doubleBg.width = 800;
        doubleBg.height = 500;
        // 隐私协议按钮
        let btn: cc.Node = new cc.Node("btn");
        doubleBg.addChild(btn);
        btn.addComponent(cc.Sprite);
        btn.getComponent(cc.Sprite).spriteFrame = this.privacyRes["btn"];
        btn.width = 308;
        btn.height = 40;
        btn.addComponent(cc.Widget);
        btn.getComponent(cc.Widget).isAlignRight = true;
        btn.getComponent(cc.Widget).right = 150;
        btn.getComponent(cc.Widget).isAlignBottom = true;
        btn.getComponent(cc.Widget).bottom = 190;
        // 隐私协议按钮
        let serviceBtn: cc.Node = new cc.Node("serviceBtn");
        doubleBg.addChild(serviceBtn);
        serviceBtn.addComponent(cc.Sprite);
        serviceBtn.getComponent(cc.Sprite).spriteFrame = this.privacyRes["serviceBtn"];
        serviceBtn.width = 308;
        serviceBtn.height = 40;
        serviceBtn.addComponent(cc.Widget);
        serviceBtn.getComponent(cc.Widget).isAlignRight = true;
        serviceBtn.getComponent(cc.Widget).right = 150;
        serviceBtn.getComponent(cc.Widget).isAlignBottom = true;
        serviceBtn.getComponent(cc.Widget).bottom = 135;
        // 同意按钮
        let agree: cc.Node = new cc.Node("agree");
        doubleBg.addChild(agree);
        agree.addComponent(cc.Sprite);
        agree.getComponent(cc.Sprite).spriteFrame = this.privacyRes["agree"];
        agree.width = 250;
        agree.height = 92;
        agree.addComponent(cc.Widget);
        agree.getComponent(cc.Widget).isAlignRight = true;
        agree.getComponent(cc.Widget).right = 80;
        agree.getComponent(cc.Widget).isAlignBottom = true;
        agree.getComponent(cc.Widget).bottom = 25;
        // 拒绝按钮
        let refuse: cc.Node = new cc.Node("refuse");
        doubleBg.addChild(refuse);
        refuse.addComponent(cc.Sprite);
        refuse.getComponent(cc.Sprite).spriteFrame = this.privacyRes["refuse"];
        refuse.width = 250;
        refuse.height = 92;
        refuse.addComponent(cc.Widget);
        refuse.getComponent(cc.Widget).isAlignLeft = true;
        refuse.getComponent(cc.Widget).left = 80;
        refuse.getComponent(cc.Widget).isAlignBottom = true;
        refuse.getComponent(cc.Widget).bottom = 25;
        // 监听用户点击隐私协议
        btn.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "点击隐私协议");
            this.openPrivacyAgreement();
        });
        // 监听用户点击服务协议
        serviceBtn.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "点击用户服务协议");
            this.openUserAgreement();
        });
        // 监听用户点击同意
        agree.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "同意隐私协议");
            this.destroyNode();
            LocalStorage.setStringData("agreePrivacy", "1");
            this.agreeCallback && this.agreeCallback("agreePrivacy", {});
        })
        // 监听用户点击拒绝
        refuse.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "拒绝隐私协议");
            this.destroyNode();
            this.exitGame();
            this.agreeCallback && this.agreeCallback("refusePrivacy", {});
        })
    }

    public openPrivacyAgreement(): void {
        let channelNameEn = LocalStorage.getStringData("channelNameEn");
        if (channelNameEn == "huawei") {
            let uri = "";
            // 根据公司获取隐私协议链接
            switch (this.company) {
                case "ob":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/oupo/base_yszc.html";
                    break;
                case "hks":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/haikesi/base_yszc.html";
                    break;
                case "ylly":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/yinli/base_yszc.html";
                    break;
                case "yx":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/yixin/base_yszc.html";
                    break;
                case "xmy":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/xingmengyou/base_yszc.html";
                    break;
                case "jc":
                    uri = "https://xgamesdk.xplaymobile.com/privacy/jichuan/base_yszc.html";
                    break;
                default:
                    break;
            }
            if (uri) {
                // @ts-ignore
                qg.openDeeplink({
                    uri: uri
                });
                return;
            }
        }

        if (!this.loadSuccessRes || !this.loadSuccessRemoteRes) {
            EngineUtils.showPopup("网络不佳，加载隐私协议失败");
            return;
        }
        this.sceneWidth = cc.winSize.width;
        this.sceneHeight = cc.winSize.height;
        console.log(TAG, "openPrivacyAgreement");
        // 已存在文本浏览页面
        if (cc.find("nodePrivacyAgreement/view")) {
            cc.find("nodePrivacyAgreement/view").active = true;
            return;
        }
        let scene: cc.Scene = cc.director.getScene();
        // 如果当前场景不存在nodePrivacyAgreement节点
        if (!cc.find("nodePrivacyAgreement")) {
            this.nodePrivacyAgreement = new cc.Node("nodePrivacyAgreement");
            scene.addChild(this.nodePrivacyAgreement);
            this.nodePrivacyAgreement.x = this.sceneWidth * 0.5;
            this.nodePrivacyAgreement.y = this.sceneHeight * 0.5;
            this.nodePrivacyAgreement.scale = this.isStand ?
                cc.view.getDesignResolutionSize().width / 1080 : cc.view.getDesignResolutionSize().height / 1080;
            this.setGroup(this.nodePrivacyAgreement);
            this.nodePrivacyAgreement.zIndex = cc.macro.MAX_ZINDEX;

            // 黑色背景
            let black: cc.Node = new cc.Node("black");
            this.nodePrivacyAgreement.addChild(black);
            black.addComponent(cc.Sprite);
            black.getComponent(cc.Sprite).spriteFrame = this.privacyRes["black"];
            black.width = this.sceneWidth * 2;
            black.height = this.sceneHeight * 2;
            black.addComponent(cc.BlockInputEvents);
            black.opacity = 150;
        }
        // 隐私协议展开页面视图节点
        let view: cc.Node = new cc.Node("view");
        this.nodePrivacyAgreement.addChild(view);
        // 文字背景
        let textBg: cc.Node = new cc.Node("textBg");
        view.addChild(textBg);
        textBg.addComponent(cc.Sprite);
        textBg.getComponent(cc.Sprite).spriteFrame = this.privacyRes["textBg"];
        if (this.isStand) {
            textBg.width = 800;
            textBg.height = 1200;
        } else {
            textBg.width = 700;
            textBg.height = 700;
        }
        textBg.addComponent(cc.ScrollView);
        textBg.getComponent(cc.ScrollView).vertical = true;
        textBg.getComponent(cc.ScrollView).horizontal = false;
        textBg.getComponent(cc.ScrollView).inertia = false;
        textBg.getComponent(cc.ScrollView).elastic = false;
        textBg.getComponent(cc.ScrollView).cancelInnerEvents = true;
        // 滚动视图
        let scrollView: cc.Node = new cc.Node("scrollView");
        textBg.addChild(scrollView);
        scrollView.addComponent(cc.Mask);
        scrollView.getComponent(cc.Mask).type = cc.Mask.Type.RECT;
        if (this.isStand) {
            scrollView.width = 700;
            scrollView.height = 900;
            scrollView.y = 60;
        } else {
            scrollView.width = 650;
            scrollView.height = 600;
        }
        // 文字边框
        let border: cc.Node = new cc.Node("border");
        scrollView.addChild(border);
        border.addComponent(cc.Sprite);
        border.getComponent(cc.Sprite).spriteFrame = this.privacyRes["border"];
        if (this.isStand) {
            border.width = 700;
            border.height = 900;
        } else {
            border.width = 650;
            border.height = 600;
        }
        // 可移动区域
        let move: cc.Node = new cc.Node("move");
        border.addChild(move);
        if (this.isStand) {
            move.width = 700;
            move.height = 1426;
            move.y = -260;
        } else {
            move.width = 650;
            move.height = 1426;
            move.y = -400;
        }

        // 文字内容
        let text: cc.Node = new cc.Node("text");
        move.addChild(text);
        text.addComponent(cc.Sprite);
        text.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.remoteRes[0]);
        if (this.isStand) {
            text.width = 700;
            text.height = 1426;
        } else {
            text.width = 650;
            text.height = 1426;
        }

        // 绑定移动节点
        textBg.getComponent(cc.ScrollView).content = move;

        // 标题
        let title: cc.Node = new cc.Node("title");
        textBg.addChild(title);
        title.addComponent(cc.Sprite);
        title.getComponent(cc.Sprite).spriteFrame = this.privacyRes["title"];
        title.width = 350;
        title.height = 100;
        if (this.isStand) {
            title.y = 600;
        } else {
            title.y = 360;
        }

        // 确定
        let sure: cc.Node = new cc.Node("sure");
        textBg.addChild(sure);
        sure.addComponent(cc.Sprite);
        sure.getComponent(cc.Sprite).spriteFrame = this.privacyRes["sure"];
        sure.width = 300;
        sure.height = 100;
        if (this.isStand) {
            sure.y = -490;
        } else {
            sure.y = -360;
        }

        // 监听用户点击确定
        sure.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "点击确定");
            this.hidePrivacyAgreement();
        })
    }

    private hidePrivacyAgreement(): void {
        console.log(TAG, "hidePrivacyAgreement");
        let nodeBg: cc.Node = this.onlyPrivacy ?
            cc.find("nodePrivacyAgreement/bg") : cc.find("nodePrivacyAgreement/doubleBg");
        let nodeServiceView: cc.Node = cc.find("nodePrivacyAgreement/view");
        if (nodeBg) {
            if (nodeServiceView) nodeServiceView.active = false;
        } else {
            this.destroyNode();
        }
    }

    private hideServiceAgreement(): void {
        console.log(TAG, "hideServiceAgreement");
        let nodeBg: cc.Node = this.onlyPrivacy ?
            cc.find("nodePrivacyAgreement/bg") : cc.find("nodePrivacyAgreement/doubleBg");
        let nodeServiceView: cc.Node = cc.find("nodePrivacyAgreement/serviceView");
        console.log(TAG, "nodeBg:" + nodeBg + " activeServiceView:" + nodeServiceView);
        if (nodeBg) {
            if (nodeServiceView) nodeServiceView.active = false;
        } else {
            this.destroyNode();
        }
    }

    public openUserAgreement(): void {
        if (!this.loadSuccessRes || !this.loadSuccessRemoteRes) {
            EngineUtils.showPopup("网络不佳，加载用户协议失败");
            return;
        }
        this.sceneWidth = cc.winSize.width;
        this.sceneHeight = cc.winSize.height;
        console.log(TAG, "openUserAgreement");
        if (cc.find("nodePrivacyAgreement/serviceView")) {
            cc.find("nodePrivacyAgreement/serviceView").active = true;
            return;
        }

        let scene: cc.Scene = cc.director.getScene();

        if (!cc.find("nodePrivacyAgreement")) {
            this.nodePrivacyAgreement = new cc.Node("nodePrivacyAgreement");
            scene.addChild(this.nodePrivacyAgreement);
            this.nodePrivacyAgreement.x = this.sceneWidth * 0.5;
            this.nodePrivacyAgreement.y = this.sceneHeight * 0.5;
            this.nodePrivacyAgreement.scale = this.isStand ?
                cc.view.getDesignResolutionSize().width / 1080 : cc.view.getDesignResolutionSize().height / 1080;
            this.setGroup(this.nodePrivacyAgreement);
            this.nodePrivacyAgreement.zIndex = cc.macro.MAX_ZINDEX;

            // 黑色背景
            let black: cc.Node = new cc.Node("black");
            this.nodePrivacyAgreement.addChild(black);
            black.addComponent(cc.Sprite);
            black.getComponent(cc.Sprite).spriteFrame = this.privacyRes["black"];
            black.width = this.sceneWidth * 2;
            black.height = this.sceneHeight * 2;
            black.addComponent(cc.BlockInputEvents);
            black.opacity = 150;
        }
        // 隐私协议展开页面视图节点
        let serviceView = new cc.Node("serviceView");
        this.nodePrivacyAgreement.addChild(serviceView);
        // 文字背景
        let textBg: cc.Node = new cc.Node("textBg");
        serviceView.addChild(textBg);
        textBg.addComponent(cc.Sprite);
        textBg.getComponent(cc.Sprite).spriteFrame = this.privacyRes["textBg"];
        textBg.addComponent(cc.ScrollView);
        textBg.getComponent(cc.ScrollView).vertical = true;
        textBg.getComponent(cc.ScrollView).horizontal = false;
        textBg.getComponent(cc.ScrollView).inertia = false;
        textBg.getComponent(cc.ScrollView).elastic = false;
        textBg.getComponent(cc.ScrollView).cancelInnerEvents = true;
        if (this.isStand) {
            textBg.width = 800;
            textBg.height = 1200;
        } else {
            textBg.width = 700;
            textBg.height = 700;
        }
        // 滚动视图
        let scrollView: cc.Node = new cc.Node("scrollView");
        textBg.addChild(scrollView);
        scrollView.addComponent(cc.Mask);
        scrollView.getComponent(cc.Mask).type = cc.Mask.Type.RECT;
        if (this.isStand) {
            scrollView.width = 700;
            scrollView.height = 900;
            scrollView.y = 60;
        } else {
            scrollView.width = 650;
            scrollView.height = 600;
        }
        // 文字边框
        let border: cc.Node = new cc.Node("border");
        scrollView.addChild(border);
        border.addComponent(cc.Sprite);
        border.getComponent(cc.Sprite).spriteFrame = this.privacyRes["border"];

        if (this.isStand) {
            border.width = 700;
            border.height = 900;
        } else {
            border.width = 650;
            border.height = 600;
        }
        // 可移动区域
        let move: cc.Node = new cc.Node("move");
        border.addChild(move);
        if (this.isStand) {
            move.width = 700;
            move.height = 2858;
            move.y = -1000;
        } else {
            move.width = 650;
            move.height = 2858;
            move.y = -1500;
        }
        // 文字内容
        let textService: cc.Node = new cc.Node("text");
        move.addChild(textService);
        textService.addComponent(cc.Sprite);

        textService.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.remoteRes[1]);
        if (this.isStand) {
            textService.width = 700;
            textService.height = 2858;
        } else {
            textService.width = 650;
            textService.height = 2858;
        }
        // 绑定移动节点
        textBg.getComponent(cc.ScrollView).content = move;
        // 标题
        let titleService: cc.Node = new cc.Node("titleService");
        textBg.addChild(titleService);
        titleService.addComponent(cc.Sprite);
        titleService.getComponent(cc.Sprite).spriteFrame = this.privacyRes["titleService"];
        titleService.width = 350;
        titleService.height = 100;
        if (this.isStand) {
            titleService.y = 600;
        } else {
            titleService.y = 360;
        }
        // 确定
        let sure: cc.Node = new cc.Node("sure");
        textBg.addChild(sure);
        sure.addComponent(cc.Sprite);
        sure.getComponent(cc.Sprite).spriteFrame = this.privacyRes["sure"];
        sure.width = 300;
        sure.height = 100;
        if (this.isStand) {
            sure.y = -490;
        } else {
            sure.y = -360;
        }
        // 监听用户点击确定
        sure.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(TAG, "点击确定");
            this.hideServiceAgreement();
        });
    }

    private destroyNode(): void {
        this.nodePrivacyAgreement && this.nodePrivacyAgreement.removeFromParent();
        this.nodePrivacyAgreement = null;
    }

    private exitGame(): void {
        switch (LocalStorage.getStringData("channelNameEn")) {
            case "oppo":
            case "huawei":
                // @ts-ignore
                qg.exitApplication({});
                break;
            case "vivo":
                // @ts-ignore
                qg.exitApplication();
                break;
            case "qq":
                // @ts-ignore
                qq.exitMiniProgram({});
                break;
            default:
                cc.game.end();
                break;
        }
    }

}