

import { iframeSDK } from "../../iframeSDK/iframeSDK";
import LanguageManager from "../../language/MyLanguageManager";
import HarmonySdk from "../channel/HarmonySdk"
import EngineUtils from "../utils/EngineUtils";
import XSdk from "../XSdk";
export const xsdk = XSdk.getInstance();
import myAD from "./myAD";
import { params_hw, params_oppo, params_vivo, params_tt, params_ks, params_wx, params_android, rzStr2, rzStr1, jkzgStr1, jkzgStr2, nextScene, params_hm, gaiLv, gaiLvRate, platType, _pageConfig, param_default, plat_defalut, rzStr0, isOSks, params_osks, curLanguage, params_zfb, params_qq, isTest, params_test, isHJ, isOStt, params_ostt } from "./myData";
/**当前参数 */
export var curParam;
/**当前渠道 */
export var curPlat;
const {ccclass, property} = cc._decorator;
@ccclass
export default class myJs extends cc.Component {
    /**奖池索引 */
    @property({type:Number,tooltip:"默认值为0,读取myData概率参数里第1个奖池参数"})
    index = 0

    //@property(Boolean)
    isNeedLoadTips:boolean = true;

    isInited:boolean = false;
    onCliclk:Function = null;
    interval:any = null;
    protected onEnable(): void {
        this.init()
    }
    protected update(dt: number): void {
        //if(this.node.name == "test") this.test()
    }
    protected onDisable(): void {
        if(this.node.name == "loadTips"){
            clearInterval(this.interval)
        }
        if(this.node.name=="btn_gaiLv") this.node.getChildByName("label").off(cc.Node.EventType.TOUCH_START,this.onCliclk,this) 
        else this.node.off(cc.Node.EventType.TOUCH_START,this.onCliclk,this)
    }
    init(){ 
        //console.log("==initMyJS==")
        switch (this.node.name) {
            case "btn_more"://更多精彩====================
                this.btn_more()
                break;
            case "btn_yszc"://隐私政策======================
                this.btn_yszc()
                break;
            case "btn_ysxy":
                this.btn_ysxy();//隐私协议===================
                break;
            case "btn_yhxy":
                this.btn_yhxy();//用户协议===================
                break; 
            case "btn_gaiLv"://概率公示==============================
                this.btn_gaiLv();
                break;
            case "rzAndJkzg"://软著和健康忠告========================
                this.rzAndJkzg();
                break;
            case "loadTips"://加载时提示======================
                this.loadTips()
                break;
            case "first"://前置场景==============================
                this.first();
                break;
            case "rewardBox"://激励盒子========================
                this.showRewardBox()
                break;
            case "test"://测试节点===================================
                this.test();
                break;
            default://默认为弹窗界面的banner和插屏广告调用=============
                this.showBannerAndInters();
                break;
        }
        if(this.node.name=="btn_gaiLv") this.node.getChildByName("label").on(cc.Node.EventType.TOUCH_START,this.onCliclk,this)
        else this.onCliclk!=null && this.node.on(cc.Node.EventType.TOUCH_START,this.onCliclk,this)
    }
    /**显示处理 */
    checkShow(){
        //TODO 待简化
        if(!isHJ&&curPlat == platType.android||curPlat == platType.osks){//海外快手、安卓除oppo均不展示
            console.log("==checkShow==海外快手、安卓除oppo均不展示")
            switch(this.node.name){
                case "btn_yszc":
                    this.node.active = false;
                    break;
                case "btn_more":
                    this.node.active = xsdk.getChannelId() == 1007;//安卓oppo显示更多
                    break;
                case "btn_yhxy":
                    this.node.active = false;
                    break;
                case "btn_ysxy":
                    this.node.active = false;
                    break;
                case "rzAndJkzg":
                    this.node.active = false;
                    break;
                
            }
        }
        else if(curPlat == platType.harmony){//鸿蒙只展示用户协议和隐私协议
            console.log("==checkShow==鸿蒙只展示用户协议和隐私协议")
            switch(this.node.name){
                case "btn_yszc":
                    this.node.active = false;
                    break;
                case "btn_more":
                    this.node.active = false;
                    break;
                case "btn_yhxy":
                    this.node.active = true;
                    break;
                case "btn_ysxy":
                    this.node.active = true;
                    break;
                case "rzAndJkzg":
                    this.node.active = false;
                    break;
            }
        }else if(curPlat == platType.hw||curPlat == platType.vivo||curPlat == platType.oppo){//华为oppovivo展示隐私和软著健康忠告
            console.log("==checkShow==华为oppovivo展示隐私和软著健康忠告")
            switch(this.node.name){
                case "btn_yszc":
                    this.node.active = true;
                    break;
                case "btn_more":
                    this.node.active = false;
                    break;
                case "btn_yhxy":
                    this.node.active = false;
                    break;
                case "btn_ysxy":
                    this.node.active = false;
                    break;
                case "rzAndJkzg":
                    this.node.active = true;
                    break;
            } 
        }else if(curPlat == platType.wx||curPlat == platType.ks||curPlat == platType.tt||curPlat == platType.osks){//微信快手抖音只展示软著健康忠告
            console.log("==checkShow==微信快手抖音只展示软著健康忠告")
            switch(this.node.name){
                case "btn_yszc":
                    this.node.active = false;
                    break;
                case "btn_more":
                    this.node.active = false;
                    break;
                case "btn_yhxy":
                    this.node.active = false;
                    break;
                case "btn_ysxy":
                    this.node.active = false;
                    break;
                case "rzAndJkzg":
                    this.node.active = true;
                    break;
            }
        }else{//默认都不展示
            console.log("==checkShow==默认都不展示")
            this.node.active = false;
        }
    }
    /**渠道处理 */
    checkPlat(){
        if(cc.sys.isBrowser){
            curParam = param_default,console.log("==这是浏览器=="),curPlat = plat_defalut
            return
        }
        if(isOStt){
            curParam = params_ostt,console.log("==这是海外抖音=="),curPlat = platType.ostt
            return
        }
        if(isOSks){
            curParam = params_osks,console.log("==这是海外快手=="),curPlat = platType.osks
            return
        }
        switch (cc.sys.platform) {
            case cc.sys.OPPO_GAME:
                curParam = params_oppo,
                console.log("==这是oppo=="),
                curPlat = platType.oppo
                break;
            case cc.sys.VIVO_GAME:
                curParam = params_vivo,
                console.log("==这是vivo=="),
                curPlat = platType.vivo
                break;
            case cc.sys.BYTEDANCE_GAME:
                curParam = params_tt,
                console.log("==这是字节跳动=="),
                curPlat = platType.tt
                break;
            case cc.sys.QQ_PLAY:
                curParam = params_qq,
                console.log("==这是QQ=="),
                curPlat = platType.qq
                break;
            case cc.sys.WECHAT_GAME:
                if(typeof window['ks']!="undefined"){
                    curParam = params_ks,
                    console.log("==这是快手=="),
                    curPlat = platType.ks
                }else if(typeof window['wx']!="undefined"){
                    curParam = params_wx,
                    console.log("==这是微信=="),
                    curPlat = platType.wx
                }
                break;
            case cc.sys.HUAWEI_GAME:
                curParam = params_hw,
                console.log("==这是华为=="),
                curPlat = platType.hw
                break;
            case cc.sys.ALIPAY_GAME:
                curParam = params_zfb,
                console.log("==这是支付宝=="),
                curPlat = platType.zfb
                break;
            case cc.sys.ANDROID:
                curParam = params_android,
                console.log("==这是安卓=="),
                curPlat = platType.android
                break;
            default:
                curParam = params_hm,
                console.log("==这是鸿蒙=="),
                curPlat = platType.harmony
                break;
        }
        if(isTest) curParam = params_test,console.log("==这是测试=="),curPlat = platType.test
    }
    //#region 挂点方法
    /**软著和健康忠告 */
    rzAndJkzg(){
        this.checkShow();
        let isStand = cc.winSize.height>cc.winSize.width?true:false
        console.log(isStand?"竖":"横")
        if(curPlat == platType.hw) this.node.getChildByName("rz").getComponent(cc.Label).string = isStand?rzStr1+"\n"+rzStr2:rzStr1+"  "+rzStr2;//游戏名称+著作权人
        else if(curPlat == platType.ks) this.node.getChildByName("rz").getComponent(cc.Label).string = rzStr0+" "+rzStr1+"\n"+rzStr2//游戏名称+登记号+著作权人
        else this.node.getChildByName("rz").getComponent(cc.Label).string = isStand?rzStr0+"\n"+rzStr2:rzStr0+"  "+rzStr2;//登记号+著作权人
        this.node.getChildByName("jkzg").getComponent(cc.Label).string = isStand?jkzgStr1:jkzgStr2;//健康忠告
    }  
    /**oppo更多精彩 */
    btn_more(){
        this.checkShow();
        this.onCliclk = ()=>{
            xsdk.gotoOppoGameCenter();
        }
    }
    /**隐私政策 */
    btn_yszc(){
        this.checkShow();
        this.onCliclk = ()=>{
            xsdk.onClickPrivacyAgreementBtn();
        }        
    }
    /**隐私协议*/
    btn_ysxy(){
        this.checkShow();
        this.onCliclk = ()=>{
            switch(curParam["company"]){
            case "yx":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/yixin/base_yszc.html")
                break
            case "yl":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/yinli/base_yszc.html")
                break
            case "xmy":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/xingmengyou/base_yszc.html")
                break
            case "hks":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/haikesi/base_yszc.html")
                break
            case "op":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/oupo/base_yszc.html")
                break
            case "jc":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/privacy/jichuan/base_yszc.html")
                break
            default:
                break;
            }
        }

    }
    /**用户协议 */
    btn_yhxy(){
        this.checkShow();
        this.onCliclk = ()=>{
            switch(curParam["company"]){
            case "yx":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/yixin/base_yhxy.html")
                break
            case "yl":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/yinli/base_yhxy.html")
                break
            case "xmy":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/xingmengyou/base_yhxy.html")
                break
            case "hks":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/haikesi/base_yhxy.html")
                break  
            case "op":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/oupo/base_yhxy.html")
                break
            case "jc":
                HarmonySdk.getInstance().openUrl("https://xgamesdk.xplaymobile.com/user/jichuan/base_yhxy.html")
                break
            default:
                break;
            }
        }
    }
    /**概率公示 */
    btn_gaiLv(){
        this.node.getChildByName("content").active = false
        let layout = this.node.getChildByName("content").getChildByName("Layout")
        let pfb_gailv = this.node.getChildByName("item") 
        if(this.index>gaiLv.length-1){
            console.log("没有该概率数据,",this.index)
            return
        }
        var gaiLvItem = gaiLv[this.index].gaiLvItem
        var gaiLvWeight = gaiLv[this.index].gaiLvWeight
        var gaiLvSection = gaiLv[this.index].gaiLVSection
        if(gaiLvWeight.length != 0){//权重计算
            var _total=0;
                _total = gaiLvWeight.reduce(function(prev,curr){
                return prev+curr;
                })
            console.log(_total)
            var _gaiLvTotal=0
            for(var i=0;i<gaiLvWeight.length;i++){
                var _result = Number((100*(gaiLvWeight[i]/_total)).toFixed(2));
                _gaiLvTotal+=_result;
                gaiLvRate[i] = _result+"%";
                console.log("->"+i+"->"+gaiLvRate[i])
            }
            console.log("校验总和",_gaiLvTotal)
        }
        else if(gaiLvSection.length!=0){//分段式计算概率
            let temp = 0;
            let _gaiLvTotal=0;
           for(let i=0;i<gaiLvSection.length;i++){
                let _result = (100*(gaiLvSection[i]-temp)/gaiLvSection[gaiLvSection.length-1])
                gaiLvRate[i] = _result.toFixed(1) +"%";
                console.log(temp,"---",gaiLvSection[i],"->"+i+"->"+gaiLvRate[i])
                temp = gaiLvSection[i]
                _gaiLvTotal+=_result
           }
           console.log("校验总和",_gaiLvTotal)
        }
        layout.removeAllChildren();
        for(let i=0;i<gaiLvItem.length;i++){
            let newNode = cc.instantiate(pfb_gailv);
            newNode.getComponent(cc.Label).string = gaiLvItem[i]+" : "+gaiLvRate[i]
            newNode.setParent(layout);
        }
        this.onCliclk = ()=>{
            this.node.getChildByName("content").active = this.node.getChildByName("content").active?false:true;
            //console.log(this.node)
        }
    }
  
    /**激励盒子 */
    showRewardBox(){
        if(curPlat != platType.vivo) return
        var showTips = ()=>{
            let _date = new Date();
            cc.sys.isBrowser
            ?console.log("%c"+_date.toLocaleTimeString()+"-------------->调用rewardBox---------->","border:1px solid black;padding 5px;",this.node.name)
            :console.log("--->"+_date.toLocaleTimeString()+"-------------->调用rewardBox---------->"+this.node.name)
            if(cc.sys.isBrowser) EngineUtils.ShowText("==rewardBox=="+this.node.name)
        }
        showTips()
        myAD.showrewardbox()
    }
    /**弹窗界面的banner和插屏广告调用 */
    showBannerAndInters(){
        var showTips = ()=>{
            let _date = new Date();
            cc.sys.isBrowser
            ?console.log("%c"+_date.toLocaleTimeString()+"-------------->调用banner+inters---------->","border:1px solid black;padding 5px;",this.node.name)
            :console.log("--->"+_date.toLocaleTimeString()+"-------------->调用banner+inters---------->"+this.node.name)
            if(cc.sys.isBrowser) EngineUtils.ShowText("==banner+inters=="+this.node.name)
        }
        if(curPlat == platType.vivo){//vivo插屏微调
            var _top,_delay = 0;
            for(let i of _pageConfig){
                if(i.name == this.node.name){
                    i.top && (_top = i.top);
                    //i.delay && (_delay = i.delay);
                }
            }
            setTimeout(() => {
                showTips()
                xsdk.createToShowAd({
                    //type:_type,//展示广告类型
                    //left:_left,//广告的左上角距离屏幕左侧距离
                    top:_top//广告的左上角距离屏幕顶部距离
                },()=>{})
                xsdk.showBanner()
            }, _delay);
        }else{//默认正常展示
            myAD.showBannerAndInters(this)
        }   
    }
    /**加载提示 */
    loadTips(){
        if(!this.isNeedLoadTips) {
            this.node.active = false
            return
        }else this.node.active = true
        var str = this.node.getComponent(cc.Label).string;//
        var str0 = str +"...";
        var str1 = str + "";
        if(this.interval == null) this.interval = setInterval(() => {
            str += ".";   
            if(str == str0) str = str1;          
            this.node.getComponent(cc.Label).string = str;
           
        }, 500);
    }
    /**前置场景初始化sdk */
    first(){
        console.log("默认语言..",curLanguage)
        console.log("是否是海外快手..",isOSks)
        console.log("是否是海外抖音..",isOStt)
        console.log("是否是合集..",isHJ)
        console.log("是否是测试..",isTest)

        console.log("cc.sys.isbrowser == ",cc.sys.isBrowser);
        console.log("cc.sys.isMobile == ",cc.sys.isMobile)
        console.log("cc.sys.isNative == ",cc.sys.isNative)
        this.checkPlat();
        let delay = curPlat!=platType.android&&curPlat!=platType.harmony?2000:20//android和harmony延迟2000ms
        let call = ()=>{
            setTimeout(() => {
                if(isHJ&&cc.sys.isBrowser&&cc.sys.isMobile) iframeSDK.init()
                myAD.initSDK (curParam,function (phases, res){
                    console.log("XSdk init phases:", phases, "res:", JSON.stringify(res));
                    if (phases == "agreePrivacy"){
                        cc.director.loadScene(nextScene)	
                    }
                });
            },delay);
        }
        this.config(call)
        // if(curLanguage!="zh") this.config(call);//非中文需要加载翻译配置
        // else call();
    }
    /**加载翻译配置 */
    config(callback?: Function){
        switch (curPlat) {
            case platType.ostt:
                //@ts-ignore
                LanguageManager.getInstance().curLanguage = TTMinis.game.getSystemInfoSync().language
                break;
            case platType.osks:
                //LanguageManager.getInstance().curLanguage = TTMinis.game.getSystemInfoSync().language
                break;      
            default:
                LanguageManager.getInstance().curLanguage = curLanguage
                break;
        }
        //只取前2位
        if(LanguageManager.getInstance().curLanguage.length>2) LanguageManager.getInstance().curLanguage = LanguageManager.getInstance().curLanguage.substring(0,2)
        console.log("当前语言:", LanguageManager.getInstance().curLanguage)
        if(LanguageManager.getInstance().curLanguage=="zh") callback()
        else{
            console.log("开始加载翻译..")
            LanguageManager.getInstance().LoadLanguageRes(() => {
                console.log("翻译资源加载完成");
                callback && callback()
            });           
        }
    }
    /**测试 */
    test(){

    }
    //#endregion
}