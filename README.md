## xsdk 模块说明

### 1. 模块整体定位

本目录（在项目中通常对应 `assets/xsdk/`）是一个 **多平台小游戏统一 SDK 封装**，对接微信 / 抖音 / 快手 / QQ / OPPO / VIVO / 华为 / 支付宝 / 鸿蒙 / 海外渠道等，实现：

- **广告**：激励视频、插屏、Banner、原生格子、多格子、激励盒子等
- **账号登录 / 用户信息**：平台登录 + 自有后台登录打通
- **支付与订单**：预下单、支付回调、订单完成上报
- **分享与录屏**：普通分享、录屏分享、分享任务、游戏圈分享等
- **存档 / 排行 / 事件上报 / AB 实验 / 快手事件上报**
- **安卓本地 SDK 能力**（如渠道 ID、OPPO 游戏中心、震动等）

业务层优先通过 **`XSdk` 单例** 访问能力，不直接依赖具体平台 API。

---

### 2. 目录结构概览

- `first.fire`  
  - 一个前置场景，用来在游戏正式进入前初始化 xsdk、展示隐私弹窗等。

- `scripts/XSdk.ts`  
  - **业务主入口**，对外提供统一的 SDK API，典型用法：
    - `XSdk.getInstance().initSDK(...)`
    - `XSdk.getInstance().showVideo(...)`
    - `XSdk.getInstance().showBanner() / showInters() / phoneVibrate()` 等。

- `scripts/SdkCenter.ts`  
  - **渠道分发中心**：根据 `SdkConfig` 中的 `gameChannelCodeNo`，创建对应渠道实现：
    - `WeixinSdk`（微信）、`TiktokSdk`（抖音）、`KSSdk`（快手）、`QqSdk`、`OppoSdk`、`VivoSdk`、`HuaweiSdk`、
      `BilibliSdk`、`ZfbSdk`、`LightAndroidSdk`（安卓）、`HarmonySdk`（鸿蒙）、`KSSdkOversea`、`TiktokSdkOversea`、`TestSdk` 等。
  - 内部持有 `delegate: IXSdk`，XSdk 的所有方法最终都委托到这里。
  - **渠道号规则（以当前实现为准）**：取 `gameChannelCodeNo` 的 **后三位** 作为渠道标识进行分发，例如：
    - `142` OPPO、`108` VIVO、`154` 抖音、`155` QQ、`161` 微信、`163` 华为、`164` 快手、`165` bilibili、`166` 支付宝
    - `300` 海外快手、`301` 海外抖音、`666` 安卓、`668` 鸿蒙

- `scripts/IXSdk.ts`  
  - **统一接口定义**，约束所有渠道 SDK 必须实现的函数（广告 / 支付 / 分享 / 存档等）。
  - 便于扩展新渠道时拥有同一套 API。

- `scripts/channel/*.ts`  
  - 各平台 **具体实现**，封装原生 / JSBridge / 平台 SDK：
    - 如 `WeixinSdk.ts`、`TiktokSdk.ts`、`KSSdk.ts`、`VivoSdk.ts`、`OppoSdk.ts`、`HuaweiSdk.ts`、
      `BilibliSdk.ts`、`ZfbSdk.ts`、`QqSdk.ts`、`LightAndroidSdk.ts`、`HarmonySdk.ts` 等。
  - 内部直接使用 `wx / tt / ks / qg / my / bl / hbs` 等平台 API 和自家后台接口。

- `scripts/utils/*.ts`  
  - 通用工具：
    - `EngineUtils.ts`：UI 提示 / 资源加载等通用方法
    - `HttpRequest.ts`：HTTP 请求封装
    - `LocalStorage.ts`：本地存储封装
    - `Enums.ts`：常量、TAG 等
    - `PrivacyAgreement.ts`：隐私/用户协议弹窗与流程（`agreePrivacy` 阶段回调由此触发）
    - `RewardBox.ts`：**激励盒子 UI 与逻辑**（内部分步播放激励视频 / 插屏）。

- `scripts/else/myData.ts`  
  - 配置参数：各渠道 `params_xxx`、公司代号、概率配置、翻译语言、是否合集（`isHJ`）等。

- `scripts/else/myJs.ts`  
  - 挂在场景节点上的组件，通过节点名驱动不同功能：
    - `first`：前置场景初始化 xsdk
    - `btn_more` / `btn_yszc` / `btn_yhxy` / `btn_ysxy` / `rzAndJkzg` / `rewardBox` / `loadTips` 等。
  - 内部会调用 `xsdk`（`XSdk.getInstance()`）以及 `myAD`（广告快捷封装）。

- `scripts/else/myAD.ts`  
  - **广告快捷封装**：
    - `myAD.showVideo(success, fail, break?)`：统一激励视频调用
    - `myAD.showBannerAndInters(target?)`：Banner + 插屏混合调用 + CD 控制
    - `myAD.shake(type)`：震动
    - 桌面 / 侧边栏相关封装：`isSupportAddDesktop`、`addDeskTop`、`intoGameFromSidebar`、`gotoSideBar`。
  - 在「合集模式」下走 `iframeSDK`，否则走 xsdk 原生实现。

- `iframeSDK/iframeSDK.ts`  
  - 针对某些 **网页合集 / iframe 宿主** 的适配，通过 `window.cymcc` 调用宿主方的 `showVideo / showInters / showBanner / phoneVibrate / showOPPOMoreGame / getChannelId` 等。

- `language/*`  
  - 文本多语言支持：`MyLanguageManager.ts`、`MyLanguageTranslate.ts`，配合 `myJs.config()` 加载翻译资源。

- `addDeskAndSideBar/*`  
  - 添加桌面、侧边栏相关的 UI 资源和脚本（如 `addSideBarView.ts`、相关 prefab / 图片）。

- `res/*`、`prefabs/*`  
  - xsdk 需要的图片资源、预制体，如隐私弹窗、概率公示、激励盒子等 UI。

- `scripts/plugins/*`
  - 第三方统计/AB 等插件脚本与声明（例如 `gravityengine...min.js`、`abetterchoice...min.js` 及其 `.d.ts`）。

---

### 3. 初始化流程（建议接入方式）

1. **前置场景 (`first.fire`)：**
   - 挂载 `myJs` 组件，节点名为 `first`。
   - `myJs.first()` 里会：
     - 调用 `checkPlat()` 判断当前平台（微信 / 抖音 / OPPO / VIVO / 华为 / 安卓 / 鸿蒙 / 海外渠道等）；
     - 准备好当前渠道参数 `curParam`（来自 `myData`）；
     - 按语言设置加载翻译资源（非 `zh` 时会 `LoadLanguageRes`）；
     - 在合适的延时后，执行：
       - 合集模式：当 `isHJ && cc.sys.isBrowser && cc.sys.isMobile` 时先 `iframeSDK.init()`；
       - 正式初始化：实际调用的是 `myAD.initSDK(curParam, (phases, res) => { ... })`（内部仍委托到 `XSdk.initSDK`）。
   - 当隐私协议被同意时（`phases == "agreePrivacy"`），会 `cc.director.loadScene(nextScene)` 进入游戏主场景。

2. **游戏运行中：**
   - 其它场景和脚本中，可随时通过：
     - `import XSdk from "xsdk/scripts/XSdk";`
     - `const sdk = XSdk.getInstance();`
     - 调用统一 API（见下面常用接口）。

---

### 4. 常用接口速查（业务侧优先使用）

以下方法均来自 `XSdk.getInstance()`，参数 `callback(phases, res)` 一般用于区分不同阶段（加载成功 / 播放完成 / 中断等）：

- **初始化 / 用户**
  - `initSDK(params?, callback?)`：初始化 SDK，`params` 内包含渠道号 `gameChannelCodeNo`、版本号、公司、分组等信息。
  - `getUserInfo(callback)`：获取用户信息（含 userId 等）。
  - `setOnResultListener(callback)`：安卓侧 `onActivityResult` 结果监听（常见 `code`：105 创建订单成功、106 创建订单失败；`res` 是字符串 JSON，需 `try/catch JSON.parse`）。
  - `forceLogin(...)`：**当前版本不建议依赖**（历史遗留接口，未打通统一“强制重新登录”流程；如需重登请按渠道策略重新走登录/初始化流程）。

- **广告相关**
  - Banner：
    - `showBanner(params?, callback?)`
    - `hideBanner()`
  - 插屏：
    - `getIntersFlag(): boolean`：是否可展示
    - `showInters(params?, callback?)`：回调 `phases` 中包含 `intersClose` 等。
  - 激励视频：
    - `getVideoFlag(): boolean`：是否可播放激励
    - `showVideo(params, callback)`：`phases` 中一般有 `videoPlayFinish` / `videoPlayBreak` 等。
  - 频控判断：
    - `getVideoCLFlag(): boolean`：判断“本次点击操作是否可触发激励视频”（用于按钮级别的触发控制）。
  - 原生格子广告（微信等）：
    - `getNativeIconFlag()` / `showNativeIcon(params, callback?)` / `hideNativeIcon()`
    - `getNativeIconFlag2()` / `showNativeIcon2(...)` / `hideNativeIcon2()`
  - 原生多格子：
    - `getBlockFlag()` / `showBlock(params?, callback?)` / `hideBlock()`
  - 激励盒子：
    - `getRewardBoxFlag()` / `showRewardBox(params, callback)`
  - 组合广告（vivo 等）：
    - `createToShowAd(params, callback)`：例如在 `myJs.showBannerAndInters()` 中用来一键创建 + 展示广告。

- **震动 / 桌面 / 侧边栏**
  - `phoneVibrate(type: "short" | "long")`
  - `isSupportAddDesktop(callback)` / `addDesktop(callback)`
  - `isSupportSidebar(callback)` / `gotoSidebar()` / `intoGameFromSidebar(callback)`
  - 安卓 OPPO：
    - `gotoOppoGameCenter()`
  - 隐私/协议按钮（由 `PrivacyAgreement` 处理具体展示/跳转）：
    - `onClickPrivacyAgreementBtn()`
    - `onClickUserAgreementBtn()`

- **支付 / 订单**
  - `setPaySuccessListener(callback: (res: object[]) => void)`
  - `pay(params, callback)`
  - `orderComplete(orderNo)`
  - `giftExchange(exchangeCode, callback)`

- **存档**
  - `getArchive(params, callback)`
  - `setArchive(params, callback)`
  - `clearArchive()`

- **事件 / AB 实验 / 分享任务等**
  - 事件上报：
    - `reportEvent(eventName, eventParams, level?)`
    - `reportTaEvent(type)`（腾讯广告归因，微信用）
    - `reportKSGameEvent(eventType, eventValue, callback)`（快手专用）
  - 排行与榜单：
    - `getRankData(params, callback)`
    - `uploadUserRankData(params, callback)`
    - 抖音官方榜：
      - `setImRankData(params, callback)`
      - `getImRankData(params, callback)`
      - `getImRankList(params, callback)`
  - 分享任务：
    - `uploadShareTask(params, callback)`
    - `getShareTaskDetail(params, callback)`
    - `isNextVideoFitShare()`：下一次激励是否更适合走分享。
  - AB 实验 / 广告开关：
    - `getABInfoByName(name)`：获取 AB 实验配置
    - `getAdSwitchByKey(key)`：按 key 获取广告开关

- **分享与录屏**
  - 普通分享：
    - `shareApp()`：拉起平台分享面板（微信/抖音/快手等由具体渠道 SDK 实现）。
  - 录屏（抖音/快手支持）：
    - `startGameVideo(durationSec)`
    - `pauseGameVideo()` / `resumeGameVideo()` / `stopGameVideo(callback(videoPath))`
    - `shareGameVideo(title, desc, topics, videoPathOrId, callback(isSuccess))`
    - `shareToGameClub(type, path, mouldId?, callback?)`：分享图片/录屏到游戏圈。
    - `jumpToGameClub(callback?)`：跳转游戏圈。

- **游戏配置 / rawData / 解密**
  - `getGameJson(params, callback)`：获取游戏配置 JSON。
  - 微信 rawData 相关：
    - `getRawDataSignature(params, callback)`
    - `decryptionData(params, callback)`

- **渠道与用户属性**
  - `setUserProperty(params)`：上报用户属性。
  - `getChannelId(): number`：渠道 ID（合集模式会通过 `iframeSDK.getChannelId()` 获取）。

---

### 5. 项目中典型用法示例（思路）

> 以下为使用思路说明，具体接入时可按你业务实际调整脚本。

- **在前置场景初始化：**
  - 在一个仅包含 `xsdk/first.fire` 的场景中挂 `myJs`（节点名为 `first`），作为游戏启动后第一个场景。
  - 初始化完成、隐私同意后自动跳转到原来的主场景（例如 `Lobby`）。

- **用 xsdk 替换旧广告调用：**
  - 旧项目中直接使用 `window.tt.createRewardedVideoAd` / `window.wx.createRewardedVideoAd` 的地方，逐步替换为：
    - `XSdk.getInstance().getVideoFlag()` + `showVideo({}, callback)`。
  - 或者在 UI 层统一走 `myAD.showVideo(...)` / `myAD.showBannerAndInters(...)`，减少重复代码。

- **渐进迁移：**
  - 可以先保留旧的 `WXAPI.ts` / `TTAPI.ts`，在内部逐步改为调用 xsdk，再移除老 `_plugs/sdk.min.js` 等依赖。

---

### 6. 开发与扩展建议

- **新增渠道：**
  - 在 `scripts/channel/` 新增一个 `XXXsdk.ts`，实现 `IXSdk` 接口；
  - 在 `SdkCenter.initSDK` 的 `switch(channelId)` 中增加对应 case；
  - 在 `SdkConfig` 中配置新的 `gameChannelCodeNo`。

- **调试建议：**
  - 浏览器环境下，某些能力（激励视频 / 震动等）会被直接放行或打印日志，方便联调：
    - 如 `XSdk.getInstance().getVideoFlag()` 在浏览器中强制返回 `true`；
    - `myAD.showVideo` 会在浏览器中直接调用成功回调并打印提示文本。

---

### 7. 常见 phases（回调阶段值）速查

以下为代码中实际使用/定义过的常见 `phases`（不同渠道实现可能增减）：

- **初始化（`initSDK`）**：`channelLoginSuccess` / `channelLoginFail` / `serverLoginSuccess` / `serverLoginFail` / `getAdParamsSuccess` / `getAdParamsFail` / `createAdFinish` …
- **插屏（`showInters`）**：`intersClose`（关闭）/ `intersShowFail` / `intersNotLoad` …
- **激励视频（`showVideo`）**：`videoPlayFinish`（完成）/ `videoPlayBreak`（中断）/ `videoNotLoad` …
- **激励盒子（`showRewardBox`）**：`showRewardBoxFinish`

如你后续需要“用 xsdk 全面替换旧 WXAPI/TTAPI 调用”，可以基于本说明逐个功能点（激励、插屏、支付、分享等）做映射，我也可以按模块帮你改好具体脚本。 

