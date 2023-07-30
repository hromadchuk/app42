import DEVLang from '../languages/dev.json';
import ENLang from '../languages/en.json';

export enum LangType {
    DEV = 'dev',
    EN = 'en'
}

export interface ILang {
    [key: string]: string | string[] | ILang;
}

const appLangSources: ILang = {
    [LangType.DEV]: DEVLang as ILang,
    [LangType.EN]: ENLang as ILang
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
    // language detection code

    return LangType.EN;
};
const appLanguages = [LangType.EN];

for (const appLang of appLanguages) {
    appLangSources[appLang] = mergeDeep(
        {},
        appLangSources[LangType.DEV] as ILang,
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
