import { getAppLangCode, LangType } from './lang.ts';

export function getStaticUrl() {
    return 'https://gromadchuk.github.io/kit-42/';
}

export function getManifestUrl() {
    const staticUrl = getStaticUrl();
    const manifestFile = 'tonconnect-manifest.json';

    return staticUrl + manifestFile;
}

export function getModalLang() {
    const appLang = getAppLangCode();

    if (appLang === LangType.RU) {
        return LangType.RU;
    }

    return LangType.EN;
}

export function getShortAddress(address: string) {
    const slicePart = address.slice(5, -5);

    return address.replace(slicePart, '...');
}
