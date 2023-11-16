import { useEffect, useState } from 'react';
import { AppShell, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { AppContext } from './contexts/AppContext.tsx';
import { AppNotifications } from './components/AppNotifications.tsx';
import { Constants } from './constants.ts';
import { clearOldCache } from './lib/cache.ts';
import { getAppLangCode } from './lib/lang.ts';
import { IRouter, routers } from './routes.tsx';

import { AppHeader } from './components/AppHeader.tsx';
import { AppFooter } from './components/AppFooter.tsx';

import '@mantine/core/styles.css';
import './App.css';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        userId: number;
        authData: string;
    }
}

const App = () => {
    const [user, setUser] = useState<null | Api.User>(null);
    const [isAppLoading, setAppLoading] = useState<boolean>(false);

    useEffect(() => {
        clearOldCache();

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
        }

        window.listenEvents = {};
        window.TelegramClient.addEventHandler((event) => {
            if (window.listenEvents[event.className]) {
                window.listenEvents[event.className](event);
            }
        });
    }, []);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    return (
        <MantineProvider forceColorScheme={useColorScheme()}>
            <AppContext.Provider value={{ user, setUser, isAppLoading, setAppLoading }}>
                <HashRouter>
                    <AppShell header={{ height: 56 }}>
                        <AppHeader user={user} />
                        <AppShell.Main>
                            <Routes>{routers.map(GetRouter)}</Routes>
                            <AppFooter />
                        </AppShell.Main>
                        <AppNotifications />
                    </AppShell>
                </HashRouter>
            </AppContext.Provider>
        </MantineProvider>
    );
};

export default App;
