import { useContext, useEffect, useState } from 'react';
import {
    Avatar,
    AvatarStack,
    Blockquote,
    Button,
    Cell,
    Divider,
    Input,
    List, Placeholder,
    Section,
    Tappable
} from '@telegram-apps/telegram-ui';
import {
    IconAddressBook,
    IconBook2,
    IconMessages,
    IconNews,
    IconPigMoney, IconSearch,
    IconUser,
    IconUsersGroup,
    IconWallet,
    TablerIconsProps
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMiniApp } from '@tma.js/sdk-react';
import { useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import { cards, ICard } from '../cards.ts';
import { Constants } from '../constants.ts';
import { getCache, removeCache } from '../lib/cache.ts';
import { TonApiCall } from '../lib/TonApi.ts';
import { classNames, getDocLink, wrapCall } from '../lib/helpers.ts';
import { PageHeader } from '../components/PageHeader.tsx';
import { getMethodsByName, MethodCategory } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import { AppContext } from '../contexts/AppContext.tsx';

import { AccountsModal } from '../modals/AccountsModal.tsx';
import AuthorizationModal from '../modals/AuthorizationModal.tsx';

import classes from '../styles/MenuPage.module.css';
import TonLogo from '../assets/ton_logo.svg';
import { MethodRow } from './MethodsPage.tsx';

function getInfoTextWithLink() {
    return t('menu.info')
        .replace('{link}', '<a href="https://t.me/iamhro" target="_blank">')
        .replace('{/link}', '</a>');
}

export default function MenuPage() {
    const { user } = useContext(AppContext);

    const { open: tonAuth } = useTonConnectModal();
    const userFriendlyAddress = useTonAddress();
    const miniApp = useMiniApp();
    const navigate = useNavigate();

    const [isAccountsModalOpen, setAccountsModalOpen] = useState(false);
    const [isAuthorizationModalOpen, setAuthorizationModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (!userFriendlyAddress) {
            return;
        }

        getCache(Constants.AUTH_STATE_METHOD_KEY).then((cacheMethodId) => {
            if (cacheMethodId) {
                // removeCache(Constants.AUTH_STATE_METHOD_KEY);
                // navigate(`/methods/${cacheMethodId}`);
            }
        });
    }, [userFriendlyAddress]);

    function AccountsRow() {
        if (!user && !userFriendlyAddress) {
            return null;
        }

        const avatars = [];

        if (user) {
            avatars.push(
                <Avatar
                    key="user"
                    size={28}
                    src={
                        'https://unsplash.com/photos/DItYlc26zVI/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8bWFufGVufDB8fHx8MTcxNDg1MzcwOHww&force=true&w=640'
                    }
                />
            );
        }

        if (userFriendlyAddress) {
            avatars.push(<Avatar key="wallet" size={28} src={TonLogo} />);
        }

        return (
            <Tappable
                onClick={() => setAccountsModalOpen(true)}
                className={classes.avatarsBox}
                interactiveAnimation="opacity"
            >
                <AvatarStack>{avatars}</AvatarStack>
            </Tappable>
        );
    }

    function Content() {
        if (searchText) {
            const methods = getMethodsByName(searchText);

            if (!methods.length) {
                return <Placeholder description={t('menu.no_methods')} />;
            }

            return <Section className={classes.categories}>{methods.map(MethodRow)}</Section>;
        }

        return (
            <>
                <Section className={classes.categories}>
                    {cards.map((card, key) => (
                        <Cell
                            key={key}
                            before={<card.icon size={28} color={card.color} stroke={1.2} />}
                            onClick={() => {
                                navigate(`/methods/${card.id}`);
                                wrapCall(() => miniApp.setHeaderColor(card.color));
                            }}
                        >
                            {t(`menu.cards.${card.id}`)}
                        </Cell>
                    ))}
                </Section>

                <Section className={classes.categories}>
                    <Link to={getDocLink('')} target="_blank" className={classes.link}>
                        <Cell before={<IconBook2 size={28} stroke={1.2} />}>{t('menu.documentation')}</Cell>
                    </Link>
                    <Link to="https://t.me/tribute?start=sd1c" target="_blank" className={classes.link}>
                        <Cell before={<IconPigMoney size={28} stroke={1.2} className={classes.donutIcon} />}>
                            {t('menu.donate')}
                        </Cell>
                    </Link>
                    <Link to="https://t.me/app42news" target="_blank" className={classes.link}>
                        <Cell before={<IconNews size={28} stroke={1.2} />}>{t('menu.telegram_channel')}</Cell>
                    </Link>
                    <Cell onClick={tonAuth} before={<IconNews size={28} stroke={1.2} />}>
                        tonAuth
                    </Cell>
                </Section>

                <Blockquote>
                    <div dangerouslySetInnerHTML={{ __html: getInfoTextWithLink() }}></div>
                </Blockquote>
            </>
        );
    }

    return (
        <>
            <div className={classes.headerBox}>
                <div className={classes.searchBox}>
                    <Input
                        before={<IconSearch color="var(--tgui--subtitle_text_color)" />}
                        placeholder={t('menu.search_placeholder')}
                        className={classes.searchInput}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                {AccountsRow()}
            </div>

            <Divider />

            <List style={{ padding: 16 }}>{Content()}</List>

            <AccountsModal isOpen={isAccountsModalOpen} onOpenChange={(open) => setAccountsModalOpen(open)} />
            <AuthorizationModal
                isOpen={isAuthorizationModalOpen}
                onOpenChange={(open) => setAuthorizationModalOpen(open)}
            />
        </>
    );
}
