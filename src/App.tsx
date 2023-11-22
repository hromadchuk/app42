import { useEffect, useState } from 'react';
import { AppShell, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { AppContext } from './contexts/AppContext.tsx';
import { postEvent } from '@tma.js/bridge';
import { AppNotifications } from './components/AppNotifications.tsx';
import { Constants } from './constants.ts';
import { clearOldCache } from './lib/cache.ts';
import { getParams, isDev, Server } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { IRouter, routes } from './routes.tsx';

import { EmptyHeader } from './components/EmptyHeader.tsx';
import { AppFooter } from './components/AppFooter.tsx';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import './App.css';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        userId: number;
        isProgress: boolean;
        eruda: { init: () => void };
    }
}

if (isDev) {
    (() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/eruda';
        document.body.append(script);
        script.onload = () => {
            window.eruda.init();
        };
    })();
}

const App = () => {
    const [user, setUser] = useState<null | Api.User>(null);
    const [isAppLoading, setAppLoading] = useState<boolean>(false);

    useEffect(() => {
        clearOldCache();

        postEvent('web_app_expand');

        const session = localStorage.getItem(Constants.SESSION_KEY);

        window.TelegramClient = new TelegramClient(
            new StringSession(session || ''),
            Constants.API_ID,
            Constants.API_HASH,
            {
                connectionRetries: 5,
                useWSS: true,
                floodSleepThreshold: 0,
                langCode: getAppLangCode()
            }
        );

        const versionKey = 'TGLibVersion';
        const version = window.TelegramClient.__version__;
        const currentVersion = localStorage.getItem(versionKey);

        if (currentVersion !== version) {
            localStorage.clear();
            localStorage.setItem(versionKey, version);
            location.reload();
            return;
        }

        window.listenEvents = {};
        window.TelegramClient.addEventHandler((event) => {
            if (window.listenEvents[event.className]) {
                window.listenEvents[event.className](event);
            }
        });

        try {
            Server('init', { platform: getParams().get('tgWebAppPlatform') });
        } catch (error) {
            console.error(`Error init app: ${error}`);
        }
    }, []);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    return (
        <MantineProvider forceColorScheme={useColorScheme()}>
            <AppContext.Provider value={{ user, setUser, isAppLoading, setAppLoading }}>
                <MemoryRouter>
                    <AppShell>
                        <EmptyHeader />
                        <AppShell.Main>
                            <Routes>{routes.map(GetRouter)}</Routes>
                            <AppFooter />
                        </AppShell.Main>
                        <AppNotifications />
                    </AppShell>
                </MemoryRouter>
            </AppContext.Provider>
        </MantineProvider>
    );
};

export default App;
