import { PropsWithChildren, useEffect, useState } from 'react';
import { AppShell, Center, Loader, MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import ReactGA from 'react-ga4';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { AppContext } from './contexts/AppContext.tsx';
import {
    SDKProvider,
    useBackButton,
    useMiniApp,
    useSDKContext,
    useSettingsButton,
    useViewport
} from '@tma.js/sdk-react';
import { AppNotifications } from './components/AppNotifications.tsx';
import { Constants } from './constants.ts';
import { clearOldCache } from './lib/cache.ts';
import { checkIsOnboardingCompleted, getParams, isDev, markOnboardingAsCompleted, Server } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { setColors } from './lib/theme.ts';
import { IRouter, routes } from './routes.tsx';

import { AppFooter } from './components/AppFooter.tsx';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import './App.css';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        isTelegramClientConnected: boolean;
        listenEvents: { [key: string]: (event: object) => void };
        listenMAEvents: { [key: string]: (event: undefined | { button_id: string }) => void };
        userId: number;
        isProgress: boolean;
        isNeedToThrowErrorOnRequest: boolean;
    }
}

const App = () => {
    const miniApp = useMiniApp();
    const viewport = useViewport();
    const backButton = useBackButton();
    const settingsButton = useSettingsButton();
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<null | Api.User>(null);
    const [isAppLoading, setAppLoading] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            settingsButton.show();
        } else {
            settingsButton.hide();
        }
    }, [user]);

    useEffect(() => {
        // init mini app
        miniApp.ready();
        viewport.expand();

        settingsButton.on('click', () => {
            navigate('/profile');
        });

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

        // init app
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

        if (!currentVersion) {
            localStorage.setItem(versionKey, version);
        } else if (currentVersion !== version) {
            const isOnboardingCompleted = checkIsOnboardingCompleted();

            localStorage.clear();
            localStorage.setItem(versionKey, version);

            if (isOnboardingCompleted) {
                markOnboardingAsCompleted();
            }

            window.location.reload();
            return;
        }

        window.listenEvents = {};
        window.listenMAEvents = {};

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

        window.addEventListener('message', ({ data }) => {
            const { eventType, eventData } = JSON.parse(data);

            console.log('event', eventType, '=>', eventData);

            if (window.listenMAEvents[eventType]) {
                window.listenMAEvents[eventType](eventData);
            }

            if (eventType === 'theme_changed') {
                setColors(eventData.theme_params);
            }
        });
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

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                isAppLoading,
                setAppLoading
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
        <MantineProvider forceColorScheme={useColorScheme()}>
            <MiniAppLoader>
                <MemoryRouter>
                    <AppShell>
                        <App />
                    </AppShell>
                </MemoryRouter>
            </MiniAppLoader>
        </MantineProvider>
    </SDKProvider>
);

export default MiniAppWrapper;
