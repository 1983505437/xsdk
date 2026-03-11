import EngineUtils from "./EngineUtils";
import { TAG } from "./Enums";
import LocalStorage from "./LocalStorage";

export default class HuaweiNativeAdUtil {
    private static instance: HuaweiNativeAdUtil;
    /**
     * HuaweiNativeAdUtil 单例
     */
    public static getInstance(): HuaweiNativeAdUtil {
        if (!HuaweiNativeAdUtil.instance) {
            HuaweiNativeAdUtil.instance = new HuaweiNativeAdUtil();
        }
        return HuaweiNativeAdUtil.instance;
    }

    private platformVersionCode: number = 0;
    private isStand: boolean = false;
    private group: string = "";
    // 正在展示的原生广告id 0-原生banner 1-原生插屏 2-悬浮banner
    private nativeAdShowInfo: string[] = ["", "", ""];

    private nativeBannerNode: cc.Node;
    private nativeBannerLoadResSuccess: boolean = false;
    private nativeBannerRes: object = null;
    private nativeBannerReady2Show: boolean = false;

    private floatBannerNode: cc.Node;
    private floatBannerRes: object = null;

    private nativeIntersNode: cc.Node;
    private nativeIntersCloseNode: cc.Node;
    private nativeIntersLoadResSuccess: boolean = false;
    private nativeIntersRes: object = null;
    private nativeIntersImageTexture;
    private nativeIntersIconTexture;
    private nativeIntersHasDownload = false;
    private closeBtnCountDownInterval;

    // 是否是自然量
    private isNaturalFlow: boolean = false;
    // 是否打开归因开关
    private isAdAttribution: boolean = false;

    // 视频误点
    private switch_video_cl: boolean = false;
    private time_video_cl_st: number = 0;
    private time_video_cl_it: number = 0;
    private num_video_cl_r: number = 0;
    private achieveFirstVc: boolean = false;
    private time_last_vc: number = 0;

    // 进入游戏时的时间戳
    private time_into_game: number = 0;

    public loadNativeBannerUI(): void {
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        EngineUtils.loadNativeBannerAdAtlas((ret1: boolean, res: object) => {
            console.log(TAG, "native banner atlas res:", res);
            if (ret1) {
                this.nativeBannerLoadResSuccess = true;
                this.nativeBannerRes = res;
            }
        });
    }

    public loadFloatBannerUI(): void {
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        EngineUtils.loadNativeBannerAdAtlas((ret1: boolean, res: object) => {
            console.log(TAG, "float banner atlas res:", res);
            if (ret1) {
                this.floatBannerRes = res;
            }
        });
    }

    public setNativeBannerReady2Show(nativeBannerReady2Show): void {
        this.nativeBannerReady2Show = nativeBannerReady2Show;
    }

    public getNativeBannerLoadResSuccess(): boolean {
        return this.nativeBannerLoadResSuccess;
    }

    public loadAndShowNativeBanner(nativeBannerAd, adInfo, closeCallback): void {
        if (!this.nativeBannerReady2Show) return;
        let imgUrlList = adInfo.imgUrlList;
        let img;
        let imgFormat = "png";
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
            if (img.indexOf(".jpg") != -1) {
                imgFormat = "jpg";
            }
        }
        let icon = adInfo.icon;
        let iconFormat = "png";
        if (icon) {
            if (icon.indexOf(".jpg") != -1) {
                iconFormat = "jpg";
            }
        }

        if (img) {
            EngineUtils.loadResArray([img], (ret: boolean, res: object) => {
                if (ret) {
                    // image
                    this.showNativeBanner(nativeBannerAd, adInfo, res[0], closeCallback);
                }
            });
        } else if (icon) {
            EngineUtils.loadResArray([icon], (ret: boolean, res: object) => {
                if (ret) {
                    // icon
                    this.showNativeBanner(nativeBannerAd, adInfo, res[0], closeCallback);
                }
            });
        }
    }

    public showNativeBanner(nativeBannerAd, adInfo, texture, closeCallback): void {
        if (!this.nativeBannerReady2Show) return;
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        let adId = adInfo.adId;
        this.nativeAdShowInfo[0] = adId;
        let imgUrlList = adInfo.imgUrlList;
        let img;
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
        }
        let icon = adInfo.icon;
        let title = adInfo.title;
        let source = adInfo.source;
        let clickBtnTxt = adInfo.clickBtnTxt;

        nativeBannerAd.reportAdShow({ adId: adId });

        this.nativeBannerNode = new cc.Node("nativeBannerNode");
        cc.director.getScene().addChild(this.nativeBannerNode);
        this.nativeBannerNode.addComponent(cc.Widget);
        this.nativeBannerNode.getComponent(cc.Widget).isAlignHorizontalCenter = true;
        this.nativeBannerNode.getComponent(cc.Widget).isAlignBottom = true;
        this.nativeBannerNode.getComponent(cc.Widget).bottom = 0;
        if (this.isStand) {
            this.nativeBannerNode.width = cc.winSize.width;
        } else {
            this.nativeBannerNode.width = cc.winSize.width * 0.5;
        }
        this.nativeBannerNode.height = this.nativeBannerNode.width * 0.18;
        this.group = LocalStorage.getStringData("group");
        if (this.group) {
            this.nativeBannerNode.group = this.group;
        }
        this.nativeBannerNode.zIndex = 28000;

        // 背景
        let nativeBannerBgNode = new cc.Node("nativeBannerBgNode");
        this.nativeBannerNode.addChild(nativeBannerBgNode);
        nativeBannerBgNode.addComponent(cc.Sprite);
        nativeBannerBgNode.getComponent(cc.Sprite).spriteFrame = this.nativeBannerRes["native_banner_bg"];
        nativeBannerBgNode.width = this.nativeBannerNode.width;
        nativeBannerBgNode.height = this.nativeBannerNode.height;
        nativeBannerBgNode.x = 0;
        nativeBannerBgNode.y = 0;
        nativeBannerBgNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "点击并关闭原生banner广告");
            nativeBannerAd.reportAdClick({ adId: adId });
            this.hideNativeBanner();
            if (closeCallback) closeCallback(true);
        });

        // 广告图
        let imageNode: cc.Node;
        imageNode = new cc.Node("imageNode");
        this.nativeBannerNode.addChild(imageNode);
        imageNode.addComponent(cc.Sprite);
        imageNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture);
        if (img) {
            // 大图
            imageNode.height = this.nativeBannerNode.height;
            imageNode.width = imageNode.height * 2;
            imageNode.x = imageNode.width * 0.5 - this.nativeBannerNode.width * 0.5;
            imageNode.y = 0;
        } else if (icon) {
            // icon
            imageNode.height = this.nativeBannerNode.height;
            imageNode.width = imageNode.height;
            imageNode.x = imageNode.width * 0.5 - this.nativeBannerNode.width * 0.5;
            imageNode.y = 0;
        }

        // 广告tip
        let adTipNode = new cc.Node("adTipNode");
        this.nativeBannerNode.addChild(adTipNode);
        adTipNode.addComponent(cc.Sprite);
        adTipNode.getComponent(cc.Sprite).spriteFrame = this.nativeBannerRes["ad_logo"];
        adTipNode.height = 0.2 * this.nativeBannerNode.height;
        adTipNode.width = adTipNode.height / 0.45;
        adTipNode.x = adTipNode.width * 0.5 - this.nativeBannerNode.width * 0.5;
        adTipNode.y = this.nativeBannerNode.height * 0.5 - adTipNode.height * 0.5;

        // 标题
        let titleNode = new cc.Node("titleNode");
        this.nativeBannerNode.addChild(titleNode);
        titleNode.addComponent(cc.Label);
        if (this.isStand) {
            titleNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            titleNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        titleNode.getComponent(cc.Label).string = title;
        titleNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        titleNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        titleNode.getComponent(cc.Label).lineHeight = titleNode.getComponent(cc.Label).fontSize;
        titleNode.color = cc.color(0xFF, 0x00, 0x00);
        titleNode.width = this.nativeBannerNode.width * 0.3;
        titleNode.height = this.nativeBannerNode.height * 0.5;
        titleNode.x = titleNode.width * 0.6 + imageNode.width - this.nativeBannerNode.width * 0.5;
        titleNode.y = this.nativeBannerNode.height * 0.5 - titleNode.height * 0.52;

        // 来源
        let sourceNode = new cc.Node("sourceNode");
        this.nativeBannerNode.addChild(sourceNode);
        sourceNode.addComponent(cc.Label);
        if (this.isStand) {
            sourceNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            sourceNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        sourceNode.getComponent(cc.Label).string = source;
        sourceNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        sourceNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        sourceNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        sourceNode.getComponent(cc.Label).lineHeight = sourceNode.getComponent(cc.Label).fontSize;
        sourceNode.color = cc.color(0x00, 0x00, 0xFF);
        sourceNode.width = this.nativeBannerNode.width * 0.3;
        sourceNode.height = this.nativeBannerNode.height * 0.5;
        sourceNode.x = sourceNode.width * 0.6 + imageNode.width - this.nativeBannerNode.width * 0.5;
        sourceNode.y = -sourceNode.height * 0.52;

        // 点击按钮
        let buttonNode = new cc.Node("buttonNode");
        this.nativeBannerNode.addChild(buttonNode);
        buttonNode.addComponent(cc.Sprite);
        buttonNode.getComponent(cc.Sprite).spriteFrame = this.nativeBannerRes["native_banner_btn"];
        buttonNode.width = this.nativeBannerNode.width * 0.2;
        buttonNode.height = buttonNode.width * 0.35;
        buttonNode.x = this.nativeBannerNode.width * 0.5 - buttonNode.width * 0.7;
        buttonNode.y = 0;

        // 点击按钮文字
        let buttonTextNode = new cc.Node("buttonTextNode");
        buttonNode.addChild(buttonTextNode);
        buttonTextNode.addComponent(cc.Label);
        buttonTextNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        if (this.isStand) {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        buttonTextNode.getComponent(cc.Label).string = clickBtnTxt;
        buttonTextNode.width = buttonNode.width;
        buttonTextNode.height = buttonNode.height;
        buttonTextNode.x = 0;
        buttonTextNode.y = -buttonTextNode.height * 0.1;

        // 关闭按钮
        let closeNode = new cc.Node("closeNode");
        this.nativeBannerNode.addChild(closeNode);
        closeNode.addComponent(cc.Sprite);
        closeNode.getComponent(cc.Sprite).spriteFrame = this.nativeBannerRes["native_banner_close"];
        closeNode.width = this.nativeBannerNode.height * 0.25;
        closeNode.height = closeNode.width;
        closeNode.x = this.nativeBannerNode.width * 0.5 - closeNode.width * 0.6;
        closeNode.y = this.nativeBannerNode.height * 0.5 - closeNode.height * 0.6;
        // 防止事件冒泡
        closeNode.addComponent(cc.BlockInputEvents);
        closeNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "关闭原生banner广告");
            this.hideNativeBanner();
            if (closeCallback) closeCallback(false);
        });
    }

    public hideNativeBanner(): void {
        if (this.nativeBannerNode) {
            console.log(TAG, "hideNativeBanner");
            this.nativeAdShowInfo[0] = "";
            this.nativeBannerNode.removeFromParent();
            this.nativeBannerNode = null;
        }
    }

    public loadAndShowFloatBanner(floatBannerAd, adInfo, closeCallback): void {
        let imgUrlList = adInfo.imgUrlList;
        let img;
        let imgFormat = "png";
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
            if (img.indexOf(".jpg") != -1) {
                imgFormat = "jpg";
            }
        }
        let icon = adInfo.icon;
        let iconFormat = "png";
        if (icon) {
            if (icon.indexOf(".jpg") != -1) {
                iconFormat = "jpg";
            }
        }

        if (img) {
            EngineUtils.loadResArray([img], (ret: boolean, res: object) => {
                if (ret) {
                    // image
                    this.showFloatBanner(floatBannerAd, adInfo, res[0], closeCallback);
                }
            });
        } else if (icon) {
            EngineUtils.loadResArray([icon], (ret: boolean, res: object) => {
                if (ret) {
                    // icon
                    this.showFloatBanner(floatBannerAd, adInfo, res[0], closeCallback);
                }
            });
        }
    }

    public showFloatBanner(floatBannerAd, adInfo, texture, closeCallback): void {
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        let adId = adInfo.adId;
        this.nativeAdShowInfo[2] = adId;
        let imgUrlList = adInfo.imgUrlList;
        let img;
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
        }
        let icon = adInfo.icon;
        let title = adInfo.title;
        let source = adInfo.source;
        let clickBtnTxt = adInfo.clickBtnTxt;

        floatBannerAd.reportAdShow({ adId: adId });

        this.floatBannerNode = new cc.Node("floatBannerNode");
        cc.director.getScene().addChild(this.floatBannerNode);
        this.floatBannerNode.addComponent(cc.Widget);
        this.floatBannerNode.getComponent(cc.Widget).isAlignHorizontalCenter = true;
        this.floatBannerNode.getComponent(cc.Widget).isAlignTop = true;
        this.floatBannerNode.getComponent(cc.Widget).top = 0;
        this.floatBannerNode.opacity = 75;
        if (this.isStand) {
            this.floatBannerNode.width = cc.winSize.width * 0.7;
        } else {
            this.floatBannerNode.width = cc.winSize.width * 0.35;
        }
        this.floatBannerNode.height = this.floatBannerNode.width * 0.18;
        this.group = LocalStorage.getStringData("group");
        if (this.group) {
            this.floatBannerNode.group = this.group;
        }
        this.floatBannerNode.zIndex = 28000;

        // 背景
        let floatBannerBgNode = new cc.Node("floatBannerBgNode");
        this.floatBannerNode.addChild(floatBannerBgNode);
        floatBannerBgNode.addComponent(cc.Sprite);
        floatBannerBgNode.getComponent(cc.Sprite).spriteFrame = this.floatBannerRes["native_banner_bg"];
        floatBannerBgNode.width = this.floatBannerNode.width;
        floatBannerBgNode.height = this.floatBannerNode.height;
        floatBannerBgNode.x = 0;
        floatBannerBgNode.y = 0;
        floatBannerBgNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "点击并关闭原生悬浮banner广告");
            floatBannerAd.reportAdClick({ adId: adId });
            this.hideFloatBanner();
            if (closeCallback) closeCallback(true);
        });

        // 广告图
        let imageNode: cc.Node;
        imageNode = new cc.Node("imageNode");
        this.floatBannerNode.addChild(imageNode);
        imageNode.addComponent(cc.Sprite);
        imageNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture);
        if (img) {
            // 大图
            imageNode.height = this.floatBannerNode.height;
            imageNode.width = imageNode.height * 2;
            imageNode.x = imageNode.width * 0.5 - this.floatBannerNode.width * 0.5;
            imageNode.y = 0;
        } else if (icon) {
            // icon
            imageNode.height = this.floatBannerNode.height;
            imageNode.width = imageNode.height;
            imageNode.x = imageNode.width * 0.5 - this.floatBannerNode.width * 0.5;
            imageNode.y = 0;
        }

        // 广告tip
        let adTipNode = new cc.Node("adTipNode");
        this.floatBannerNode.addChild(adTipNode);
        adTipNode.addComponent(cc.Sprite);
        adTipNode.getComponent(cc.Sprite).spriteFrame = this.floatBannerRes["ad_logo"];
        adTipNode.height = 0.2 * this.floatBannerNode.height;
        adTipNode.width = adTipNode.height / 0.45;
        adTipNode.x = adTipNode.width * 0.5 - this.floatBannerNode.width * 0.5;
        adTipNode.y = this.floatBannerNode.height * 0.5 - adTipNode.height * 0.5;

        // 标题
        let titleNode = new cc.Node("titleNode");
        this.floatBannerNode.addChild(titleNode);
        titleNode.addComponent(cc.Label);
        if (this.isStand) {
            titleNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            titleNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        titleNode.getComponent(cc.Label).string = title;
        titleNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        titleNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        titleNode.getComponent(cc.Label).lineHeight = titleNode.getComponent(cc.Label).fontSize;
        titleNode.color = cc.color(0xFF, 0x00, 0x00);
        titleNode.width = this.floatBannerNode.width * 0.3;
        titleNode.height = this.floatBannerNode.height * 0.5;
        titleNode.x = titleNode.width * 0.6 + imageNode.width - this.floatBannerNode.width * 0.5;
        titleNode.y = this.floatBannerNode.height * 0.5 - titleNode.height * 0.52;

        // 来源
        let sourceNode = new cc.Node("sourceNode");
        this.floatBannerNode.addChild(sourceNode);
        sourceNode.addComponent(cc.Label);
        if (this.isStand) {
            sourceNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            sourceNode.getComponent(cc.Label).fontSize = 35 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        sourceNode.getComponent(cc.Label).string = source;
        sourceNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        sourceNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        sourceNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        sourceNode.getComponent(cc.Label).lineHeight = sourceNode.getComponent(cc.Label).fontSize;
        sourceNode.color = cc.color(0x00, 0x00, 0xFF);
        sourceNode.width = this.floatBannerNode.width * 0.3;
        sourceNode.height = this.floatBannerNode.height * 0.5;
        sourceNode.x = sourceNode.width * 0.6 + imageNode.width - this.floatBannerNode.width * 0.5;
        sourceNode.y = -sourceNode.height * 0.52;

        // 点击按钮
        let buttonNode = new cc.Node("buttonNode");
        this.floatBannerNode.addChild(buttonNode);
        buttonNode.addComponent(cc.Sprite);
        buttonNode.getComponent(cc.Sprite).spriteFrame = this.floatBannerRes["native_banner_btn"];
        buttonNode.width = this.floatBannerNode.width * 0.2;
        buttonNode.height = buttonNode.width * 0.35;
        buttonNode.x = this.floatBannerNode.width * 0.5 - buttonNode.width * 0.7;
        buttonNode.y = 0;

        // 点击按钮文字
        let buttonTextNode = new cc.Node("buttonTextNode");
        buttonNode.addChild(buttonTextNode);
        buttonTextNode.addComponent(cc.Label);
        buttonTextNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        if (this.isStand) {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        buttonTextNode.getComponent(cc.Label).string = clickBtnTxt;
        buttonTextNode.width = buttonNode.width;
        buttonTextNode.height = buttonNode.height;
        buttonTextNode.x = 0;
        buttonTextNode.y = -buttonTextNode.height * 0.1;

        // 关闭按钮
        let closeNode = new cc.Node("closeNode");
        this.floatBannerNode.addChild(closeNode);
        closeNode.addComponent(cc.Sprite);
        closeNode.getComponent(cc.Sprite).spriteFrame = this.floatBannerRes["native_banner_close"];
        closeNode.width = this.floatBannerNode.height * 0.25;
        closeNode.height = closeNode.width;
        closeNode.x = this.floatBannerNode.width * 0.5 - closeNode.width * 0.6;
        closeNode.y = this.floatBannerNode.height * 0.5 - closeNode.height * 0.6;
        // 防止事件冒泡
        closeNode.addComponent(cc.BlockInputEvents);
        closeNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "关闭悬浮banner广告");
            this.hideFloatBanner();
            if (closeCallback) closeCallback(false);
        });
    }

    public hideFloatBanner(): void {
        if (this.floatBannerNode) {
            console.log(TAG, "hideFloatBanner");
            this.nativeAdShowInfo[2] = "";
            this.floatBannerNode.removeFromParent();
            this.floatBannerNode = null;
        }
    }

    public loadNativeIntersUI(): void {
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        EngineUtils.loadNativeIntersAdAtlas((ret1: boolean, res: object) => {
            console.log(TAG, "native inters atlas res:", res);
            if (ret1) {
                this.nativeIntersLoadResSuccess = true;
                this.nativeIntersRes = res;
            }
        });
    }

    public getNativeIntersLoadResSuccess(): boolean {
        return this.nativeIntersLoadResSuccess;
    }

    public loadAndShowNativeInters(nativeIntersAd, adInfo, closeCallback): void {
        let imgUrlList = adInfo.imgUrlList;
        let img;
        let imgFormat = "png";
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
            if (img.indexOf(".jpg") != -1) {
                imgFormat = "jpg";
            }
        }
        let icon = adInfo.icon;
        let iconFormat = "png";
        if (icon) {
            if (icon.indexOf(".jpg") != -1) {
                iconFormat = "jpg";
            }
        }

        if (img && icon) {
            EngineUtils.loadResArray([img, icon], (ret: boolean, res: object) => {
                if (ret) {
                    this.nativeIntersImageTexture = res[0];
                    this.nativeIntersIconTexture = res[1];
                    // image
                    this.showNativeInters(nativeIntersAd, adInfo, closeCallback);
                }
            });
        } else if (icon) {
            EngineUtils.loadResArray([icon], (ret: boolean, res: object) => {
                if (ret) {
                    this.nativeIntersImageTexture = res[0];
                    this.nativeIntersIconTexture = res[0];
                    // image
                    this.showNativeInters(nativeIntersAd, adInfo, closeCallback);
                }
            });
        } else if (img) {
            EngineUtils.loadResArray([img], (ret: boolean, res: object) => {
                if (ret) {
                    this.nativeIntersImageTexture = res[0];
                    this.nativeIntersIconTexture = res[0];
                    // icon
                    this.showNativeInters(nativeIntersAd, adInfo, closeCallback);
                }
            });
        }
    }

    public showNativeInters(nativeIntersAd, adInfo, closeCallback): void {
        if (cc.winSize.width < cc.winSize.height) this.isStand = true;
        let adId = adInfo.adId;
        this.nativeAdShowInfo[1] = adId;
        let imgUrlList = adInfo.imgUrlList;
        let img;
        if (imgUrlList.length > 0) {
            img = imgUrlList[0];
        }
        let icon = adInfo.icon;
        let title = adInfo.title;
        let source = adInfo.source;
        let clickBtnTxt = adInfo.clickBtnTxt;
        this.nativeIntersHasDownload = false;
        let isTrig = this.getNativeIntersCLFlag();
        let appStatus = nativeIntersAd.getAppStatus({ adId: adId });
        console.log(TAG, "isTrig:" + isTrig + ";creativeType:" + adInfo.creativeType + ";appStatus:" + appStatus);
        if (isTrig && adInfo.creativeType > 100 && appStatus && (appStatus == "DOWNLOAD" || appStatus == "PAUSE")) {
            this.nativeIntersHasDownload = true;
        }

        nativeIntersAd.reportAdShow({ adId: adId });

        // 根节点
        this.nativeIntersNode = new cc.Node("nativeIntersNode");
        cc.director.getScene().addChild(this.nativeIntersNode);
        this.nativeIntersNode.addComponent(cc.Widget);
        this.nativeIntersNode.getComponent(cc.Widget).isAlignHorizontalCenter = true;
        this.nativeIntersNode.getComponent(cc.Widget).isAlignBottom = true;
        this.nativeIntersNode.getComponent(cc.Widget).bottom = 0;
        this.nativeIntersNode.width = cc.winSize.width;
        this.nativeIntersNode.height = cc.winSize.height;
        this.group = LocalStorage.getStringData("group");
        if (this.group) {
            this.nativeIntersNode.group = this.group;
        }
        this.nativeIntersNode.zIndex = 30000;

        // 透明背景(防止点到游戏场景)
        let nativeIntersMaskBg = new cc.Node("nativeIntersMaskBg");
        this.nativeIntersNode.addChild(nativeIntersMaskBg);
        nativeIntersMaskBg.width = cc.winSize.width;
        nativeIntersMaskBg.height = cc.winSize.height;
        nativeIntersMaskBg.x = 0;
        nativeIntersMaskBg.y = 0;
        // 防止事件冒泡
        nativeIntersMaskBg.addComponent(cc.BlockInputEvents);

        // 背景
        let nativeIntersBgNode = new cc.Node("nativeIntersBgNode");
        nativeIntersMaskBg.addChild(nativeIntersBgNode);
        nativeIntersBgNode.addComponent(cc.Sprite);
        nativeIntersBgNode.getComponent(cc.Sprite).spriteFrame = this.nativeIntersRes["native_inters_bg"];
        if (this.isStand) {
            nativeIntersBgNode.width = this.nativeIntersNode.width * 0.84;
            nativeIntersBgNode.height = nativeIntersBgNode.width * 1.05;
        } else {
            nativeIntersBgNode.height = this.nativeIntersNode.height * 0.9;
            nativeIntersBgNode.width = nativeIntersBgNode.height * 0.96;
        }
        nativeIntersBgNode.x = 0;
        nativeIntersBgNode.y = 0;
        nativeIntersBgNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "点击原生插屏广告");
            nativeIntersAd.reportAdClick({ adId: adId });
            if (!this.nativeIntersHasDownload) {
                this.hideNativeInters();
                if (closeCallback) closeCallback(true);
            }
        });

        // 广告图
        let imageNode: cc.Node;
        imageNode = new cc.Node("imageNode");
        nativeIntersBgNode.addChild(imageNode);
        imageNode.addComponent(cc.Sprite);
        imageNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.nativeIntersImageTexture);
        if (img) {
            // 大图
            imageNode.width = nativeIntersBgNode.width * 0.95;
            imageNode.height = imageNode.width * 0.58;
        } else if (icon) {
            // icon
            imageNode.height = nativeIntersBgNode.width * 0.95 * 0.58;
            imageNode.width = imageNode.height;
        }
        imageNode.x = 0;
        imageNode.y = nativeIntersBgNode.height * 0.5 - imageNode.height * 0.52;

        // icon背景图片
        let iconBgNode: cc.Node;
        iconBgNode = new cc.Node("iconBgNode");
        nativeIntersBgNode.addChild(iconBgNode);
        iconBgNode.addComponent(cc.Sprite);
        iconBgNode.getComponent(cc.Sprite).spriteFrame = this.nativeIntersRes["native_inters_icon"];
        iconBgNode.width = nativeIntersBgNode.width * 0.15;
        iconBgNode.height = iconBgNode.width;
        iconBgNode.x = iconBgNode.width * 0.7 - nativeIntersBgNode.width * 0.5;
        iconBgNode.y = iconBgNode.height * 0.5 + nativeIntersBgNode.height * 0.5 - imageNode.height - iconBgNode.height * 1.3;

        // icon图片
        let iconNode: cc.Node;
        iconNode = new cc.Node("iconNode");
        iconBgNode.addChild(iconNode);
        iconNode.addComponent(cc.Sprite);
        iconNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.nativeIntersIconTexture);
        iconNode.width = iconBgNode.width;
        iconNode.height = iconBgNode.height;
        iconNode.x = 0;
        iconNode.y = 0;

        // 广告tip
        let adTipNode = new cc.Node("adTipNode");
        nativeIntersBgNode.addChild(adTipNode);
        adTipNode.addComponent(cc.Sprite);
        adTipNode.getComponent(cc.Sprite).spriteFrame = this.nativeIntersRes["ad_logo"];
        adTipNode.width = nativeIntersBgNode.width * 0.16;
        adTipNode.height = adTipNode.width * 0.45;
        adTipNode.x = adTipNode.width * 0.6 - nativeIntersBgNode.width * 0.5;
        adTipNode.y = nativeIntersBgNode.height * 0.5 - adTipNode.height * 0.6;

        // 标题
        let titleNode = new cc.Node("titleNode");
        nativeIntersBgNode.addChild(titleNode);
        titleNode.addComponent(cc.Label);
        if (this.isStand) {
            titleNode.getComponent(cc.Label).fontSize = 55 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            titleNode.getComponent(cc.Label).fontSize = 55 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        titleNode.getComponent(cc.Label).string = title;
        titleNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        titleNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        titleNode.getComponent(cc.Label).lineHeight = titleNode.getComponent(cc.Label).fontSize;
        titleNode.color = cc.color(0xFF, 0x00, 0x00);
        titleNode.width = nativeIntersBgNode.width - iconBgNode.width * 1.5;
        titleNode.height = iconBgNode.height;
        titleNode.x = iconBgNode.x + iconBgNode.width * 0.8 + titleNode.width * 0.5;
        titleNode.y = iconBgNode.y;

        // 来源
        let sourceNode = new cc.Node("sourceNode");
        nativeIntersBgNode.addChild(sourceNode);
        sourceNode.addComponent(cc.Label);
        if (this.isStand) {
            sourceNode.getComponent(cc.Label).fontSize = 20 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            sourceNode.getComponent(cc.Label).fontSize = 20 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        sourceNode.getComponent(cc.Label).string = source;
        sourceNode.getComponent(cc.Label).overflow = cc.Label.Overflow.CLAMP;
        sourceNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        sourceNode.getComponent(cc.Label).verticalAlign = cc.Label.VerticalAlign.CENTER;
        sourceNode.getComponent(cc.Label).lineHeight = sourceNode.getComponent(cc.Label).fontSize;
        sourceNode.color = cc.color(0x00, 0x00, 0xFF);
        sourceNode.width = nativeIntersBgNode.width * 0.3;
        sourceNode.height = nativeIntersBgNode.height * 0.1;
        sourceNode.x = 0;
        sourceNode.y = sourceNode.height * 0.5 - nativeIntersBgNode.height * 0.5;

        // 点击按钮
        let buttonNode = new cc.Node("buttonNode");
        nativeIntersBgNode.addChild(buttonNode);
        buttonNode.addComponent(cc.Sprite);
        buttonNode.getComponent(cc.Sprite).spriteFrame = this.nativeIntersRes["native_inters_btn"];
        buttonNode.width = nativeIntersBgNode.width * 0.7;
        buttonNode.height = buttonNode.width * 0.27;
        buttonNode.x = 0;
        buttonNode.y = iconBgNode.y - iconBgNode.height * 0.5 - buttonNode.height * 0.6;

        // 点击按钮文字
        let buttonTextNode = new cc.Node("buttonTextNode");
        buttonNode.addChild(buttonTextNode);
        buttonTextNode.addComponent(cc.Label);
        buttonTextNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        if (this.isStand) {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().width / 1080);
        } else {
            buttonTextNode.getComponent(cc.Label).fontSize = 40 * (cc.view.getDesignResolutionSize().height / 1080);
        }
        buttonTextNode.getComponent(cc.Label).string = clickBtnTxt;
        buttonTextNode.width = buttonNode.width;
        buttonTextNode.height = buttonNode.height;
        buttonTextNode.x = 0;
        buttonTextNode.y = -buttonTextNode.height * 0.1;

        // 关闭按钮
        this.nativeIntersCloseNode = new cc.Node("closeNode");
        nativeIntersBgNode.addChild(this.nativeIntersCloseNode);
        this.nativeIntersCloseNode.addComponent(cc.Sprite);
        this.nativeIntersCloseNode.getComponent(cc.Sprite).spriteFrame = this.nativeIntersRes["native_inters_close"];
        this.nativeIntersCloseNode.width = nativeIntersBgNode.width * 0.055;
        this.nativeIntersCloseNode.height = this.nativeIntersCloseNode.width;
        this.nativeIntersCloseNode.x = nativeIntersBgNode.width * 0.5 - this.nativeIntersCloseNode.width * 0.7;
        this.nativeIntersCloseNode.y = nativeIntersBgNode.height * 0.5 - this.nativeIntersCloseNode.height * 0.7;
        // 防止事件冒泡
        this.nativeIntersCloseNode.addComponent(cc.BlockInputEvents);
        this.nativeIntersCloseNode.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(TAG, "关闭原生插屏广告");
            this.hideNativeInters();
            if (closeCallback) closeCallback(false);
        });

        let downloadLeft = 0;
        let downloadTop = 0;
        let scaleNum = 1;
        // @ts-ignore
        let info = qg.getSystemInfoSync();
        let pixelRatio = info.pixelRatio;
        let screenWidth = info.screenWidth * pixelRatio;
        let screenHeight = info.screenHeight * pixelRatio;
        if (this.isStand) {
            scaleNum = 1080 / cc.view.getDesignResolutionSize().width;
            downloadLeft = screenWidth * 0.82;
            downloadTop = screenHeight * 0.3;
        } else {
            scaleNum = 1080 / cc.view.getDesignResolutionSize().height;
            downloadLeft = screenWidth * 0.65;
            downloadTop = screenHeight * 0.055;
        }

        if (this.nativeIntersHasDownload) {
            nativeIntersAd.showDownloadButton({
                adId: adId,
                style: {
                    left: downloadLeft,
                    top: downloadTop,
                    width: 200, // 下载按钮宽度
                    fixedWidth: true,
                    heightType: 'short',
                    textSize: 1,
                    cornerRadius: 50,
                    normalBackground: "#00000000",
                    pressedColor: "#00000000",
                    normalStroke: 0,
                    normalStrokeCorlor: "#00000000",
                    processingBackground: "#00000000",
                    processingColor: "#00000000",
                    processingStroke: 0,
                    processingStrokeCorlor: "#00000000",
                    installingBackground: "#00000000",
                    installingStroke: 0,
                    installingStrokeCorlor: "#00000000",
                },
                success: (code) => {
                    console.log(TAG, "showDownloadButton: success");
                    let downloadProgress = nativeIntersAd.getDownloadProgress({ adId: adId });
                    let appStatus = nativeIntersAd.getAppStatus({ adId: adId });
                    console.log(TAG, "downloadProgress:" + downloadProgress + ",appStatus:" + appStatus);
                    if (appStatus == "INSTALLED") {
                        this.hideDownloadButton(nativeIntersAd);
                        return
                    }
                    let progressInterval =
                        setInterval(() => {
                            let newDownloadProgress = nativeIntersAd.getDownloadProgress({ adId: adId });
                            let newAppStatus = nativeIntersAd.getAppStatus({ adId: adId });
                            console.log(TAG, "newDownloadProgress:" + newDownloadProgress + ",newAppStatus:" + newAppStatus);
                            if (newAppStatus != appStatus) {
                                this.hideDownloadButton(nativeIntersAd);
                                clearInterval(progressInterval);
                                return
                            }
                        }, 200);
                },
                fail: (data, code) => {
                    console.log(TAG, "showDownloadButton fail: " + data + "," + code);
                },
                complete: () => {
                    console.log(TAG, "showDownloadButton : complete");
                }
            });
        }
    }

    public setPlatformVersionCode(platformVersionCode): void {
        this.platformVersionCode = platformVersionCode;
    }

    private hideDownloadButton(nativeIntersAd): void {
        if (this.nativeAdShowInfo[1] == "") return;
        nativeIntersAd.hideDownloadButton({
            adId: this.nativeAdShowInfo[1]
        })
    }

    private hideNativeInters(): void {
        if (!this.nativeIntersNode) return;
        if (this.closeBtnCountDownInterval != -1) {
            clearInterval(this.closeBtnCountDownInterval);
            this.closeBtnCountDownInterval = -1;
        }
        this.nativeAdShowInfo[1] = "";
        this.nativeIntersNode.removeFromParent();
        this.nativeIntersNode = null;
    }

    // 设为自然量
    public serNaturalFlow(): void {
        this.isNaturalFlow = true;
    }

    // 设置特殊配置开关打开
    public setAdAttribution(): void {
        this.isAdAttribution = true;
    }

    public setNativeIntersCl(params): void {
        this.switch_video_cl = true;
        this.time_video_cl_st = params["st"] ?
            (params["st"] <= 0 ?
                0 : params["st"]) : 0;
        this.time_video_cl_it = params["it"] ?
            (params["it"] <= 0 ?
                1 : params["it"]) : 1;
        this.num_video_cl_r = params["r"] ?
            params["r"] : 0;
    }

    public setIntoGameTimestamp(): void {
        this.time_into_game = new Date().getTime();
    }

    private judgeUsEb(): boolean {
        if (!this.switch_video_cl) return false;
        // let v_cl = LocalStorage.getStringData("v_cl");
        // // 第一次初始化
        // if (!v_cl) {
        //     let random: number = Math.floor(Math.random() * 100);
        //     if (random < this.num_video_cl_r) {
        //         LocalStorage.setStringData("v_cl", "1");
        //         return this.judgeLimit();
        //     } else {
        //         LocalStorage.setStringData("v_cl", "2");
        //         return false;
        //     }
        // } else if (v_cl == "1") {
        //     // 生效人群
        //     return this.judgeLimit();
        // } else {
        //     // 不生效人群
        //     return false;
        // }
        // 广告维度
        let random: number = Math.floor(Math.random() * 100);
        if (random < this.num_video_cl_r) {
            return this.judgeLimit();
        } else {
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
                console.log(TAG, "not reach start time");
                return false;
            } else {
                this.achieveFirstVc = true;
                return true;
            }
        }
        // 判断是否达到间隔时间
        if (now - this.time_last_vc < this.time_video_cl_it * 1000) {
            console.log(TAG, "not reach interval time");
            return false;
        }
        return true;
    }

    getNativeIntersCLFlag(): boolean {
        // 归因开关打开并且是自然量
        if (this.isAdAttribution && this.isNaturalFlow) {
            console.log(TAG, "natural");
            return false;
        }
        if (this.platformVersionCode < 1115) {
            console.log(TAG, "platformVersionCode < 1115");
            return false;
        }
        let flag = this.judgeUsEb();
        if (flag) {
            this.time_last_vc = new Date().getTime();
        }
        return flag;
    }

}