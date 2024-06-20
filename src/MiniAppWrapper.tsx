import { PropsWithChildren, useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { SDKProvider, useSDKContext } from '@tma.js/sdk-react';
import { AppRoot, Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import { MemoryRouter } from 'react-router-dom';
import { hexToRgba } from './lib/helpers.ts';
import { TonApiCall } from './lib/TonApi.ts';
import { App } from './App.tsx';

function MiniAppLoader({ children }: PropsWithChildren) {
    const { loading, initResult, error } = useSDKContext();

    if (!loading && !error && !initResult) {
        return <Placeholder description={'SDK init function is not yet called.'} />;
    }

    if (error) {
        return <Placeholder description={error instanceof Error ? error.message : JSON.stringify(error)} />;
    }

    if (loading) {
        return (
            <Placeholder>
                <Spinner size="m" />
            </Placeholder>
        );
    }

    return <>{children}</>;
}

const alphaColors = new Map<string, number>([
    ['--tg-background-color', 0.4],
    ['--tg-theme-header-bg-color', 0.4],
    ['--tg-theme-hint-color', 0.2]
]);

function getGlobalColors() {
    const htmlElement = document.documentElement;
    const styleString = htmlElement.getAttribute('style') as string;
    const regExp = '(--[\\w-]+)\\s*:\\s*([^;]+)';
    const allColors = (styleString.match(new RegExp(regExp, 'g')) || []).map((color) => {
        const [key, value] = color.split(':');

        return { key, value: value.trim() };
    });

    return allColors;
}

export function MiniAppWrapper() {
    useEffect(() => {
        const htmlElement = document.documentElement;
        const initColors = getGlobalColors();

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
    }, []);

    return (
        <AppRoot>
            <SDKProvider options={{ cssVars: true }}>
                <TonConnectUIProvider manifestUrl={TonApiCall.manifestUrl}>
                    <MiniAppLoader>
                        <MemoryRouter>
                            <App />
                        </MemoryRouter>
                    </MiniAppLoader>
                </TonConnectUIProvider>
            </SDKProvider>
        </AppRoot>
    );
}
