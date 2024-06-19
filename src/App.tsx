import { useEffect, useState } from 'react';
import { IconButton, Snackbar } from '@telegram-apps/telegram-ui';
import { IconX } from '@tabler/icons-react';
import ReactGA from 'react-ga4';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useBackButton, useCloudStorage, useLaunchParams, useMiniApp, useViewport } from '@tma.js/sdk-react';
import { Locales, useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import { Api, TelegramClient } from 'telegram';
import { LogLevel } from 'telegram/extensions/Logger';
import { StringSession } from 'telegram/sessions';
import { getCardById } from './cards.ts';
import { Constants } from './constants.ts';
import { clearOldCache, getCache, removeCache, setCache } from './lib/cache.ts';
import { decodeString, getCurrentUser, getParams, isDev, Server, wrapCallMAMethod } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { AuthType, getMethodById, IMethod, IRouter, MethodCategory, routes } from './routes.tsx';

import { IShareOptions, ShareModal } from './modals/ShareModal.tsx';
import { AccountsModal } from './modals/AccountsModal.tsx';

import { AppContext, IInitData, ISnackbarOptions } from './contexts/AppContext.tsx';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        isProgress: boolean;
        isNeedToThrowErrorOnRequest: boolean;
        alreadyVisitedRefLink: boolean;
        showSnackbar: (options: ISnackbarOptions) => void;
        hideSnackbar: () => void;
        eruda: { init: () => void };
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
    const [isUserChecked, setUserChecked] = useState(false);
    const [isAccountsModalOpen, setAccountsModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareModalData, setShareModalData] = useState<IShareOptions | null>(null);
    const [initData, setInitData] = useState<null | IInitData>(null);
    const [snackbarOptions, setSnackbarOptions] = useState<null | ISnackbarOptions>(null);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    useEffect(() => {
        if (['/'].includes(currentLocation.pathname)) {
            wrapCallMAMethod(() => backButton.hide());
            wrapCallMAMethod(() => {
                miniApp.setHeaderColor(launchParams.themeParams.headerBackgroundColor as `#${string}`);
            });
        } else {
            if (currentLocation.pathname.startsWith('/methods/')) {
                const [, , categoryId] = currentLocation.pathname.split('/');
                if (categoryId) {
                    const card = getCardById(categoryId as MethodCategory);

                    wrapCallMAMethod(() => {
                        miniApp.setHeaderColor(card.color);
                    });
                }
            }

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

        (async () => {
            // TODO return onboarding
            // const isOnboardingCompleted = await checkIsOnboardingCompleted();
            // if (!isOnboardingCompleted) {
            //     setShowOnboarding(true);
            // }

            if (initData) {
                console.log('location', JSON.stringify(location));

                if (!user && initData?.status === 'ok') {
                    const storageSessionHashed = isDev
                        ? await getCache(Constants.SESSION_KEY)
                        : await wrapCallMAMethod<string>(() => storage.get(Constants.SESSION_KEY));
                    const storageSession = storageSessionHashed
                        ? decodeString(storageSessionHashed as string, initData?.storageHash || '')
                        : null;
                    console.log('storageSession', Boolean(storageSession));
                    if (storageSession) {
                        const loggedUser = await getCurrentUser();
                        if (loggedUser) {
                            setUser(await getCurrentUser());
                        }
                    }
                }

                setUserChecked(true);

                const param = new URLSearchParams(window.location.search.slice(1)).get('tgWebAppStartParam');
                const value = await getCache(Constants.AUTH_STATE_METHOD_KEY);

                console.log('tgWebAppStartParam', param);
                console.log('value', value && JSON.stringify(value));

                if (value) {
                    if (value) {
                        const { methodId, authType } = value as {
                            methodId: string;
                            authType: AuthType;
                        };

                        if (authType === AuthType.TG) {
                            const method = getMethodById(methodId);
                            method && openMethod(method);
                        }
                    }
                } else if (param === 'cn' && !window.alreadyVisitedRefLink) {
                    const method = getMethodById('contacts_names');
                    method && openMethod(method);
                }

                if (isDev) {
                    // TODO only test
                    // const method = getMethodById('contacts_analysis');
                    // method && openMethod(method);
                }
            }
        })();
    }, [initData]);

    useEffect(() => {
        (async () => {
            window.showSnackbar = (options: ISnackbarOptions) => setSnackbarOptions(options);
            window.hideSnackbar = () => setSnackbarOptions(null);

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

            window.TelegramClient.setLogLevel(LogLevel.INFO);

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
        const data = { methodId: method.id, methodPath, authType: method.authType };

        if (method.authType === AuthType.TON) {
            if (tonWallet) {
                window.alreadyVisitedRefLink = true;
                navigate(methodPath);
            } else {
                setCache(Constants.AUTH_STATE_METHOD_KEY, data, 15).then(() => {
                    tonAuth();
                });
            }
        }

        if (method.authType === AuthType.TG) {
            if (user) {
                window.alreadyVisitedRefLink = true;
                navigate(methodPath);
            } else {
                setCache(Constants.AUTH_STATE_METHOD_KEY, data, 15).then(() => {
                    navigate(methodPath);
                });
            }
        }
    }

    function showShareModal(options: IShareOptions) {
        setShareModalData(options);
        setShareModalOpen(true);
    }

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                isUserChecked,
                openMethod,
                setAccountsModalOpen,
                initData,
                setInitData,
                showShareModal
            }}
        >
            <Routes>{routes.map(GetRouter)}</Routes>

            <AccountsModal isOpen={isAccountsModalOpen} onOpenChange={(open) => setAccountsModalOpen(open)} />
            <ShareModal
                isOpen={isShareModalOpen}
                onOpenChange={(open) => {
                    setShareModalOpen(open);

                    if (!open) {
                        setShareModalData(null);
                    }
                }}
                modalData={shareModalData}
            />

            {snackbarOptions && (
                <Snackbar
                    before={snackbarOptions.icon}
                    after={
                        snackbarOptions.type !== 'loading' && (
                            <IconButton mode="plain" size="s" onClick={() => setSnackbarOptions(null)}>
                                <IconX />
                            </IconButton>
                        )
                    }
                    description={snackbarOptions.message}
                    duration={snackbarOptions.duration}
                    onClose={() => setSnackbarOptions(null)}
                >
                    {snackbarOptions.title}
                </Snackbar>
            )}
        </AppContext.Provider>
    );
}
