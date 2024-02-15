import { useContext, useEffect, useState } from 'react';
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
import { useCloudStorage } from '@tma.js/sdk-react';
import {
    IconAddressBook,
    IconBook2,
    IconMessages,
    IconPigMoney,
    IconSettings,
    IconUser,
    IconUsersGroup,
    TablerIconsProps
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { classNames, decodeString, getCurrentUser, getDocLink } from '../lib/helpers.ts';
import { hexToRgba } from '../lib/theme.ts';
import { getCache, removeCache, setCache } from '../lib/cache.ts';
import { getMethods, IMethod, MethodCategory } from '../routes.tsx';
import Logo from '../components/Logo.tsx';
import { t } from '../lib/lang.ts';
import Onboarding from '../components/Onboarding.tsx';
import AuthPage from './AuthPage.tsx';

import classes from '../styles/MenuPage.module.css';
import ProfilePage from './ProfilePage.tsx';

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
    }
];

const MenuPage = () => {
    const { user, setUser, initData, checkIsOnboardingCompleted, markOnboardingAsCompleted } = useContext(AppContext);

    const theme = useMantineTheme();
    const storage = useCloudStorage();
    const navigate = useNavigate();
    const [isModalOpened, { open, close }] = useDisclosure(false);
    const [isModalAuthOpened, { open: openAuth, close: closeAuth }] = useDisclosure(false);
    const [isModalProfileOpened, { open: openProfile, close: closeProfile }] = useDisclosure(false);

    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
    const [needShowOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        (async () => {
            const isOnboardingCompleted = await checkIsOnboardingCompleted();

            if (!isOnboardingCompleted) {
                setShowOnboarding(true);
            } else {
                if (!user && initData) {
                    const storageSession = decodeString(await storage.get(Constants.SESSION_KEY), initData.storageHash);
                    console.log('storageSession', storageSession);
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
    }, []);

    useEffect(() => {
        (async () => {
            console.log('user', user);
            console.log('initData', initData);

            if (initData) {
                const storageSession = decodeString(await storage.get(Constants.SESSION_KEY), initData.storageHash);
                console.log('storageSession', storageSession);
            }
        })();
    }, [user, initData]);

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

                    if (user) {
                        navigate(`/methods/${method.id}`);
                    } else {
                        setCache(Constants.AUTH_STATE_METHOD_KEY, method.id, 15).then(() => {
                            openAuth();
                        });
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
                <card.icon size={32} color={color} />
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
            <UnstyledButton className={classes.user} onClick={openProfile}>
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

                    <IconSettings size={16} stroke={1.5} />
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

            <Modal opened={isModalProfileOpened} onClose={() => closeProfile()} title={t('menu.auth_modal_profile')}>
                <ProfilePage />
            </Modal>

            <Container p={5}>
                {UserRow()}

                <SimpleGrid cols={2} m="xs">
                    {cards.map(CategoryBlock)}
                </SimpleGrid>

                <UnstyledButton className={classes.link} component="a" href={getDocLink('')} target="_blank">
                    <IconBook2 className={classes.linkIcon} stroke={1.5} />
                    <span>{t('menu.documentation')}</span>
                </UnstyledButton>

                <UnstyledButton className={classes.link} component="a" href="https://t.me/kit42_app" target="_blank">
                    <Avatar size="sm" color="blue" radius="xl" mr="xs">
                        <Logo size={14} />
                    </Avatar>
                    <span>{t('menu.telegram_channel')}</span>
                </UnstyledButton>

                <UnstyledButton
                    className={classes.link}
                    component="a"
                    href="https://t.me/tribute?start=sd1c"
                    target="_blank"
                >
                    <IconPigMoney className={classNames(classes.linkIcon, classes.donutIcon)} stroke={1.5} />
                    <span>{t('menu.donate')}</span>
                </UnstyledButton>
            </Container>

            <Notification withCloseButton={false} m="xs" color="gray">
                {t('beta')}
                <Button fullWidth variant="outline" mt="xs" component="a" href="https://t.me/paulo">
                    @paulo
                </Button>
            </Notification>
        </>
    );
};

export default MenuPage;
