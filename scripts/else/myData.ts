/**奖池物品概率 */
export var gaiLvRate = [//在此手动填入概率的话，需先让权重概率和分段式概率数组为空
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
    "10%",
]
/**概率参数 */
export var gaiLv = [
    //第一个奖池
    {
        gaiLvItem:[//奖池物品
            "金币x100",
            "钻石x100",
            "体力x5",
            "皮肤",
        ],
        gaiLvWeight:[4,3,2,1],//权重计算 如4,3,2,1
        gaiLVSection:[]//分段式计算 如0.4,0.7,0.9,1
    },
    //第二个奖池
    {
        gaiLvItem:[
            "金币x100",
            "钻石x100",
            "体力x10",
            "皮肤",
        ],
        gaiLvWeight:[],
        gaiLVSection:[]
    }
]
/**主体列表 */
export const companyList = {
    bt:"著作权人:深圳市霸天网络科技有限公司",
    mq:"著作权人:深圳市萌趣游戏科技有限公司",
    yl:"著作权人:深圳市引力乐园科技有限公司",
    yx:"著作权人:深圳市益欣网络科技有限公司",
    qyw:"著作权人:深圳市趣有味科技有限公司",
    syc:"著作权人:深圳市深艺创科技有限公司",
    xmy:"著作权人:深圳市星梦游科技有限公司",
    xyy:"著作权人:深圳市小元元科技有限公司",
    yahd:"著作权人:深圳市有爱互动科技有限公司",
    yqwx:"著作权人:深圳市益趣无限科技有限公司",
    hy:"著作权人:深圳市鸿宇科技电子商务有限公司",
    mml:"著作权人:深圳市萌萌乐科技有限公司",
    zy:"著作权人:深圳市左游网络科技有限公司",
}
/**渠道类型 */
export enum platType{
    test,
    oppo,
    vivo,
    tt,
    ostt,
    qq,
    wx,
    hw,
    ks,
    osks,
    blibli,
    zfb,
    android,
    harmony
}
/**健康忠告-竖屏 */
export var jkzgStr1 = "《健康游戏忠告》\n抵制不良游戏，拒绝盗版游戏。\n注意自我保护，谨防受骗上当。\n适度游戏益脑，沉迷游戏伤身。\n合理安排时间，享受健康生活。"//竖屏
/**健康忠告-横屏 */
export var jkzgStr2 = "《健康游戏忠告》\n抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。\n适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。"//横屏
/**登记号 */
export var rzStr0 = "登记号："+"2022SR0958698"
/**游戏名称 */
export var rzStr1 = "游戏名称:"+"卡皮巴拉大冒险"//////////
/**著作权人 */
export var rzStr2 = companyList.yqwx//////////////
/**跳转场景 */
export var nextScene = "loadBundle"//////////
/**当前语言 */
export var curLanguage = "en"//////////
/**是否海外快手 */
export var isOSks = false;//////////
/**是否海外抖音 */
export var isOStt = true;//////////
/**是否合集 */
export var isHJ = true;//////////
/**测试 */
export var isTest = false
//#region 渠道参数
/**oppo参数 */
export var params_oppo = {//炫彩节奏3D//yx//xcjz3d.xyy.kyx.nearme.gamecenter
    gameChannelCodeNo: "26142", //渠道号
    group: "ad",
    company: "qyw",
    versionName: "2.0.0",  
}
/**vivo参数 */ 
export var params_vivo = {//炫彩节奏3D//yx//com.qyw.qcjzsd.vivominigame
        gameChannelCodeNo: "26108",//渠道号
        group: "ad",
        company: "qyw",
        versionName: "4.1.0",   
}
/**抖音参数 */
export var params_tt = {
    gameChannelCodeNo: "154", //渠道号
    group: "ad",
}
/**海外抖音参数 */
export var params_ostt = {
    gameChannelCodeNo: "41301", //渠道号
    group: "ad",
}
/**qq参数 */
export var params_qq = {
    gameChannelCodeNo: "155", //渠道号
    group: "ad",
}
/**微信参数 */
export var params_wx = {
    gameChannelCodeNo: "161", //渠道号
    group: "ad",
}
/**华为参数 */
export var params_hw = {//卡皮巴拉大冒险//yqwx//com.xmy.kpbldmx.minihuawei
        gameChannelCodeNo: "623163",
        group: "ad",
        appid: "116530069",
        company: "xmy",
        accessToken: "wAl2iQmhCaPSJsw8pbGk9ovOlIB7NHyx",
        versionCode: 100,
        versionName: "1.0.0",
}
/**快手参数 */
export var params_ks = {//开心解压模拟器//2022SR0958698//xmy
    gameChannelCodeNo: "60164", //渠道号
    group: "ad",
}
/**海外快手参数 */
export var params_osks = {
    gameChannelCodeNo: "3300", //渠道号
    group: "ad",
}
/**bilibili参数 */
export var params_bilibili = {
    gameChannelCodeNo: "165", //渠道号
    group: "ad",
}
/**支付宝参数 */
export var params_zfb = {
    gameChannelCodeNo: "166", //渠道号
    group: "ad",
}
/**安卓参数 */
export var params_android = {
    gameChannelCodeNo: "666", //渠道号
    group: "ad",
}
/**鸿蒙参数 */
export var params_hm = {
    gameChannelCodeNo: "668", //渠道号
    group: "ad",
    company: "yl",
}
/**测试参数 */
export var params_test= {
    gameChannelCodeNo: "000", //渠道号
    group: "ad",
    company: "jc",
}
/**默认参数（浏览器） */
export var param_default = params_android
/**默认渠道（浏览器） */
export var plat_defalut = platType.android
//#endregion
//#region vivo弹窗参数
export var _pageConfig = [
    {
        name:"UIReLife",
        //type:"nativeTemplateInters",//插屏类型
        //left:100,//插屏左边距
        //delay:100,//插屏延迟时间
        top:400//插屏上边距
    },
    {
        name:"UIReLife",
        top:400
    },
]