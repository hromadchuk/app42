import { PropsWithChildren, useEffect, useState } from 'react';
import { AppShell, Center, Loader, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ModalsProvider } from '@mantine/modals';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { AppContext, IInitData } from './contexts/AppContext.tsx';
import { SDKProvider, useBackButton, useCloudStorage, useMiniApp, useSDKContext, useViewport } from '@tma.js/sdk-react';
import { AppNotifications } from './components/AppNotifications.tsx';
import { Constants } from './constants.ts';
import { clearOldCache } from './lib/cache.ts';
import { decodeString, getParams, isDev, isDevUser, Server } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { setColors } from './lib/theme.ts';
import { TonApiCall } from './lib/TonApi.ts';
import { IRouter, routes } from './routes.tsx';
import ReactGA from 'react-ga4';

import { AppFooter } from './components/AppFooter.tsx';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.css';
import './App.css';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        isProgress: boolean;
        isNeedToThrowErrorOnRequest: boolean;
        alreadyVisitedRefLink: boolean;
        eruda: { init: () => void };
    }
}

const App = () => {
    const miniApp = useMiniApp();
    const viewport = useViewport();
    const backButton = useBackButton();
    const storage = useCloudStorage();
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<null | Api.User>(null);
    const [initData, setInitData] = useState<null | IInitData>(null);
    const [isAppLoading, setAppLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            // init mini app
            miniApp.ready();
            viewport.expand();

            backButton.on('click', () => {
                navigate('/');

                if (window.isProgress) {
                    // need for stop all requests
                    window.isProgress = false;
                    window.isNeedToThrowErrorOnRequest = true;
                }
            });

            // clear cache
            clearOldCache();

            // init analytics
            if (!isDev) {
                ReactGA.initialize('G-T5H886J9RS');
            }

            // init server data
            let serverData = null;
            try {
                serverData = await Server<IInitData>('init', { platform: getParams().get('tgWebAppPlatform') });

                if (serverData?.storageHash) {
                    setInitData(serverData);
                }
            } catch (error) {
                console.error(`Error init app: ${error}`);

                serverData = {
                    status: 'error'
                };
            }

            // init app
            let storageSession = '';
            try {
                storageSession = decodeString(await storage.get(Constants.SESSION_KEY), serverData?.storageHash || '');
            } catch (error) {
                console.log('Error get session from storage', error);
            }

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

            const versionKey = 'TGLibVersion';
            const version = window.TelegramClient.__version__;
            const currentVersion = localStorage.getItem(versionKey);

            if (!currentVersion) {
                localStorage.setItem(versionKey, version);
            } else if (currentVersion !== version) {
                const isOnboardingCompleted = await checkIsOnboardingCompleted();

                localStorage.removeItem('GramJs:apiCache');
                localStorage.setItem(versionKey, version);

                if (isOnboardingCompleted) {
                    await markOnboardingAsCompleted();
                }

                window.location.reload();
                return;
            }

            window.listenEvents = {};

            window.TelegramClient.addEventHandler((event) => {
                if (window.listenEvents[event.className]) {
                    window.listenEvents[event.className](event);
                }
            });

            window.addEventListener('message', ({ data }) => {
                const { eventType, eventData } = JSON.parse(data);

                if (eventType !== 'viewport_changed') {
                    console.log('event', eventType, '=>', eventData);
                }

                if (eventType === 'theme_changed') {
                    setColors(eventData.theme_params);
                }
            });

            console.log({ isDevUser });
            if (isDevUser) {
                sendSecureData({ test: 1, test2: [1, '21', { test4: 4 }] });
                console.log('sendSecureData');
            }
        })();
    }, []);

    useEffect(() => {
        if (!isDev) {
            ReactGA.send({ hitType: 'pageview', page: location.pathname });
        }

        const excludeBackButton = ['/'];

        if (excludeBackButton.includes(location.pathname)) {
            backButton.hide();
        } else {
            backButton.show();
        }
    }, [location]);

    function sendSecureData(data: object) {
        miniApp.sendData(JSON.stringify(data));
    }

    async function markOnboardingAsCompleted(): Promise<void> {
        await storage.set(Constants.ONBOARDING_COMPLETED_KEY, '1');
    }

    async function checkIsOnboardingCompleted(): Promise<boolean> {
        return Boolean(await storage.get(Constants.ONBOARDING_COMPLETED_KEY));
    }

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    return (‹
        <AppContext.Provider
            value={{
                user,
                setUser,
                initData,
                setInitData,
                isAppLoading,
                setAppLoading,
                markOnboardingAsCompleted,
                checkIsOnboardingCompleted,
                sendSecureData
            }}
        >
            <Routes>{routes.map(GetRouter)}</Routes>
            <AppFooter />
            <AppNotifications />
        </AppContext.Provider>
    );
};

function MiniAppLoader({ children }: PropsWithChildren) {
    const { loading, initResult, error } = useSDKContext();

    if (!loading && !error && !initResult) {
        return (
            <Center h={100} mx="auto">
                SDK init function is not yet called.
            </Center>
        );
    }

    if (error) {
        return (
            <Center h={100} mx="auto">
                Something went wrong: {error instanceof Error ? error.message : JSON.stringify(error)}
            </Center>
        );
    }

    if (loading) {
        return (
            <Center h={100} mx="auto">
                <Loader />
            </Center>
        );
    }

    return <>{children}</>;
}

const MiniAppWrapper = () => (
    <SDKProvider options={{ async: true }}>
        <TonConnectUIProvider manifestUrl={TonApiCall.manifestUrl}>
            <MantineProvider forceColorScheme={useColorScheme()}>
                <ModalsProvider>
                    <MiniAppLoader>
                        <MemoryRouter>
                            <AppShell>
                                <App />
                            </AppShell>
                        </MemoryRouter>
                    </MiniAppLoader>
                </ModalsProvider>
            </MantineProvider>
        </TonConnectUIProvider>
    </SDKProvider>
);

export default MiniAppWrapper;