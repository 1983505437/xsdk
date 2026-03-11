
const { ccclass, property } = cc._decorator;

@ccclass
export default class LanguageManager {

  private static instance: LanguageManager
  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) LanguageManager.instance = new LanguageManager();
    return LanguageManager.instance;
  }
  /**语言配置表 */
  LanguageListJson: any = null;
  /**整个bundle */
  LnanguageBundle: any = null;
  /**资源文件夹 */
  LanguageFolder: any = null
  /**文件加载完成标志 */
  initOK: boolean = false;

  /**正在初始化 */
  isInit: boolean = false;

  curLanguage: string = "zh"
  /**加载翻译json */
  LoadLanguageJson(){
    return new Promise((resolve,reject)=>{
    console.log("加载翻译资源-json")
    cc.assetManager.loadBundle("languageRes",(err,bundle)=>{
      if(err) {
        console.log("加载语言资源包失败", err);
        reject(err);
      }
      else{
        bundle.load("language",(err,data)=>{
          if(err) {
            console.log("加载语言资源失败", err);
            reject(err);
          }
          else{
            //this.LanguageListJson = data.json;
            console.log("json翻译资源加载成功");
            resolve(data.json)
          }
        })
      }
    })
    });
  }
  /**加载翻译资源 */
  async LoadLanguageRes(finishCallback) {
    this.LanguageListJson = await this.LoadLanguageJson();
    console.log("加载翻译资源-spr",this.LanguageListJson.length)
    this.isInit = true;
    for (let i = 0; i < this.LanguageListJson.length; i++) {
      if (this.LanguageListJson[i].shorthand === LanguageManager.getInstance().curLanguage) {
        let languageName = this.LanguageListJson[i].Name
        cc.assetManager.loadBundle("languageRes", (err, bundle) => {
          this.LnanguageBundle = bundle;
          if (err) console.log("加载翻译资源失败", err)
          else {
            bundle.loadDir(languageName, (err, assets) => {
              if(err) console.log("加载spr翻译资源失败",err)
              else{
                this.LanguageFolder = assets;
                console.log(languageName + "文件夹加载成功!");
                finishCallback();
              }
            });
          }
        });
      }else console.log(`不是${LanguageManager.getInstance().curLanguage}不加载->`,this.LanguageListJson[i].shorthand);   
    }
  };
  /**翻译字符串中的部分内容 */
  getLanguageStr2(str){
    if (LanguageManager.getInstance().curLanguage == "zh") return str;
    for(let i=0;i<this.LanguageListJson.length;i++){
      if(this.LanguageListJson[i].shorthand === this.curLanguage){
          return this.translateText(str,this.LanguageListJson[i])
      }
    }
  }
 translateText(text, languageArr) {
    let result = '';
    let i = 0;
    while (i < text.length) {
        let found = false;
        // 从当前位置开始，尝试匹配最长的可翻译词
        for (let j = text.length; j > i; j--) {
            const substring = text.substring(i, j);
            if (languageArr[substring]) {
                // 找到匹配，添加翻译结果
                result += languageArr[substring]//+"\n";
                i = j; // 跳过已翻译的部分
                found = true;
                break;
            }
        }
        if (!found) {
            // 没有找到匹配，保留原字符
            result += text[i];
            i++;
        }
    }
    //console.log(result);
    return result;
}



  /**获取字符串翻译 */
  getLanguageStr(resName: string) {
    //console.log("===>",DataManager.getInstance().Language)
    if (LanguageManager.getInstance().curLanguage == "zh") return resName;
    let res: string = resName
    for (let i = 0; i < this.LanguageListJson.length; i++) {
      if (this.LanguageListJson[i].shorthand === this.curLanguage) {
        res = this.LanguageListJson[i][resName]
      }
    }
    if(!res)  console.log("缺少翻译数据->",resName);
    return res
  }

  /**获取图片资源 */
  getLanguageSpr(resName: string) {
    let res: any = null
    // for (let i = 0; i < this.LanguageListJson.length; i++) {
    //   if (this.LanguageListJson[i].shorthand === "en") {
        res = this.LanguageFolder.find((data) => {
          return data.name == resName
        })
      //   if (res) break;
      // }
    // }
    return res
  }
  /**获取spine资源 */
  getLanguageStoken(resName: string) {
    let res: any = null
    // for (let i = 0; i < this.LanguageListJson.length; i++) {
    //   if (this.LanguageListJson[i].shorthand === "en") {
        res = this.LanguageFolder.find((data) => {
          if (data.name == resName) {
            let skeletonJson = data.skeletonJson;
            if (skeletonJson) return data;
          }
        })
      //   if (res) break;
      // }
    // }
    return res
  }

  /**获取资源翻译 */
  getLanguageAudio(resName: string) {
    let res: any = null
    res = this.LanguageFolder.find((data) => { return data.name == resName })
    return res
  }
}
