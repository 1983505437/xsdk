import XSdk from "../XSdk";
import EngineUtils from "./EngineUtils";
import { TAG } from "./Enums";
import LocalStorage from "./LocalStorage";

/*
 * @Author: Vae 
 * @Date: 2024-04-10 18:19:42 
 * @Last Modified by: Vae
 * @Last Modified time: 2024-04-16 14:55:47
 */
export default class RewardBox {
    private static instance: RewardBox;

    /**
     * RewardAd 单例
     */
    public static getInstance(): RewardBox {
        if (!RewardBox.instance) {
            RewardBox.instance = new RewardBox();
        }
        return RewardBox.instance;
    }

    private isStand: boolean = true;
    private sceneWidth: number = 0;
    private sceneHeight: number = 0;
    private loadSuccessRes: boolean = true;
    private isShow: boolean = false;
    private rewardRes: object;

    private nodeReward: cc.Node;
    private rewardHasShowVideo: boolean = false;
    private specialStyleAdapters: number = 0;

    private group: string;

    public initRewardBox(): void {
        this.sceneWidth = cc.winSize.width;
        this.sceneHeight = cc.winSize.height;
        this.isStand = this.sceneWidth < this.sceneHeight;
        this.group = LocalStorage.getStringData("group");
        EngineUtils.loadRewardAtlas((ret1: boolean, res: object) => {
            console.log(TAG, "reward atlas res:", res);
            if (ret1) {
                this.loadSuccessRes = ret1;
                this.rewardRes = res;
            }
        });
    }

    setSpecialStyleAdapters(specialStyleAdapters: number): void {
        this.specialStyleAdapters = specialStyleAdapters;
    }

    private setGroup(node: cc.Node): void {
        if (this.group) node.group = this.group;
    }

    public getRewardBoxFlag(): boolean {
        return this.loadSuccessRes && !this.isShow;
    }

    public showRewardBox(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.getRewardBoxFlag()) {
            return;
        }
        this.isShow = true;
        // 重置为默认
        this.rewardHasShowVideo = false;

        let scene = cc.director.getScene();
        this.nodeReward = new cc.Node("nodeReward");
        scene.addChild(this.nodeReward);
        this.nodeReward.x = this.sceneWidth * 0.5;
        this.nodeReward.y = this.sceneHeight * 0.5;
        this.nodeReward.zIndex = cc.macro.MAX_ZINDEX;
        this.setGroup(this.nodeReward);

        // 黑色背景
        let rewardBg: cc.Node = new cc.Node("rewardBg");
        this.nodeReward.addChild(rewardBg);
        rewardBg.addComponent(cc.Sprite);
        rewardBg.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBg"];
        rewardBg.width = this.sceneWidth * 2;
        rewardBg.height = this.sceneHeight * 2;
        rewardBg.addComponent(cc.BlockInputEvents);
        rewardBg.opacity = 200;

        // 神秘奖励字
        let rewardText = new cc.Node("rewardText");
        this.nodeReward.addChild(rewardText);
        rewardText.addComponent(cc.Sprite);
        rewardText.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardText"];
        rewardText.width = (this.isStand ? this.sceneWidth * 0.4 : this.sceneHeight * 0.5);
        rewardText.height = rewardText.width * (102 / 394);
        rewardText.y = (this.isStand ? this.sceneHeight * 0.3 : this.sceneHeight * 0.4);

        // 盒子背景
        let rewardBoxBg = new cc.Node("rewardBoxBg");
        this.nodeReward.addChild(rewardBoxBg);
        rewardBoxBg.addComponent(cc.Sprite);
        rewardBoxBg.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBoxBg"];
        rewardBoxBg.width = (this.isStand ? this.sceneWidth * 0.6 : this.sceneHeight * 0.6);
        rewardBoxBg.height = rewardBoxBg.width;
        rewardBoxBg.y = (this.isStand ? this.sceneWidth * 0.15 : this.sceneHeight * 0.1);

        // 盒子
        let rewardBox = new cc.Node("rewardBox");
        rewardBoxBg.addChild(rewardBox);
        rewardBox.addComponent(cc.Sprite);
        rewardBox.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBox"];
        rewardBox.width = rewardBoxBg.width * 0.7;
        rewardBox.height = rewardBox.width * (400 / 439);
        cc.tween(rewardBox)
            .repeatForever(
                cc.tween().sequence(
                    cc.tween()
                        .to(0.2, { scale: 1.1 }),
                    cc.tween()
                        .to(0.1, { angle: 30 }),
                    cc.tween()
                        .to(0.1, { angle: -25 }),
                    cc.tween()
                        .to(0.1, { angle: 20 }),
                    cc.tween()
                        .to(0.1, { angle: 0 }),
                    cc.tween()
                        .to(0.2, { scale: 1 / 1.1 }),
                    cc.tween()
                        .delay(2)
                )
            )
            .start();

        // 点击越快 奖励越丰厚文字
        let rewardText2 = new cc.Node("rewardText2");
        this.nodeReward.addChild(rewardText2);
        rewardText2.addComponent(cc.Label);
        rewardText2.getComponent(cc.Label).string = "点击越快 奖励越丰厚！！！";
        rewardText2.width = (this.isStand ? this.sceneWidth * 0.4 : this.sceneHeight * 0.5);
        rewardText2.height = rewardText2.width * (102 / 394);
        rewardText2.y = (this.isStand ? -this.sceneHeight * 0.2 : -this.sceneHeight * 0.3);

        // 点击按钮
        let rewardButton = new cc.Node("rewardButton");
        this.nodeReward.addChild(rewardButton);
        rewardButton.addComponent(cc.Sprite);
        rewardButton.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardButton"];
        rewardButton.width = (this.isStand ? this.sceneWidth * 0.75 : this.sceneHeight * 0.75);
        rewardButton.height = rewardButton.width * 0.38;
        rewardButton.y = rewardButton.height / 2 - this.sceneHeight / 2;
        if (!this.isStand) rewardButton.x = this.sceneWidth * 0.3;
        rewardButton.scale = 0.5;

        // 进度条
        let rewardProgress = new cc.Node("rewardProgress");
        this.nodeReward.addChild(rewardProgress);
        rewardProgress.addComponent(cc.ProgressBar);
        rewardProgress.addComponent(cc.Sprite);
        rewardProgress.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardProgress"];

        // 进度条bar
        let rewardBar = new cc.Node("rewardBar");
        rewardProgress.addChild(rewardBar);
        rewardBar.addComponent(cc.Sprite);
        rewardBar.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBar"];

        rewardProgress.getComponent(cc.ProgressBar).barSprite = rewardBar.getComponent(cc.Sprite);

        rewardProgress.width = (this.isStand ? this.sceneWidth * 0.75 : this.sceneHeight * 0.75);
        rewardProgress.height = rewardProgress.width * (43 / 727);
        rewardProgress.y = (this.isStand ? this.sceneHeight / 5 - this.sceneHeight / 2 : -this.sceneHeight / 5);
        rewardBar.width = rewardProgress.width * 0.97;
        rewardBar.height = rewardProgress.height * (25 / 43);
        rewardBar.x = -rewardBar.width / 2;

        rewardProgress.getComponent(cc.ProgressBar).totalLength = rewardBar.width;
        rewardProgress.getComponent(cc.ProgressBar).progress = 0;

        // 进度条缩减定时器
        let interval_barCutDown = -1;
        // 进度条的进度
        let pBar = rewardProgress.getComponent(cc.ProgressBar).progress;
        // 生成随机区间 40-70
        let pBarTarget: number = Math.floor(Math.random() * 30) + 40;
        console.log(TAG, "pBarTarget:" + pBarTarget);
        // 监听按钮点击
        rewardButton.on(cc.Node.EventType.TOUCH_START, (event) => {
            if (interval_barCutDown == -1) {
                interval_barCutDown = setInterval(() => {
                    if (pBar >= 0.005) {
                        pBar -= 0.005;
                        rewardProgress.getComponent(cc.ProgressBar).progress = pBar;
                    }
                }, 100)
            }
            pBar += 0.05;
            rewardProgress.getComponent(cc.ProgressBar).progress = pBar;

            // 进度达到pBarTarget/100以上 且未展示激励视频
            if (pBar >= pBarTarget / 100 && !this.rewardHasShowVideo) {
                this.rewardHasShowVideo = true;
                if (XSdk.getInstance().getVideoFlag()) {
                    XSdk.getInstance().showVideo({}, () => {
                        this.hideRewardBox();
                        callback("showRewardBoxFinish", {});
                    });
                } else {
                    this.hideRewardBox();
                    callback("showRewardBoxFinish", {});
                }
                if (interval_barCutDown != -1) clearInterval(interval_barCutDown);
            }
            if (pBar >= 1) {
                this.hideRewardBox();
                callback("showRewardBoxFinish", {});
            }
        });

        setTimeout(() => {
            if (XSdk.getInstance().getIntersFlag()) {
                XSdk.getInstance().showInters({}, () => { });
            }
        }, 2000);
    }

    private hideRewardBox(): void {
        this.isShow = false;
        this.rewardHasShowVideo = false;
        if (this.nodeReward) {
            this.nodeReward.removeFromParent();
            this.nodeReward = null;
        }
    }

    public showRewardBoxWithOp(params: object, callback: (phases: string, res: object) => void): void {
        if (!this.getRewardBoxFlag()) {
            return;
        }
        this.isShow = true;
        // 重置为默认
        this.rewardHasShowVideo = false;

        let scene = cc.director.getScene();
        this.nodeReward = new cc.Node("nodeReward");
        scene.addChild(this.nodeReward);
        this.nodeReward.x = this.sceneWidth * 0.5;
        this.nodeReward.y = this.sceneHeight * 0.5;
        this.nodeReward.zIndex = cc.macro.MAX_ZINDEX;
        this.setGroup(this.nodeReward);

        // 黑色背景
        let rewardBg: cc.Node = new cc.Node("rewardBg");
        this.nodeReward.addChild(rewardBg);
        rewardBg.addComponent(cc.Sprite);
        rewardBg.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBg"];
        rewardBg.width = this.sceneWidth * 2;
        rewardBg.height = this.sceneHeight * 2;
        rewardBg.addComponent(cc.BlockInputEvents);
        rewardBg.opacity = 200;

        // 神秘奖励字
        let rewardText = new cc.Node("rewardText");
        this.nodeReward.addChild(rewardText);
        rewardText.addComponent(cc.Sprite);
        rewardText.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardText"];
        rewardText.width = (this.isStand ? this.sceneWidth * 0.4 : this.sceneHeight * 0.5);
        rewardText.height = rewardText.width * (102 / 394);
        rewardText.y = (this.isStand ? this.sceneHeight * 0.3 : this.sceneHeight * 0.4);

        // 盒子背景
        let rewardBoxBg = new cc.Node("rewardBoxBg");
        this.nodeReward.addChild(rewardBoxBg);
        rewardBoxBg.addComponent(cc.Sprite);
        rewardBoxBg.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBoxBg"];
        rewardBoxBg.width = (this.isStand ? this.sceneWidth * 0.6 : this.sceneHeight * 0.6);
        rewardBoxBg.height = rewardBoxBg.width;
        rewardBoxBg.y = (this.isStand ? this.sceneWidth * 0.15 : this.sceneHeight * 0.1);

        // 盒子
        let rewardBox = new cc.Node("rewardBox");
        rewardBoxBg.addChild(rewardBox);
        rewardBox.addComponent(cc.Sprite);
        rewardBox.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBox"];
        rewardBox.width = rewardBoxBg.width * 0.7;
        rewardBox.height = rewardBox.width * (400 / 439);
        cc.tween(rewardBox)
            .repeatForever(
                cc.tween().sequence(
                    cc.tween()
                        .to(0.2, { scale: 1.1 }),
                    cc.tween()
                        .to(0.1, { angle: 30 }),
                    cc.tween()
                        .to(0.1, { angle: -25 }),
                    cc.tween()
                        .to(0.1, { angle: 20 }),
                    cc.tween()
                        .to(0.1, { angle: 0 }),
                    cc.tween()
                        .to(0.2, { scale: 1 / 1.1 }),
                    cc.tween()
                        .delay(2)
                )
            )
            .start();

        // 点击越快 奖励越丰厚文字
        let rewardText2 = new cc.Node("rewardText2");
        this.nodeReward.addChild(rewardText2);
        rewardText2.addComponent(cc.Label);
        rewardText2.getComponent(cc.Label).string = "点击越快 奖励越丰厚！！！";
        rewardText2.width = (this.isStand ? this.sceneWidth * 0.4 : this.sceneHeight * 0.5);
        rewardText2.height = rewardText2.width * (102 / 394);
        rewardText2.y = (this.isStand ? -this.sceneHeight * 0.2 : -this.sceneHeight * 0.3);

        // 进度条
        let rewardProgress = new cc.Node("rewardProgress");
        this.nodeReward.addChild(rewardProgress);
        rewardProgress.addComponent(cc.ProgressBar);
        rewardProgress.addComponent(cc.Sprite);
        rewardProgress.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardProgress"];

        // 进度条bar
        let rewardBar = new cc.Node("rewardBar");
        rewardProgress.addChild(rewardBar);
        rewardBar.addComponent(cc.Sprite);
        rewardBar.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardBar"];

        rewardProgress.getComponent(cc.ProgressBar).barSprite = rewardBar.getComponent(cc.Sprite);

        rewardProgress.width = (this.isStand ? this.sceneWidth * 0.75 : this.sceneHeight * 0.75);
        rewardProgress.height = rewardProgress.width * (43 / 727);
        rewardProgress.y = (this.isStand ? this.sceneHeight / 5 - this.sceneHeight / 2 : -this.sceneHeight / 5);
        rewardBar.width = rewardProgress.width * 0.97;
        rewardBar.height = rewardProgress.height * (25 / 43);
        rewardBar.x = -rewardBar.width / 2;

        rewardProgress.getComponent(cc.ProgressBar).totalLength = rewardBar.width;
        rewardProgress.getComponent(cc.ProgressBar).progress = 0;

        // 点击按钮
        let rewardButton = new cc.Node("rewardButton");
        this.nodeReward.addChild(rewardButton);
        rewardButton.addComponent(cc.Sprite);
        rewardButton.getComponent(cc.Sprite).spriteFrame = this.rewardRes["RewardButton"];
        rewardButton.width = (this.isStand ? this.sceneWidth * 0.75 : this.sceneHeight * 0.75);
        rewardButton.height = rewardButton.width * 0.38;
        switch (this.specialStyleAdapters) {
            case 1:
                if (!this.isStand) {
                    rewardButton.x = rewardButton.width * 0.4;
                    rewardButton.y = -rewardButton.height * 1.1;
                } else {
                    rewardButton.x = rewardButton.width * 0.35;
                    rewardButton.y = -rewardButton.height;
                }
                break;
            default:
                if (!this.isStand) {
                    rewardButton.x = rewardButton.width * 0.25;
                    rewardButton.y = -rewardButton.height * 0.3;
                } else {
                    rewardButton.x = rewardButton.width * 0.24;
                    rewardButton.y = -rewardButton.height * 0.3;
                }
                break;
        }
        rewardButton.scale = 0.5;

        // 进度条缩减定时器
        let interval_barCutDown = -1;
        // 进度条的进度
        let pBar = rewardProgress.getComponent(cc.ProgressBar).progress;
        // 生成随机区间 40-70
        let pBarTarget: number = Math.floor(Math.random() * 30) + 40;
        console.log(TAG, "pBarTarget:" + pBarTarget);
        // 监听按钮点击
        rewardButton.on(cc.Node.EventType.TOUCH_START, (event) => {
            if (interval_barCutDown == -1) {
                interval_barCutDown = setInterval(() => {
                    if (pBar >= 0.005) {
                        pBar -= 0.005;
                        rewardProgress.getComponent(cc.ProgressBar).progress = pBar;
                    }
                }, 100)
            }
            pBar += 0.05;
            rewardProgress.getComponent(cc.ProgressBar).progress = pBar;

            // 进度达到pBarTarget/100以上 且未展示激励视频
            if (pBar >= pBarTarget / 100 && !this.rewardHasShowVideo) {
                this.rewardHasShowVideo = true;
                if (XSdk.getInstance().getVideoFlag()) {
                    XSdk.getInstance().showVideo({}, (p, c) => {
                        this.hideRewardBox();
                        callback("showRewardBoxFinish", {});
                    });
                } else {
                    this.hideRewardBox();
                    callback("showRewardBoxFinish", {});
                }
                if (interval_barCutDown != -1) clearInterval(interval_barCutDown);
            }
            if (pBar >= 1) {
                this.hideRewardBox();
                callback("showRewardBoxFinish", {});
            }
        });

        setTimeout(() => {
            if (XSdk.getInstance().getIntersFlag()) {
                XSdk.getInstance().showInters({}, () => { });
            }
        }, 2000);
    }
}