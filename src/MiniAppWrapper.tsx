import { lazy, useEffect, useState } from 'react';
import { bindThemeParamsCSSVars, initThemeParams, useCloudStorage, useViewport } from '@telegram-apps/sdk-react';
import { TelegramClient } from 'telegram';
import { LogLevel } from 'telegram/extensions/Logger';
import { StringSession } from 'telegram/sessions';
import { SuspenseLoader } from './components/SuspenseLoader.tsx';
import { Constants } from './constants.ts';
import { useAsyncEffect } from './hooks/useAsyncEffect.ts';
import { getCache } from './lib/cache.ts';
import { getAppLangCode } from './lib/lang.ts';
import { decodeString, getParams, getStorageHash, hexToRgba, isDev, wrapCallMAMethod } from './lib/utils.ts';

const AppWrapper = lazy(() => import('./App.tsx'));

type BackgroundPlatforms =
    | 'android'
    | 'android_x'
    | 'ios'
    | 'macos'
    | 'tdesktop'
    | 'unigram'
    | 'unknown'
    | 'web'
    | 'weba';

const alphaColors = new Map<string, number>([
    ['--tg-theme-bg-color', 0.4],
    ['--tg-theme-header-bg-color', 0.4],
    ['--tg-theme-hint-color', 0.2]
]);

try {
    bindThemeParamsCSSVars(initThemeParams()[0]);
} catch (error) {
    console.error('initThemeParams error', error);

    if (isDev) {
        location.reload();
    }
}

export function MiniAppWrapper() {
    const viewport = useViewport();
    const storage = useCloudStorage();

    const [hasInitData, setInitData] = useState<boolean>(false);

    useEffect(() => {
        const htmlElement = document.documentElement;
        const styleString = htmlElement.getAttribute('style') as string;
        const regExp = '(--[\\w-]+)\\s*:\\s*([^;]+)';
        const initColors = (styleString.match(new RegExp(regExp, 'g')) || []).map((color) => {
            const [key, value] = color.split(':');

            return { key, value: value.trim() };
        });

        for (const { key, value } of initColors) {
            if (key.startsWith('--tg') && key.includes('background') && key.endsWith('-color')) {
                const fixName = key.replace('background', 'bg');

                htmlElement.style.setProperty(fixName, value);
            }

            if (alphaColors.has(key)) {
                const alpha = alphaColors.get(key);
                if (alpha) {
                    const rgba = hexToRgba(value, alpha);
                    if (rgba) {
                        htmlElement.style.setProperty(`${key}-alpha`, rgba);
                    }
                }
            }
        }

        const platform = getParams().platform;
        const badBackgroundPlatforms: BackgroundPlatforms[] = ['android', 'android_x', 'tdesktop', 'web', 'weba'];
        if (badBackgroundPlatforms.includes(platform as BackgroundPlatforms)) {
            htmlElement.style.setProperty('--tg-theme-islands-background-color', 'var(--tg-theme-secondary-bg-color)');
        }
    }, []);

    useAsyncEffect(async () => {
        const storageSessionHashed = isDev
            ? await getCache(Constants.SESSION_KEY)
            : await wrapCallMAMethod<string>(() => storage.get(Constants.SESSION_KEY));
        const storageSession = storageSessionHashed
            ? decodeString(storageSessionHashed as string, getStorageHash())
            : '';

        window.TelegramClient = new TelegramClient(
            new StringSession(storageSession),
            Constants.API_ID,
            Constants.API_HASH,
            {
                connectionRetries: 5,
                useWSS: true,
                floodSleepThreshold: 0,
                langCode: getAppLangCode()
            }
        );

        window.TelegramClient.setLogLevel(LogLevel.INFO);

        setInitData(true);
    }, []);

    useEffect(() => {
        console.log('viewport', Boolean(viewport));

        if (!viewport) {
            return;
        }

        if (!viewport.isExpanded) {
            wrapCallMAMethod(() => viewport.expand());
        }
    }, [viewport]);

    if (!hasInitData) {
        return <SuspenseLoader />;
    }

    return <AppWrapper />;
}
