import ENLang from '../languages/en.json';
import RULang from '../languages/ru.json';
import { getUserData } from './utils.ts';

export enum LangType {
    DEV = 'dev',
    EN = 'en',
    RU = 'ru'
}

export interface ILang {
    [key: string]: string | string[] | string[][] | ILang;
}

const appLangSources: ILang = {
    [LangType.EN]: ENLang as ILang,
    [LangType.RU]: RULang as ILang
};

const isObject = (item: ILang): boolean => {
    return typeof item === 'object' && !Array.isArray(item);
};

const mergeDeep = (target: ILang, ...sources: ILang[]): Object => {
    if (!sources.length) return target;

    const source = sources.shift() as ILang;

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key] as ILang)) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }

                mergeDeep(target[key] as ILang, source[key] as ILang);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
};

export const getAppLangCode = (): LangType => {
    const user = getUserData();
    if (user) {
        if (user.languageCode === LangType.RU) {
            return LangType.RU;
        }

        return LangType.EN;
    }

    if (navigator.language.includes(LangType.RU)) {
        return LangType.RU;
    }

    return LangType.EN;
};
const appLanguages = [LangType.EN, LangType.RU];

for (const appLang of appLanguages) {
    appLangSources[appLang] = mergeDeep(
        {},
        appLangSources[LangType.EN] as ILang,
        appLangSources[appLang] as ILang
    ) as ILang;
}

const findLevel = (path: string): null | ILang => {
    const lang = appLangSources[getAppLangCode()];

    try {
        const levels = path.split('.');
        let found = lang;

        for (const level of levels) {
            if (!found) {
                return null;
            }

            // @ts-ignore
            found = found[level] as ILang;
        }

        return found as ILang;
    } catch (error) {
        console.error(`Lang error for path: ${path}`, error);
    }

    return null;
};

export const t = (path: string): string => {
    const found = findLevel(path);

    if (!found) {
        return path;
    }

    return found.toString();
};

export const td = (path: string): string[] => {
    const found = findLevel(path);

    if (!found || !Array.isArray(found)) {
        return [path, path, path];
    }

    return found as string[];
};

export const to = <T>(path: string): T => {
    const found = findLevel(path);

    if (!found) {
        return {} as T;
    }

    return found as T;
};
