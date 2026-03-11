export const TAG = "XSDK";

// export const BASE_URL = "http://192.168.31.107:9528"
// export const BASE_URL = "http://120.24.215.126:9528"
export const BASE_URL = "https://sdk.mini.stargame.group"
export const BASE_URL_OVS = "https://minigame-overseas-sdk.xplaymobile.com"
// export const BASE_URL = "http://localhost:9528"

export enum RequestUrl {
    SIGN_IN_URL = BASE_URL + "/api/game_user/sign_in",
    GAME_CONTENT = BASE_URL + "/api/game_content/config",
    GAME_JSON = BASE_URL + "/api/game_json/config",
    INIT_CONTENT = BASE_URL + "/api/game_content/init",

    WEIXIN_PRE_ORDER_MIDAS = BASE_URL + "/api/game_order/wechat/midas/create",
    WEIXIN_PRE_ORDER_JSPAY = BASE_URL + "/api/game_order/wechat/jsapi/create",
    WEIXIN_PAY_BALANCE = BASE_URL + "/api/game_order/wechat/midas/pay_balance",
    WEIXIN_RAW_DATA_SIGNATURE = BASE_URL + "/api/game_user/wechat/raw_data_signature",
    WEIXIN_DATA_DECRYPTION = BASE_URL + "/api/game_user/wechat/decryption_data",
    UPLOAD_SHARE_TASK = BASE_URL + "/api/game_user/shard_task/upload",
    GET_SHARE_TASK_DETAIL = BASE_URL + "/api/game_user/shard_task/detail",

    TIKTOK_PRE_ORDER_DEFAULT = BASE_URL + "/api/game_order/tiktok/default/create",
    TIKTOK_PRE_ORDER_JSPAY = BASE_URL + "/api/game_order/tiktok/jsapi/create",
    TIKTOK_PRE_ORDER_IOS_PAY2 = BASE_URL + "/api/game_order/tiktok/ios_tiktok_pay/create",
    TIKTOK_PAY_BALANCE = BASE_URL + "/api/game_order/tiktok/default/pay_balance",

    QQ_PRE_ORDER_MIDAS = BASE_URL + "/api/game_order/qq/midas/create",
    QQ_PRE_ORDER_JSPAY = BASE_URL + "/api/game_order/qq/jsapi/create",

    OPPO_PRE_ORDER = BASE_URL + "/api/game_order/oppo/default/create",

    VIVO_PRE_ORDER = BASE_URL + "/api/game_order/vivo/default/create",

    HUAWEI_PRE_ORDER = BASE_URL + "/api/game_order/huawei/default/create",

    KS_PRE_ORDER = BASE_URL + "/api/game_order/kuaishou/create",
    KS_PAY_BALANCE = BASE_URL + "/api/game_order/kuaishou/pay_balance",
    KS_TASK_UPLOAD = BASE_URL + "/api/game_user/kuaishou/task_upload",

    BL_PRE_ORDER = BASE_URL + "/api/game_order/bilibili/create",
    BL_PRE_ORDER_V2 = BASE_URL + "/api/game_order/bilibili/create_v2",
    BL_PAY_BALANCE = BASE_URL + "/api/game_order/bilibili/pay_balance",
    BL_PRE_ORDER_JSPAY = BASE_URL + "/api/game_order/bilibili/jsapi/create",

    ZFB_PRE_ORDER = BASE_URL + "/api/game_order/alipay/default/create",
    ZFB_PAY_BALANCE = BASE_URL + "/api/game_order/alipay/default/pay_balance",

    GET_ARCHIVE = BASE_URL + "/api/game_user/get_game_archive",
    SYNC_ARCHIVE = BASE_URL + "/api/game_user/sync_game_archive",
    CLEAR_ARCHIVE = BASE_URL + "/api/game_user/game_archive_clear_done",

    UPLOAD_USER_RANK_DATA = BASE_URL + "/api/game_user_rank/upload_score",
    GET_RANK_DATA = BASE_URL + "/api/game_user_rank/get_rank",

    UPLOAD_USER_RANK_DATA_V2 = BASE_URL + "/api/game_user_rank/upload_score_v2",
    GET_RANK_DATA_V2 = BASE_URL + "/api/game_user_rank/get_rank_v2",

    NOT_CONSUME_LIST = BASE_URL + "/api/game_order/list_with_not_consume",
    CONSUME_ORDER = BASE_URL + "/api/game_order/consume",
    CONSUME_ORDER_BATCH = BASE_URL + "/api/game_order/consume_batch",
    PAYMENT_STATUS = BASE_URL + "/api/game_order/check_order_payment_status",
    GET_PRODUCT_INFO = BASE_URL + "/api/game_order/get_product_info",
    GIFT_EXCHANGE = BASE_URL + "/api/game_user/gift_exchange",

}

export enum RequestUrlOvs {
    SIGN_IN_URL = BASE_URL_OVS + "/api/game_user/sign_in",
    GAME_CONTENT = BASE_URL_OVS + "/api/game_content/config",
    GAME_JSON = BASE_URL_OVS + "/api/game_json/config",
    INIT_CONTENT = BASE_URL_OVS + "/api/game_content/init",

    UPLOAD_SHARE_TASK = BASE_URL_OVS + "/api/game_user/shard_task/upload",
    GET_SHARE_TASK_DETAIL = BASE_URL_OVS + "/api/game_user/shard_task/detail",

    KS_PRE_ORDER = BASE_URL_OVS + "/api/game_order/kuaishou_overseas/create",
    KS_PAY_BALANCE = BASE_URL_OVS + "/api/game_order/kuaishou_overseas/pay_balance",

    GET_ARCHIVE = BASE_URL_OVS + "/api/game_user/get_game_archive",
    SYNC_ARCHIVE = BASE_URL_OVS + "/api/game_user/sync_game_archive",
    CLEAR_ARCHIVE = BASE_URL_OVS + "/api/game_user/game_archive_clear_done",

    UPLOAD_USER_RANK_DATA = BASE_URL_OVS + "/api/game_user_rank/upload_score",
    GET_RANK_DATA = BASE_URL_OVS + "/api/game_user_rank/get_rank",

    UPLOAD_USER_RANK_DATA_V2 = BASE_URL_OVS + "/api/game_user_rank/upload_score_v2",
    GET_RANK_DATA_V2 = BASE_URL_OVS + "/api/game_user_rank/get_rank_v2",

    NOT_CONSUME_LIST = BASE_URL_OVS + "/api/game_order/list_with_not_consume",
    CONSUME_ORDER = BASE_URL_OVS + "/api/game_order/consume",
    CONSUME_ORDER_BATCH = BASE_URL_OVS + "/api/game_order/consume_batch",
    PAYMENT_STATUS = BASE_URL_OVS + "/api/game_order/check_order_payment_status",
    GET_PRODUCT_INFO = BASE_URL_OVS + "/api/game_order/get_product_info",
    GIFT_EXCHANGE = BASE_URL_OVS + "/api/game_user/gift_exchange",

}

export enum ContentType {
    APPLICATION_JSON = "application/json",
    APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded",
}

export enum CallbackMsg {
    USER_NOT_LOGIN = "用户未登录，正在尝试重新登录",
    PAY_SWITCH_NOT_ENABLE = "支付总开关未开启或支付配置未设置",
    NOT_SUPPORT_IAP = "当前华为账号所在国家/地区不支持IAP支付",
    PRODUCT_ID_NOT_SAME = "商品校验失败,请检查华为后台配置的商品ID与当前商品ID是否一致",
    ORDER_NOT_FOUND = "支付公钥未下发或不存在该订单",
}

export enum InitSdkPhasesEnum {
    channelLoginSuccess = "渠道登录成功",
    channelLoginFail = "渠道登录失败",
    serverLoginSuccess = "服务端登录成功",
    serverLoginFail = "服务端登录失败",
    getAdParamsSuccess = "获取广告参数成功",
    getAdParamsFail = "获取广告参数失败",
    createAdFail = "创建广告失败",
    startCreateAd = "开始创建广告",
    createAd = "正在创建广告",
    createAdFinish = "创建广告完成",
}

export enum IntersPhasesEnum {
    intersNotLoad = "插屏广告未加载成功，请先调用getIntersFlag判断",
    intersShowFail = "插屏展示失败",
    intersClose = "插屏关闭",
    intersIsShowing = "插屏正在展示",
}

export enum VideoPhasesEnum {
    videoNotLoad = "视频广告未加载成功，请先调用getVideoFlag判断",
    videoPlayFinish = "视频广告播放完成",
    videoPlayBreak = "视频广告播放中断",
}

export enum PayPhasesEnum {
    payError = "支付错误",
    orderPayFinish = "订单支付完成",
    orderPayFail = "订单支付失败",
    preOrderFail = "预下单失败",
}