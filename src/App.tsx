import { useEffect, useState } from 'react';
import { AppShell, Button, createTheme, CSSVariablesResolver, MantineProvider, TextInput } from '@mantine/core';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { SDKProvider, useLaunchParams } from '@tma.js/sdk-react';
import { AppContext } from './components/AppContext.tsx';
import { Constants } from './constants.tsx';
import { clearOldCache } from './lib/cache.tsx';
import { generateDimmerColors, Server } from './lib/helpers.tsx';
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

    const { initDataRaw, platform, themeParams } = useLaunchParams();

    useEffect(() => {
        window.authData = initDataRaw as string;
    }, [initDataRaw]);

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

            Server('init', { platform });
        }
    }, []);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    const theme = createTheme({
        primaryColor: 'twa',
        colors: {
            // @ts-ignore
            twa: generateDimmerColors(themeParams.buttonColor as string, 10)
        },
        components: {
            Button: Button.extend({
                styles: {
                    label: { color: themeParams.buttonTextColor }
                }
            }),
            TextInput: TextInput.extend({
                styles: {
                    input: {
                        backgroundColor: themeParams.secondaryBackgroundColor,
                        borderColor: themeParams.buttonColor
                    }
                }
            })
        }
    });

    const resolver: CSSVariablesResolver = () => ({
        variables: {
            '--mantine-color-text': `${themeParams.textColor} !important`,
            '--mantine-color-body': `${themeParams.backgroundColor} !important`,
            '--mantine-color-placeholder': `${themeParams.secondaryBackgroundColor} !important`,
            '--mantine-color-default': `${themeParams.secondaryBackgroundColor} !important`
        },
        light: {},
        dark: {}
    });

    return (
        <MantineProvider theme={theme} forceColorScheme={'dark'} cssVariablesResolver={resolver}>
            <AppContext.Provider value={{ user, setUser }}>
                <MemoryRouter>
                    <SDKProvider>
                        <AppShell header={{ height: 56 }}>
                            <AppHeader user={user} />
                            <AppShell.Main>
                                <Routes>{routers.map(GetRouter)}</Routes>
                                <AppFooter />
                            </AppShell.Main>
                        </AppShell>
                    </SDKProvider>
                </MemoryRouter>
            </AppContext.Provider>
        </MantineProvider>
    );
};

export default App;
