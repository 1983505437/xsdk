/*
 * IXSdk 接口调用类
 * 文档地址xxx
 * @Author: Vae 
 * @Date: 2023-10-08 15:50:19 
 * @Last Modified by: Vae
 * @Last Modified time: 2025-04-27 15:57:32
 */
export default interface IXSdk {

    initSDK(params?: object, callback?: (phases: string, res: object) => void): void;

    setOnResultListener(callback: (code: number, res: string) => void): void;

    getUserInfo(callback: (userInfo: { ret: boolean, userInfo: object }) => void): void;

    showBanner(params?: object, callback?: (phases: string, res: object) => void): void;
    hideBanner(): void;

    getIntersFlag(): boolean;
    showInters(params?: object, callback?: (phases: string, res: object) => void): void;

    getVideoFlag(): boolean;
    showVideo(params: object, callback: (phases: string, res: object) => void): void;

    getNativeIconFlag(): boolean;
    showNativeIcon(params: object, callback?: (phases: string, res: object) => void): void;
    hideNativeIcon(): void;

    getNativeIconFlag2(): boolean;
    showNativeIcon2(params: object, callback?: (phases: string, res: object) => void): void;
    hideNativeIcon2(): void;

    getBlockFlag(): boolean;
    showBlock(params?: object, callback?: (phases: string, res: object) => void): void;
    hideBlock(): void;

    phoneVibrate(type: string): void;

    shareApp(): void;

    setPaySuccessListener(callback: (res: object[]) => void): void;
    pay(params: object, callback: (phases: string, res: object) => void): void;
    orderComplete(orderNo: string): void;
    giftExchange(exchangeCode: string, callback: (phases: string, res: object) => void): void;

    setArchive(params: object, callback: (phases: string, res: object) => void): void;
    getArchive(params: object, callback: (phases: string, res: object) => void): void;
    clearArchive(): void;

    onClickPrivacyAgreementBtn(): void;
    onClickUserAgreementBtn(): void;

    reportEvent(eventName: string, eventParams: object, level: number): void;
    reportTaEvent(type: number): void;

    getRankData(params: object, callback: (phases: string, res: object) => void): void;
    uploadUserRankData(params: object, callback: (phases: string, res: object) => void): void;

    getRawDataSignature(params: object, callback: (phases: string, res: object) => void): void;
    decryptionData(params: object, callback: (phases: string, res: object) => void): void;

    getGameJson(params: object, callback: (phases: string, res: object) => void): void;

    uploadShareTask(params: object, callback: (phases: string, res: object) => void): void;
    getShareTaskDetail(params: object, callback: (phases: string, res: object) => void): void;

    isNextVideoFitShare(): boolean;

    getRewardBoxFlag(): boolean;
    showRewardBox(params: object, callback: (phases: string, res: object) => void): void;

    getVideoCLFlag(): boolean;

    getABInfoByName(name: string): object;

    getAdSwitchByKey(key: string): boolean;

    createToShowAd(params: object, callback: (phases: string, res: object) => void): void;

    isSupportSidebar(callback: (isSupport: boolean) => void): void;
    gotoSidebar(): void;
    intoGameFromSidebar(callback: (isFromSidebar: boolean) => void): void;

    isSupportAddDesktop(callback: (isSupport: boolean) => void): void;
    addDesktop(callback: (isSuccess: boolean) => void): void;

    startGameVideo(duration: number): void;
    pauseGameVideo(): void;
    resumeGameVideo(): void;
    stopGameVideo(callback: (videoPath: string) => void): void;
    shareGameVideo(title: string, desc: string, topics: string, videoPath: string, callback: (isSuccess: boolean) => void): void;

    shareToGameClub(type: number, path: string, mouldId?: string, callback?: (isSuccess: boolean) => void): void
    jumpToGameClub(callback?: (phases: string, res: object) => void): void;

    setImRankData(params: object, callback: (phases: string, res: object) => void): void;
    getImRankData(params: object, callback: (phases: string, res: object) => void): void;
    getImRankList(params: object, callback: (phases: string, res: object) => void): void;

    reportKSGameEvent(eventType: string, eventValue: number, callback: (phases: string, res: object) => void): void;

    setUserProperty(params: object): void;

    getChannelId(): number;

    gotoOppoGameCenter(): void;
}