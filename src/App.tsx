import { lazy, useEffect, useState } from 'react';
import { IconButton, Snackbar } from '@telegram-apps/telegram-ui';
import { IconX } from '@tabler/icons-react';
import ReactGA from 'react-ga4';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
    useBackButton,
    useCloudStorage,
    useLaunchParams,
    useMiniApp,
    useSwipeBehavior
} from '@telegram-apps/sdk-react';
import {
    Locales,
    TonConnectUIProvider,
    useTonAddress,
    useTonConnectModal,
    useTonConnectUI
} from '@tonconnect/ui-react';
import { Api } from 'telegram';
import { getCardById } from './cards.ts';
import { AppFooter } from './components/AppFooter.tsx';
import { Constants } from './constants.ts';
import { clearOldCache, getCache, removeCache, setCache } from './lib/cache.ts';
import { getCurrentUser } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { getContactsNames } from './lib/logic_helpers.ts';
import { decodeString, isDev, Server, wrapCallMAMethod } from './lib/utils.ts';
import { AuthType, getMethodById, IMethod, IRouter, MethodCategory, routes } from './routes.tsx';

import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import 'dayjs/locale/ru';

dayjs.extend(toObject);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale(getAppLangCode());

import 'chartkick/chart.js';

import { IShareOptions, ShareModal } from './modals/ShareModal.tsx';
const Onboarding = lazy(() => import('./components/Onboarding.tsx'));
const AccountsModal = lazy(() => import('./modals/AccountsModal.tsx'));

import { AppContext, ISnackbarOptions } from './contexts/AppContext.tsx';

export function App() {
    const miniApp = useMiniApp();
    const backButton = useBackButton();
    const storage = useCloudStorage();
    const swipeBehavior = useSwipeBehavior();
    const location = useLocation();
    const navigate = useNavigate();
    const currentLocation = useLocation();
    const launchParams = useLaunchParams();
    const tonWallet = useTonAddress();
    const { open: tonAuth } = useTonConnectModal();
    const [tonConnectUI, setOptions] = useTonConnectUI();

    const [user, setUser] = useState<null | Api.User>(null);
    const [isUserChecked, setUserChecked] = useState(false);
    const [isAccountsModalOpen, setAccountsModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareModalData, setShareModalData] = useState<IShareOptions | null>(null);
    const [snackbarOptions, setSnackbarOptions] = useState<null | ISnackbarOptions>(null);
    const [needShowOnboarding, setNeedShowOnboarding] = useState(false);

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
        (async () => {
            const isOnboardingCompleted = await checkIsOnboardingCompleted();
            if (!isOnboardingCompleted) {
                setNeedShowOnboarding(true);
            }

            console.log('location', JSON.stringify(location));

            if (!user && window.initData.status === 'ok') {
                const storageSessionHashed = isDev
                    ? await getCache(Constants.SESSION_KEY)
                    : await wrapCallMAMethod<string>(() => storage.get(Constants.SESSION_KEY));
                const storageSession = storageSessionHashed
                    ? decodeString(storageSessionHashed as string, window.initData.storageHash || '')
                    : null;
                console.log('storageSession', Boolean(storageSession));
                if (storageSession) {
                    const loggedUser = await getCurrentUser();
                    if (loggedUser instanceof Api.User) {
                        setUser(loggedUser);

                        const storageData = isDev
                            ? getCache(Constants.ALLOW_USE_CONTACTS_NAMES_KEY)
                            : wrapCallMAMethod<string>(() => storage.get(Constants.ALLOW_USE_CONTACTS_NAMES_KEY));
                        storageData.then((allowUseMethod) => {
                            console.log('allowSyncContactsFromMenu', allowUseMethod);
                            if (allowUseMethod === 'allow') {
                                getContactsNames();
                            }
                        });
                    } else if (loggedUser === -1) {
                        if (isDev) {
                            await removeCache(Constants.SESSION_KEY);
                        } else {
                            await storage.delete(Constants.SESSION_KEY);
                        }

                        window.location.reload();
                        return;
                    }
                }
            }

            setUserChecked(true);

            const param = new URLSearchParams(window.location.search.slice(1)).get('tgWebAppStartParam');
            const value = await getCache(Constants.AUTH_STATE_METHOD_KEY);

            console.log('tgWebAppStartParam', param);
            console.log('value', value && JSON.stringify(value));

            if (value) {
                const { methodId, authType } = value as {
                    methodId: string;
                    authType: AuthType;
                };

                if (authType === AuthType.TG) {
                    const method = getMethodById(methodId);
                    method && openMethod(method);
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
        })();
    }, []);

    useEffect(() => {
        function backButtonClick() {
            const urlParts = currentLocation.pathname.split('/');
            if (urlParts.length === 4) {
                navigate(urlParts.slice(0, -1).join('/'));
            } else {
                navigate('/');
            }

            if (window.isProgress) {
                // need for stop all requests
                window.isProgress = false;
                window.isNeedToThrowErrorOnRequest = true;
            }
        }

        backButton.on('click', backButtonClick);

        return () => {
            backButton.off('click', backButtonClick);
        };
    }, [currentLocation]);

    useEffect(() => {
        (async () => {
            setOptions({ language: getAppLangCode() as Locales });

            tonConnectUI.setConnectRequestParameters({
                state: 'ready',
                value: {
                    tonProof: window.initData.walletHash
                }
            });

            window.showSnackbar = (options: ISnackbarOptions) => setSnackbarOptions(options);
            window.hideSnackbar = () => setSnackbarOptions(null);

            tonConnectUI.onStatusChange((wallet) => {
                if (wallet?.connectItems?.tonProof && 'proof' in wallet.connectItems.tonProof) {
                    Server('set_wallet', {
                        proof: wallet.connectItems.tonProof.proof,
                        account: wallet.account
                    });
                }
            });

            // init mini app
            wrapCallMAMethod(() => miniApp.ready());
            wrapCallMAMethod(() => swipeBehavior.disableVerticalSwipe());

            // clear cache
            clearOldCache();

            // init analytics
            if (!isDev) {
                ReactGA.initialize('G-T5H886J9RS');
            }

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

        if (method.authType === AuthType.NONE) {
            window.alreadyVisitedRefLink = true;
            navigate(methodPath);
        }
    }

    function showShareModal(options: IShareOptions) {
        setShareModalData(options);
        setShareModalOpen(true);
    }

    async function markOnboardingAsCompleted(): Promise<void> {
        if (isDev) {
            await setCache(Constants.ONBOARDING_COMPLETED_KEY, '1', 60);
        } else {
            await wrapCallMAMethod<string>(() => storage.set(Constants.ONBOARDING_COMPLETED_KEY, '1'));
        }
    }

    async function checkIsOnboardingCompleted(): Promise<boolean> {
        const state = isDev
            ? await getCache(Constants.ONBOARDING_COMPLETED_KEY)
            : await wrapCallMAMethod<string>(() => storage.get(Constants.ONBOARDING_COMPLETED_KEY));

        return Boolean(state);
    }

    if (needShowOnboarding) {
        return (
            <Onboarding
                onOnboardingEnd={() => {
                    setNeedShowOnboarding(false);
                    markOnboardingAsCompleted();
                }}
            />
        );
    }

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                isUserChecked,
                openMethod,
                setAccountsModalOpen,
                showShareModal,
                markOnboardingAsCompleted,
                checkIsOnboardingCompleted
            }}
        >
            <Routes>{routes.map(GetRouter)}</Routes>

            <AppFooter />

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

export default function AppWrapper() {
    return (
        <TonConnectUIProvider manifestUrl={Constants.TON_MANIFEST_URL}>
            <MemoryRouter>
                <App />
            </MemoryRouter>
        </TonConnectUIProvider>
    );
}
