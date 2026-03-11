
export default class LocalStorage {

    /**
     * 保存字符串数据
     */
    static setStringData(key: string, value: string): void {
        if (key == "" || value == "") return;
        if (typeof value != "string") value = JSON.stringify(value);
        // @ts-ignore
        cc.sys.localStorage.setItem(key, value);
    }
    /**
     * 获取字符串数据
     */
    static getStringData(key: string): string {
        // @ts-ignore
        let value = cc.sys.localStorage.getItem(key);
        if (value == "" || value == undefined || value == null) value = "";
        return value;
    }

    /**
     * 保存对象数据
     */
    static setJsonData(key: string, value: object): void {
        if (!key || !value) return;
        // @ts-ignore
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    }
    /**
     * 获取对象数据
     */
    static getJsonData(key: string): object {
        // @ts-ignore
        let value: string = cc.sys.localStorage.getItem(key);
        if (!value) return null;
        return JSON.parse(value);
    }
}