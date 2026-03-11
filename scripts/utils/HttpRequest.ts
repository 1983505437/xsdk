import { RequestUrl, TAG } from "./Enums";
import LocalStorage from "./LocalStorage";

export default class HttpRequest {
    /**
     * 单例对象
     */
    private static instance: HttpRequest;

    /**
     * 私有构造方法 不允许在子类和外部实例化对象（new一下）
     */
    private constructor() {
    }

    /** 使用 🎈：用懒加载形式实现单例模式 */
    // 前面加个static，变成静态方法，可以直接通过类来调用该方法
    static getInstance() {
        // 判断当前单例是否产生
        // 懒加载：需要用到对象时，再实例化对象
        if (!HttpRequest.instance) {
            // 实例化对象 new一下
            HttpRequest.instance = new HttpRequest();
        }
        return HttpRequest.instance;
    }

    public request(url: string, requestFunction: string, requestHeaders: object, data: object, callback: (ret: boolean, res: object) => void): void {
        let done = false;
        let hasRequest: boolean = false;
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = () => {
            if (httpRequest.readyState === 4 && httpRequest.status === 200) {
                if (hasRequest) return;
                hasRequest = true;
                let res = JSON.parse(httpRequest.responseText);
                console.log(TAG, "response:", httpRequest.responseText);
                if (res && res["succeed"]) {
                    if (!done) {
                        done = true;
                        callback(true, res);
                    }
                } else {
                    if (!done) {
                        done = true;
                        callback(false, res);
                    }
                }
            }
        }
        httpRequest.timeout = 3000;
        httpRequest.ontimeout = () => {
            console.log(TAG, "请求超时:", url);
            if (!done) {
                done = true;
                callback(false, {});
            }
        }
        httpRequest.onerror = (e) => {
            console.log(TAG, "request error", JSON.stringify(e));
            if (!done) {
                done = true;
                callback(false, {});
            }
        }
        if (requestFunction == "GET" && data) {
            // 下发广告接口 预上线功能
            if (url == RequestUrl.GAME_CONTENT && LocalStorage.getStringData("versionName") != "") {
                data["version"] = LocalStorage.getStringData("versionName");
            }
            let keys = Object.keys(data);
            url += "?"
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i];
                url += `${i == 0 ? "" : "&"}${key}=${data[key]}`
            }
        }
        httpRequest.open(requestFunction, url, true);
        for (const key in requestHeaders) {
            httpRequest.setRequestHeader(key, requestHeaders[key]);
        }

        if (requestFunction == "GET") {
            httpRequest.send();
        } else {
            httpRequest.send(JSON.stringify(data));
        }
    }

}