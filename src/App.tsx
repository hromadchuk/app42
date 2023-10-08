import { useEffect, useState } from 'react';
import { AppShell, createTheme, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { AppContext } from './components/AppContext.tsx';
import { Constants } from './constants.tsx';
import { clearOldCache } from './lib/cache.tsx';
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
    }
}

const App = () => {
    const [user, setUser] = useState<null | Api.User>(null);

    useEffect(() => {
        clearOldCache();

        const versionKey = 'KIT_42_CACHE_VERSION';
        const currentVersion = localStorage.getItem(versionKey);
        if (currentVersion !== Constants.KIT_42_CACHE_VERSION) {
            localStorage.clear();
            localStorage.setItem(versionKey, Constants.KIT_42_CACHE_VERSION);
            location.reload();
        } else {
            const session = localStorage.getItem(Constants.SESSION_KEY);

            window.TelegramClient = new TelegramClient(
                new StringSession(session || ''),
                Constants.API_ID,
                Constants.API_HASH,
                {
                    connectionRetries: 5,
                    useWSS: true
                }
            );

            window.listenEvents = {};
            window.TelegramClient.addEventHandler((event) => {
                if (window.listenEvents[event.className]) {
                    window.listenEvents[event.className](event);
                }
            });
        }
    }, []);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    const theme = createTheme({
        // primaryColor: 'cyan',
    });

    return (
        <MantineProvider theme={theme} forceColorScheme={useColorScheme()}>
            <AppContext.Provider value={{ user, setUser }}>
                <HashRouter>
                    <AppShell header={{ height: 56 }}>
                        <AppHeader user={user} />
                        <AppShell.Main>
                            <Routes>{routers.map(GetRouter)}</Routes>
                            <AppFooter />
                        </AppShell.Main>
                    </AppShell>
                </HashRouter>
            </AppContext.Provider>
        </MantineProvider>
    );
};

export default App;
