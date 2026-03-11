export default class StringUtil {

    static containSpace(str: string): boolean {
        if (!str) return true;
        let num: number = str.indexOf(" ");
        if (num != -1) return true;
        return false;
    }

    static stringToArray(str: string): [] {
        if (!str) return [];
        return JSON.parse(str);
    }

}