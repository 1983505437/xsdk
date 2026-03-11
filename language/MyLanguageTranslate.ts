import LanguageManager from "./MyLanguageManager";
const { ccclass, property } = cc._decorator;

@ccclass
export default class LanguageTranslate extends cc.Component {

    
    onEnable() {
        setTimeout(() => {
            this.translate();
        }, 2);
    }

    public translate() {
        if (LanguageManager.getInstance().curLanguage == "zh") {
            console.log("中文，不翻译");
            return;
        }
        //console.log("翻译")
        let sprite = this.node.getComponent(cc.Sprite);
        let label = this.node.getComponent(cc.Label);
        let Skeleton = this.node.getComponent(sp.Skeleton);
        let richText = this.node.getComponent(cc.RichText);
        //获取图片翻译
        if (sprite) {
            let spr = LanguageManager.getInstance().getLanguageSpr(sprite.spriteFrame.name);
            if (spr) sprite.spriteFrame = spr

        }
        //获取字符串翻译
        if (label) {
            // 去除所有双引号
            label.string = label.string.replace(/\"/g, "");
            label.string = label.string.replace(/\s/g, "");
            let str = LanguageManager.getInstance().getLanguageStr2(label.string);
            if (str) label.string = str
        }
        if(richText){
            let str = LanguageManager.getInstance().getLanguageStr2(richText.string);
            if (str) richText.string = str
        }
        //获取骨骼动画翻译
        if (Skeleton) {
            let skt = LanguageManager.getInstance().getLanguageStoken(Skeleton.skeletonData.name);
            if (skt) Skeleton.skeletonData = skt
        }
    }
}
