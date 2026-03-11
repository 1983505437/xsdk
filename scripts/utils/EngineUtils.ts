import LanguageManager from "../../language/MyLanguageManager";
import { TAG } from "./Enums";
import LocalStorage from "./LocalStorage";

/*
 * @Author: Vae 
 * @Date: 2023-10-24 12:19:31 
 * @Last Modified by: Vae
 * @Last Modified time: 2024-08-01 16:05:02
 */
export default class EngineUtils {

    /**
     * 加载资源数组
     */
    static loadResArray(resArray: string[], callback: (ret: boolean, res: any[]) => void): void {
        // Cocos加载图片资源方法
        let ImageArr = new Array();
        var arrNumber = 0;
        for (let index = 0; index < resArray.length; index++) {
            let type = "png";
            if (resArray[index].indexOf(".jpg") != -1) {
                type = "jpg";
            }
            // @ts-ignore
            cc.loader.load({ url: resArray[index], type: type }, (err, resList) => {
                ImageArr[index] = resList;
                if (err || !ImageArr[index]) {
                    console.log(TAG, "资源加载错误:" + JSON.stringify(err));
                    callback(false, []);
                    return;
                }
                arrNumber++;
                if (arrNumber >= resArray.length) {
                    callback(true, ImageArr);
                }
            })
        }
    }

    /**
     * 加载隐私协议本地图集
     */
    static loadPrivacyAtlas(callback: (ret: boolean, res: object) => void): void {
        if (this.getEngineVersion() < 20400) {
            //cocos 2.3.x
            // @ts-ignore
            cc.loader.loadRes("sdkAtlas/privacy", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "隐私协议图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        } else {
            //cocos 2.4.x
            // @ts-ignore
            cc.resources.load("sdkAtlas/privacy", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "隐私协议图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        }
    }

    /**
     * 加载神秘奖励本地图集
     */
    static loadRewardAtlas(callback: (ret: boolean, res: object) => void): void {
        if (this.getEngineVersion() < 20400) {
            //cocos 2.3.x
            // @ts-ignore
            cc.loader.loadRes("sdkAtlas/reward", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "激励图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        } else {
            //cocos 2.4.x
            // @ts-ignore
            cc.resources.load("sdkAtlas/reward", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "激励图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        }
    }

    /**
     * 加载原生广告本地图集
     */
    static loadNativeBannerAdAtlas(callback: (ret: boolean, res: object) => void): void {
        if (this.getEngineVersion() < 20400) {
            //cocos 2.3.x
            // @ts-ignore
            cc.loader.loadRes("sdkAtlas/native_banner_ad", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "原生banner图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        } else {
            //cocos 2.4.x
            // @ts-ignore
            cc.resources.load("sdkAtlas/native_banner_ad", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "原生banner图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        }
    }

    /**
     * 加载原生广告本地图集
     */
    static loadNativeIntersAdAtlas(callback: (ret: boolean, res: object) => void): void {
        if (this.getEngineVersion() < 20400) {
            //cocos 2.3.x
            // @ts-ignore
            cc.loader.loadRes("sdkAtlas/native_inters_ad", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "原生插屏图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        } else {
            //cocos 2.4.x
            // @ts-ignore
            cc.resources.load("sdkAtlas/native_inters_ad", cc.SpriteAtlas, (err, atlas) => {
                if (atlas && atlas["loaded"]) {
                    callback(true, atlas["_spriteFrames"]);
                } else {
                    console.error("XSDK", "原生插屏图集资源加载失败,请检查是否将sdkAtlas文件夹挪动到resources下");
                    callback(false, {});
                }
            });
        }
    }

    /**
     * 获取cocos引擎版本
     */
    static getEngineVersion(): number {
        let versionCode = 0;
        if (window && window["CocosEngine"]) {
            console.log("XSDK", "CocosEngine:" + window["CocosEngine"]);
            let versionName: string = window["CocosEngine"];
            let versionArray: string[] = versionName.split(".");
            versionCode = Number(versionArray[0]) * 10000 + Number(versionArray[1]) * 100 + Number(versionArray[2]);
        }
        return versionCode;
    }

    /**
     * 展示提示
     */
    static showPopup(text: string): void {
        EngineUtils.ShowText(text)
        return
        let Tips: cc.Node = new cc.Node();
        Tips.width = cc.winSize.width * 0.9;
        Tips.addComponent(cc.Label);
        Tips.zIndex = cc.macro.MAX_ZINDEX;
        Tips.getComponent(cc.Label).string = text;
        Tips.getComponent(cc.Label).fontSize = 25;
        cc.director.getScene().addChild(Tips);
        //动画效果
        Tips.active = true;
        Tips.opacity = 255;
        Tips.x = cc.winSize.width / 2
        Tips.stopAllActions();
        Tips.scale = 0.3;
        Tips.y = cc.winSize.height / 2;
        cc.tween(Tips)
            .to(0.5, { scale: 1.5, opacity: 255 }, { easing: cc.easing.elasticOut })
            .by(1.5, { position: cc.v3(0, 400, 0), opacity: -255 })
            .call(() => { Tips.destroy() })
            .start();
    }

    /**
     * 展示弹窗
     */
    static showToast(text: string): void {
        this.loadResArray(["https://tencentcnd.minigame.xplaymobile.com/Other/SDK/SDKImage4/Other/BlackBg.png"], (ret: boolean, res: any[]) => {
            if (!ret) return;
            let blackBg: cc.Node = new cc.Node();
            cc.director.getScene().addChild(blackBg);
            blackBg.addComponent(cc.Sprite);
            blackBg.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(res[0]);
            blackBg.addComponent(cc.BlockInputEvents);
            blackBg.width = cc.winSize.width;
            blackBg.height = cc.winSize.height;
            blackBg.x = cc.winSize.width / 2
            blackBg.y = cc.winSize.height / 2;
            let Tips: cc.Node = new cc.Node();
            blackBg.addChild(Tips);
            Tips.addComponent(cc.Label);
            Tips.zIndex = cc.macro.MAX_ZINDEX;
            Tips.getComponent(cc.Label).string = text;
            Tips.width = cc.winSize.width * 0.9;
            Tips.height = cc.winSize.height;
            Tips.getComponent(cc.Label).overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        })
    }
    /**显示文本(--文本内容--起始位置Y--偏移量Y)*/
    public static ShowText(str:string,startPosY:number = cc.winSize.height*0.75,offsetY:number = 150){
        str = LanguageManager.getInstance().getLanguageStr2(str)
        console.log("显示文本--",str)
        let _txtLayer;
        _txtLayer = cc.director.getScene().getChildByName("Canvas")?cc.director.getScene().getChildByName("Canvas"):cc.director.getScene();
        _txtLayer.children.forEach(element => {
            if(element.name == "txtNode") {
                //cc.Tween.stopAllByTarget(element);
                element.stopAllActions();
                element.destroy()
            }
        });
        var startPosX = _txtLayer.name == "Canvas"?0:cc.winSize.width*0.5
        startPosY = _txtLayer.name == "Canvas"?cc.winSize.height*0.25:cc.winSize.height*0.75
        let txtNode = new cc.Node("txtNode");
        txtNode.color = cc.Color.WHITE;
        let label = txtNode.addComponent(cc.Label);
        label.string = str;
        label.fontSize = 30 ;
        //居中
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        let outLine = txtNode.addComponent(cc.LabelOutline);
        outLine.color =cc.Color.BLACK;// cc.color(180, 242, 251)
        outLine.width = 3;
        txtNode.setParent(_txtLayer);
        txtNode.setPosition(startPosX,startPosY);
        txtNode.zIndex = cc.macro.MAX_ZINDEX;
        txtNode.group = LocalStorage.getStringData("group")
        cc.tween(txtNode)
        .to(0.5, { scale: 1.5, opacity: 255 }, { easing: cc.easing.elasticOut })
        .by(1,{position:cc.v3(0,offsetY),opacity:-255})
        .call(()=>{
            txtNode.destroy();
        })
        .start()    
        /* let tw = new cc.Tween();
        tw
        .target(txtNode)
        .to(0.5, { scale: 1.5, opacity: 255 },{progress:null,easing:"elasticOut"})
        .by(1,{position:new cc.Vec2(0,offsetY),opacity:-255},{progress:null,easing:null})
        .call(()=>{
            txtNode.destroy();
        })
        .start() */      
    }    
    static timeMap: any = {};
    /**计时器 */
    public static countSpendTiem(type,key){
        if(type === "start") this.timeMap[key] = new Date().getTime();    
        if(type === "end"){
            if(this.timeMap[key]){
                let startTime = this.timeMap[key];
                let endTime = new Date().getTime();
                let spendTime = endTime - startTime;
                return spendTime;
                delete this.timeMap[key];
            }else{
                console.log("no start time for key: " + key);
            }
        }
    }
}