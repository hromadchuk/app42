import { useEffect, useState } from 'react';
import { IconButton, Snackbar } from '@telegram-apps/telegram-ui';
import { IconX } from '@tabler/icons-react';
import { SnackbarProps } from '@telegram-apps/telegram-ui/dist/components/Feedback/Snackbar/Snackbar';
import ReactGA from 'react-ga4';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useBackButton, useCloudStorage, useLaunchParams, useMiniApp, useViewport } from '@tma.js/sdk-react';
import { Locales, useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Constants } from './constants.ts';
import { clearOldCache, getCache, removeCache, setCache } from './lib/cache.ts';
import { decodeString, getCurrentUser, getParams, isDev, Server, wrapCallMAMethod } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { AuthType, IMethod, IRouter, MethodCategory, routes } from './routes.tsx';
import { AccountsModal } from './modals/AccountsModal.tsx';
import { AuthorizationModal } from './modals/AuthorizationModal.tsx';

import { AppContext, IInitData } from './contexts/AppContext.tsx';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        isProgress: boolean;
        isNeedToThrowErrorOnRequest: boolean;
        alreadyVisitedRefLink: boolean;
        // showSnackbar: (message: string) => void;
        // eruda: { init: () => void };
    }
}

export function App() {
    const miniApp = useMiniApp();
    const viewport = useViewport();
    const backButton = useBackButton();
    const storage = useCloudStorage();
    const location = useLocation();
    const navigate = useNavigate();
    const currentLocation = useLocation();
    const launchParams = useLaunchParams();
    const tonWallet = useTonAddress();
    const { open: tonAuth } = useTonConnectModal();
    const [, setOptions] = useTonConnectUI();

    const [user, setUser] = useState<null | Api.User>(null);
    const [isAccountsModalOpen, setAccountsModalOpen] = useState(false);
    const [isAuthorizationModalOpen, setAuthorizationModalOpen] = useState(false);
    const [initData, setInitData] = useState<null | IInitData>(null);
    const [snackbarBlock, setSnackbarBlock] = useState<null | IInitData>(null);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    useEffect(() => {
        const MALib = getComputedStyle(document.querySelector('#root > div') as Element);
        const body = document.body.style;

        const backgroundColor = MALib.getPropertyValue('--tgui--secondary_bg_color');
        const textColor = MALib.getPropertyValue('--tgui--text_color');

        body.setProperty('--app-background-color', backgroundColor);
        body.setProperty('--app-text-color', textColor);

        backButton.on('click', () => {
            navigate('/');
        });
    }, []);

    useEffect(() => {
        if (['/'].includes(currentLocation.pathname)) {
            wrapCallMAMethod(() => backButton.hide());
            wrapCallMAMethod(() => {
                miniApp.setHeaderColor(launchParams.themeParams.headerBackgroundColor as `#${string}`);
            });
        } else {
            wrapCallMAMethod(() => backButton.show());
        }
    }, [currentLocation]);

    useEffect(() => {
        if (!tonWallet) {
            return;
        }

        getCache(Constants.AUTH_STATE_METHOD_KEY).then((value) => {
            if (value) {
                const { methodPath, authType } = value as {
                    methodPath: string;
                    authType: AuthType;
                };

                if (authType === AuthType.TON) {
                    removeCache(Constants.AUTH_STATE_METHOD_KEY);
                    navigate(methodPath as string);
                }
            }
        });
    }, [tonWallet]);

    useEffect(() => {
        setOptions({ language: getAppLangCode() as Locales });

        console.log('initData', initData);

        (async () => {
            // TODO return onboarding
            // const isOnboardingCompleted = await checkIsOnboardingCompleted();
            // if (!isOnboardingCompleted) {
            //     setShowOnboarding(true);
            // }

            if (initData) {
                if (!user && initData?.status === 'ok') {
                    const storageSessionHashed = isDev
                        ? await getCache(Constants.SESSION_KEY)
                        : await wrapCallMAMethod<string>(() => storage.get(Constants.SESSION_KEY));
                    const storageSession = storageSessionHashed
                        ? decodeString(storageSessionHashed as string, initData?.storageHash || '')
                        : null;
                    console.log('storageSession', Boolean(storageSession));
                    if (storageSession) {
                        setUser(await getCurrentUser());
                    }
                }

                const param = new URLSearchParams(location.search).get('tgWebAppStartParam');
                const methodId = await getCache(Constants.AUTH_STATE_METHOD_KEY);

                console.log({param, methodId});
                // if (methodId) {
                //     openAuth();
                // } else if (param === 'cn' && !window.alreadyVisitedRefLink) {
                //     const method = getMethods().find((item) => item.id === 'contacts_names');
                //     if (method) {
                //         openMethod(method);
                //     }
                // }
            }
        })();
    }, [initData]);

    useEffect(() => {
        (async () => {
            // init mini app
            wrapCallMAMethod(() => miniApp.ready());
            wrapCallMAMethod(() => viewport.expand());

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
                const storageSessionHashed = isDev
                    ? await getCache(Constants.SESSION_KEY)
                    : await wrapCallMAMethod<string>(() => storage.get(Constants.SESSION_KEY));
                storageSession = storageSessionHashed
                    ? decodeString(storageSessionHashed as string, serverData?.storageHash || '')
                    : '';
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
                // const isOnboardingCompleted = await checkIsOnboardingCompleted();

                localStorage.removeItem('GramJs:apiCache');
                localStorage.setItem(versionKey, version);

                // if (isOnboardingCompleted) {
                //     await markOnboardingAsCompleted();
                // }

                window.location.reload();
                return;
            }

            window.listenEvents = {};

            window.TelegramClient.addEventHandler((event) => {
                if (window.listenEvents[event.className]) {
                    window.listenEvents[event.className](event);
                }
            });

            // window.addEventListener('message', ({ data }) => {
            //     const { eventType, eventData } = JSON.parse(data);
            //
            //     if (eventType !== 'viewport_changed') {
            //         console.log('event', eventType, '=>', eventData);
            //     }
            //
            //     if (eventType === 'theme_changed') {
            //         setColors(eventData.theme_params);
            //     }
            // });
        })();
    }, []);

    function openMethod(method: IMethod, categoryId?: MethodCategory) {
        const categoryPath = categoryId || method.categories[0];
        const methodPath = `/methods/${categoryPath}/${method.id}`;

        if (method.authType === AuthType.TON) {
            if (tonWallet) {
                window.alreadyVisitedRefLink = true;
                navigate(methodPath);
            } else {
                setCache(Constants.AUTH_STATE_METHOD_KEY, { methodPath, authType: method.authType }, 15).then(() => {
                    tonAuth();
                });
            }
        }

        if (method.authType === AuthType.TG) {
            if (user) {
                window.alreadyVisitedRefLink = true;
                navigate(methodPath);
            } else {
                setCache(Constants.AUTH_STATE_METHOD_KEY, { methodPath, authType: method.authType }, 15).then(() => {
                    setAuthorizationModalOpen(true);
                });
            }
        }
    }

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                openMethod,
                setAccountsModalOpen,
                initData,
                setInitData,
                // setAppLoading,
                // markOnboardingAsCompleted,
                // checkIsOnboardingCompleted
            }}
        >
            <Routes>{routes.map(GetRouter)}</Routes>

            <AccountsModal isOpen={isAccountsModalOpen} onOpenChange={(open) => setAccountsModalOpen(open)} />
            <AuthorizationModal
                isOpen={isAuthorizationModalOpen}
                onOpenChange={(open) => setAuthorizationModalOpen(open)}
                onAuthComplete={() => {
                    getCache(Constants.AUTH_STATE_METHOD_KEY).then((value) => {
                        if (value) {
                            const { methodPath } = value as { methodPath: string };

                            window.alreadyVisitedRefLink = true;
                            navigate(methodPath);
                            removeCache(Constants.AUTH_STATE_METHOD_KEY);
                        }
                    });
                }}
            />

            {Boolean(snackbarBlock) && (
                <Snackbar
                    // forwardRef={snackbarRef}
                    // before={<SnackbarButton onClick={function noRefCheck(){}}>Undo</SnackbarButton>}
                    after={
                        <IconButton mode="plain" size="s" onClick={() => setSnackbarBlock(null)}>
                            <IconX />
                        </IconButton>
                    }
                    description="Restore the message within 3 seconds"
                    duration={10060}
                    onClose={() => {}}
                >
                    Message deleted
                </Snackbar>
            )}
        </AppContext.Provider>
    );
}
