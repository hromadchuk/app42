import {
    Avatar,
    Button,
    Container,
    getThemeColor,
    Group,
    Modal,
    Notification,
    SimpleGrid,
    Text,
    UnstyledButton,
    useMantineTheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconAddressBook,
    IconBook2,
    IconLogout,
    IconMessages,
    IconPigMoney,
    IconUser,
    IconUsersGroup,
    IconWallet,
    TablerIconsProps
} from '@tabler/icons-react';
import { useCloudStorage, usePopup } from '@tma.js/sdk-react';
import { useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import Logo from '../components/Logo.tsx';
import Onboarding from '../components/Onboarding.tsx';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { getCache, removeCache, setCache } from '../lib/cache.ts';
import { CallAPI, classNames, decodeString, getCurrentUser, getDocLink } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { hexToRgba } from '../lib/theme.ts';
import { getModalLang, getShortAddress } from '../lib/ton.ts';
import { TonApiCall } from '../lib/TonApi.ts';
import { AuthType, getMethods, IMethod, MethodCategory } from '../routes.tsx';

import classes from '../styles/MenuPage.module.css';
import AuthPage from './AuthPage.tsx';

interface ICard {
    id: MethodCategory;
    icon: (props: TablerIconsProps) => JSX.Element;
    color: string;
}

const cards = [
    {
        id: MethodCategory.ACCOUNT,
        icon: IconUser,
        color: 'violet'
    },
    {
        id: MethodCategory.CONTACTS,
        icon: IconAddressBook,
        color: 'teal'
    },
    {
        id: MethodCategory.CHANNELS,
        icon: IconUsersGroup,
        color: 'yellow'
    },
    {
        id: MethodCategory.CHATS,
        icon: IconMessages,
        color: 'pink'
    },
    {
        id: MethodCategory.TON,
        icon: IconWallet,
        color: 'blue'
    }
];

const MenuPage = () => {
    const { user, setUser, initData, checkIsOnboardingCompleted, markOnboardingAsCompleted } = useContext(AppContext);

    const theme = useMantineTheme();
    const storage = useCloudStorage();
    const navigate = useNavigate();
    const popup = usePopup();
    const { open: tonOpen } = useTonConnectModal();
    const userFriendlyAddress = useTonAddress();
    const [wallet, setOptions] = useTonConnectUI();

    const [isModalOpened, { open, close }] = useDisclosure(false);
    const [isModalAuthOpened, { open: openAuth, close: closeAuth }] = useDisclosure(false);

    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
    const [needShowOnboarding, setShowOnboarding] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        setOptions({ language: getModalLang() });

        (async () => {
            const isOnboardingCompleted = await checkIsOnboardingCompleted();

            if (!isOnboardingCompleted) {
                setShowOnboarding(true);
            } else if (initData) {
                if (!user && initData?.status === 'ok') {
                    const storageSession = decodeString(await storage.get(Constants.SESSION_KEY), initData.storageHash);
                    console.log('storageSession', Boolean(storageSession));
                    if (storageSession) {
                        setUser(await getCurrentUser());
                    }
                }

                const methodId = await getCache(Constants.AUTH_STATE_METHOD_KEY);
                if (methodId) {
                    openAuth();
                }
            }
        })();
    }, [initData]);

    useEffect(() => {
        if (!userFriendlyAddress) {
            setWalletAddress(null);
            return;
        }

        TonApiCall.getWallet(userFriendlyAddress).then((accountInfo) => {
            setWalletAddress(accountInfo.name || getShortAddress(userFriendlyAddress));

            getCache(Constants.AUTH_STATE_METHOD_KEY).then((cacheMethodId) => {
                if (cacheMethodId) {
                    removeCache(Constants.AUTH_STATE_METHOD_KEY);
                    navigate(`/methods/${cacheMethodId}`);
                }
            });
        });
    }, [userFriendlyAddress]);

    const methods = getMethods();

    function getMethodsList(category: MethodCategory) {
        return methods.filter((item) => item.categories.includes(category)).map(MethodRow);
    }

    function MethodRow(method: IMethod, key: number) {
        return (
            <div
                key={key}
                className={classes.link}
                onClick={() => {
                    close();

                    if (method.authType === AuthType.TON) {
                        if (userFriendlyAddress) {
                            navigate(`/methods/${method.id}`);
                        } else {
                            setCache(Constants.AUTH_STATE_METHOD_KEY, method.id, 15).then(() => {
                                tonOpen();
                            });
                        }
                    } else if (method.authType === AuthType.TG) {
                        if (user) {
                            navigate(`/methods/${method.id}`);
                        } else {
                            setCache(Constants.AUTH_STATE_METHOD_KEY, method.id, 15).then(() => {
                                openAuth();
                            });
                        }
                    }
                }}
            >
                <method.icon className={classes.linkIcon} stroke={1.5} />
                <span>{method.name}</span>
            </div>
        );
    }

    function CategoryBlock(card: ICard, key: number) {
        const color = getThemeColor(card.color, theme);
        const cardStyle = {
            backgroundColor: hexToRgba(theme.colors[card.color][9], 0.1)
        };

        return (
            <UnstyledButton
                key={key}
                className={classes.item}
                style={cardStyle}
                onClick={() => {
                    setSelectedCard(card);
                    open();
                }}
            >
                <card.icon size={32} color={color} stroke={1.2} />
                <Text size="xs" mt={7}>
                    {t(`menu.cards.${card.id}`)}
                </Text>
            </UnstyledButton>
        );
    }

    if (needShowOnboarding) {
        return (
            <Onboarding
                onOnboardingEnd={() => {
                    setShowOnboarding(false);
                    markOnboardingAsCompleted();
                }}
            />
        );
    }

    function UserRow() {
        if (!user) {
            return null;
        }

        let usernames = '';

        if (user.usernames) {
            usernames = user.usernames.map(({ username }) => `@${username}`).join(', ');
        } else if (user.username) {
            usernames = `@${user.username}`;
        }

        return (
            <UnstyledButton
                className={classes.user}
                onClick={() => {
                    popup
                        .open({
                            message: t('menu.account_disconnect'),
                            buttons: [
                                { id: 'exit', type: 'ok' },
                                { id: 'cancel', type: 'cancel' }
                            ]
                        })
                        .then(async (result) => {
                            if (result === 'exit') {
                                await CallAPI(new Api.auth.LogOut());

                                await storage.delete(Constants.SESSION_KEY);
                                setUser(null);
                                navigate('/');

                                localStorage.clear();
                                markOnboardingAsCompleted();
                                location.reload();
                            }
                        });
                }}
            >
                <Group>
                    <OwnerAvatar owner={user} />

                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            {user.firstName} {user.lastName}
                        </Text>

                        {usernames && (
                            <Text c="dimmed" size="xs">
                                {usernames}
                            </Text>
                        )}
                    </div>

                    <IconLogout size={16} stroke={1.5} />
                </Group>
            </UnstyledButton>
        );
    }

    function WalletRow() {
        if (!walletAddress) {
            return null;
        }

        return (
            <UnstyledButton
                className={classes.user}
                onClick={() => {
                    popup
                        .open({
                            message: t('menu.wallet_disconnect'),
                            buttons: [
                                { id: 'exit', type: 'ok' },
                                { id: 'cancel', type: 'cancel' }
                            ]
                        })
                        .then((result) => {
                            if (result === 'exit') {
                                wallet.disconnect();
                            }
                        });
                }}
            >
                <Group>
                    <IconWallet stroke={1} color="var(--mantine-color-blue-filled)" />

                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            {walletAddress}
                        </Text>
                    </div>

                    <IconLogout size={16} stroke={1.5} />
                </Group>
            </UnstyledButton>
        );
    }

    return (
        <>
            <Modal.Root opened={isModalOpened} onClose={close}>
                <Modal.Overlay />
                <Modal.Content>
                    <Modal.Header>
                        <Modal.Title>{selectedCard && t(`menu.cards.${selectedCard.id}`)}</Modal.Title>
                        <Modal.CloseButton />
                    </Modal.Header>
                    <Modal.Body className={classes.modalContent}>
                        {selectedCard && getMethodsList(selectedCard.id)}
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>

            <Modal
                opened={isModalAuthOpened}
                onClose={() => {
                    removeCache(Constants.AUTH_STATE_METHOD_KEY);
                    closeAuth();
                }}
                title={t('menu.auth_modal_title')}
            >
                <AuthPage
                    onAuthComplete={() => {
                        getCache(Constants.AUTH_STATE_METHOD_KEY).then((cacheMethodId) => {
                            navigate(`/methods/${cacheMethodId}`);
                            removeCache(Constants.AUTH_STATE_METHOD_KEY);
                        });
                    }}
                />
            </Modal>

            <Container p={5}>
                {UserRow()}
                {WalletRow()}

                <SimpleGrid cols={2} m="xs">
                    {cards.map(CategoryBlock)}
                </SimpleGrid>

                <UnstyledButton className={classes.link} component="a" href={getDocLink('')} target="_blank">
                    <IconBook2 className={classes.linkIcon} stroke={1} />
                    <span>{t('menu.documentation')}</span>
                </UnstyledButton>

                <UnstyledButton
                    className={classes.link}
                    component="a"
                    href="https://t.me/tribute?start=sd1c"
                    target="_blank"
                >
                    <IconPigMoney className={classNames(classes.linkIcon, classes.donutIcon)} stroke={1} />
                    <span>{t('menu.donate')}</span>
                </UnstyledButton>

                <UnstyledButton className={classes.link} component="a" href="https://t.me/kit42_app" target="_blank">
                    <Avatar size="sm" color="blue" radius="xl" mr="xs">
                        <Logo size={14} />
                    </Avatar>
                    <span>{t('menu.telegram_channel')}</span>
                </UnstyledButton>
            </Container>

            <Notification withCloseButton={false} m="xs" color="gray">
                {t('beta')}
                <Button fullWidth variant="outline" mt="xs" component="a" href="https://t.me/test_address">
                    {t('menu.developer')}
                </Button>
            </Notification>
        </>
    );
};

export default MenuPage;
