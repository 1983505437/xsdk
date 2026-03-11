
import LanguageManager from '../language/MyLanguageManager';
import myAD from '../scripts/else/myAD';
import { platType } from '../scripts/else/myData';
import { curPlat } from '../scripts/else/myJs';
const { ccclass, property } = cc._decorator;

@ccclass
export class addSideBarView extends cc.Component {
    @property(cc.Node)
    btn_addDesk: cc.Node = null;
    @property(cc.Node)
    btn_sideBar: cc.Node = null;
    @property(cc.Node)
    btn_clear: cc.Node = null;
    @property(cc.Node)
    btn_get_sideBar: cc.Node = null;
    @property(cc.Node)
    btn_goToSideBar: cc.Node = null;
    @property(cc.Node)
    btn_close_sideBar: cc.Node = null;
    @property(cc.Node)
    content: cc.Node = null;


    protected onLoad(): void {
        if(LanguageManager.getInstance().curLanguage=="zh"){
            this.node.active = false
            console.log("不需要侧边栏和添加桌面")
            return
        }
        if(cc.sys.localStorage.getItem("gotReward_addDesk")=="true"){
            console.log("用户已领取桌面奖励")
            this.btn_addDesk.active = false
        }else {
            this.btn_addDesk.active = true
        }
        if(cc.sys.localStorage.getItem("gotReward_sideBar")=="true"){
            console.log("用户已领取侧边栏奖励")
            this.btn_sideBar.active = false
        }else {
            this.btn_sideBar.active = true
        }
        this.btn_clear.active = this.btn_addDesk.active||this.btn_sideBar.active?false:true
        this.content.active = false

        this.btn_clear.on(cc.Node.EventType.TOUCH_END, this.onClearCache, this)
        this.btn_addDesk.on(cc.Node.EventType.TOUCH_END, this.onAddDesk, this)
        this.btn_sideBar.on(cc.Node.EventType.TOUCH_END, this.onSideBar, this)
        this.btn_goToSideBar.on(cc.Node.EventType.TOUCH_END, this.onGoToSideBar, this)
        this.btn_get_sideBar.on(cc.Node.EventType.TOUCH_END, this.onGet_sideBar, this)
        this.btn_close_sideBar.on(cc.Node.EventType.TOUCH_END, this.onClose_sideBar, this)
        
    }
    /**清除数据 */
    onClearCache(){
        console.log("清除数据")
        cc.sys.localStorage.clear();
        cc.game.restart()
    }
    /**添加桌面 */
    onAddDesk(){
        /**奖励 */
        let getReward = ()=>{
            console.log("获得添加桌面奖励..")
            cc.sys.localStorage.setItem("gotReward_addDesk", "true")
            this.btn_addDesk.active = false
            cc.director.emit("getReward_addDesk")            
        }
        /***检测回调 */
        let callback1 = (success:boolean)=>{
            if(success){
                console.log("检测到从桌面进入")
                getReward()
            }
            else{
                console.log("前往添加桌面")
                myAD.addDeskTop(callback2)
            }
        }
        /**添加桌面回调 */
        let callback2 = (success:boolean)=>{
           if(success){
                getReward()
           }
        }
        myAD.isSupportAddDesktop(callback1)
    }
    /**检测是否从侧边栏进入 */
    checkSiderBar(){
        let callback = (success:boolean)=>{
            if(success){
                this.btn_get_sideBar.active = true
                this.btn_goToSideBar.active = false
            }else{
                this.btn_get_sideBar.active = false
                this.btn_goToSideBar.active = true
            }
        }
        myAD.intoGameFromSidebar(callback)    
    }
    /**展示侧边栏界面 */
    onSideBar(){
        this.content.active = true;
        this.checkSiderBar();
    }
    /**前往侧边栏 */
    onGoToSideBar(){
        myAD.gotoSideBar()
    }
    /**领取侧边栏奖励 */
    onGet_sideBar() {
        console.log("获得侧边栏奖励..")
        cc.sys.localStorage.setItem("gotReward_sideBar", "true")
        this.content.active = false;
        this.btn_sideBar.active = false
        cc.director.emit("getReward_sideBar")
            // let succ = ()=>{
            //     sys.localStorage.setItem("gotReward_sideBar", "true")
            //     this.content.active = false;
            //     this.btn_sideBar.active = false
            //     director.emit("getReward_sideBar")
            // }
            // myAD.intoGameFromSidebar(succ)    
    }
    /**关闭侧边栏界面 */
    onClose_sideBar() {
        this.content.active = false;
    }
}

