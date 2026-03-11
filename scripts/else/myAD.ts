import { iframeSDK } from "../../iframeSDK/iframeSDK";
import EngineUtils from "../utils/EngineUtils";
import { isHJ } from "./myData";
import { xsdk } from "./myJs";



export default class myAD{
    static CD = 2
    static isCanShowAD=true  
    /**初始化sdk */
    static initSDK(params?: object,callback?: (phases: string, res: object) => void,): void {
        xsdk.initSDK(params, callback);
    }
    /**调用激励视频--激励中不显示其他广告 */
    static showVideo(_success,_fail,_braak?){
        if(!myAD.isCanShowAD) {
            console.log("视频CD中..."+new Date().getSeconds())
            return
        }
        cc.sys.isBrowser
            ?console.log("%c"+"=============showVideo==================","border:1px solid red;padding:5px;")
            :console.log("=============showVideo==================");

        if(isHJ&&cc.sys.isBrowser&&cc.sys.isMobile){           
            console.log("=============合集-->showVideo==================");
            iframeSDK.showVideo((isSuccess)=>{
                if(isSuccess){
                    _success&&_success()
                }else{
                    EngineUtils.ShowText("看完视频才有奖励")
                    _fail&&_fail()
                }
            },null)
            return
        }
        if(xsdk.getVideoFlag()){
            myAD.isCanShowAD = false
            xsdk.showVideo({},(phases,res)=>{
                if(cc.sys.isBrowser){
                    EngineUtils.ShowText("浏览器直接发放奖励")
                    console.log("浏览器直接发放奖励")
                    _success&&_success()
                    myAD.isCanShowAD = true
                }else{
                    if(phases == "videoPlayFinish"){
                        console.log("激励视频播放结束")
                        _success&&_success()
                        myAD.isCanShowAD = true
                    }
                    if(phases == "videoPlayBreak"){
                        EngineUtils.ShowText("看完视频才有奖励哦")
                        console.log("视频播放中断")
                        _braak
                        ?_braak()
                        :_fail&&_fail()
                        myAD.isCanShowAD = true
                    }
                }    
            })
        }else{
            EngineUtils.ShowText("激励视频尚未准备好")
            console.log("激励视频尚未准备好")
            _fail&&_fail()
            myAD.isCanShowAD = true
        }
    }
    /**调用banner和插屏广告--设置间隔2s */
    static showBannerAndInters(target?){
        if(!myAD.isCanShowAD) {
            console.log("广告CD中..."+new Date().getSeconds())
            return
        }
        if(isHJ&&cc.sys.isBrowser&&cc.sys.isMobile){            
            var str = ""
            if(typeof target == "string") str = target
            else if(typeof target == "object") str = target.node.name
            else str = "0"            
            let _date = new Date();
            console.log("--->"+_date.toLocaleTimeString()+"-------------->调用banner+inters---------->"+str)
            console.log("合集-->showBannerAndInters")
            iframeSDK.showBanner(true);
            iframeSDK.showInters(()=>{},null);
            return
        }
        xsdk.showBanner()
        if(xsdk.getIntersFlag()){
            myAD.isCanShowAD = false
            setTimeout(() => {
                myAD.isCanShowAD = true
            }, myAD.CD*1000);
            xsdk.showInters({},(phases)=>{
                if(phases == "intersClose"){
                    console.log("插屏广告展示完成")
                    myAD.isCanShowAD = true
                }  
            });
        }
        var showTips = ()=>{
            var str = ""
            if(typeof target == "string") str = target
            else if(typeof target == "object") str = target.node.name
            else str = "0"            
            let _date = new Date();
            cc.sys.isBrowser
            ?console.log("%c"+_date.toLocaleTimeString()+"-------------->调用banner+inters---------->","border:1px solid red;padding 5px;",str)
            :console.log("--->"+_date.toLocaleTimeString()+"-------------->调用banner+inters---------->"+str)
            if(cc.sys.isBrowser) EngineUtils.ShowText("==banner+inters=="+str)
        }    
        showTips()
    }
 
   /**调用震动 */
   static shake(type){
        if(isHJ&&cc.sys.isBrowser&&cc.sys.isMobile){
            console.log("合集-->shake")
            iframeSDK.phoneVibrate(type)
            return
        }
        if(cc.sys.isBrowser) {
            console.log("myAD震动...",type)
            return;
        }
        xsdk.phoneVibrate(type)
   }
   /**是否添加桌面 */
   static isSupportAddDesktop(callback){
    xsdk.isSupportAddDesktop(callback)
   }
   /**添加桌面 */
   static addDeskTop(callback){
    xsdk.addDesktop(callback)
   }
   /**是否侧边栏 */
   static intoGameFromSidebar(callback){
    xsdk.intoGameFromSidebar(callback)
   }
   /**展示侧边栏 */
   static gotoSideBar(){
    xsdk.gotoSidebar()
   }
   /**展示激励盒子 */
  static showrewardbox() {
    xsdk.showRewardBox({}, (phases, res) => {
      if (phases == "showRewardBoxFinish") {
          console.log("激励盒子展示完成");
          cc.director.emit("getBoxReward")
      }
    });
}
