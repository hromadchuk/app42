import { useContext, useEffect, useState } from 'react';
import {
    Avatar,
    AvatarStack,
    Blockquote,
    Cell,
    Divider,
    Input,
    List,
    Placeholder,
    Section,
    Tappable
} from '@telegram-apps/telegram-ui';
import { IconBook2, IconNews, IconPigMoney, IconSearch } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMiniApp } from '@tma.js/sdk-react';
import { useTonAddress } from '@tonconnect/ui-react';
import { cards } from '../cards.ts';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { Constants } from '../constants.ts';
import { getCache } from '../lib/cache.ts';
import { getDocLink, wrapCallMAMethod } from '../lib/helpers.ts';
import { getMethodsByName } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import { AppContext } from '../contexts/AppContext.tsx';

import classes from '../styles/MenuPage.module.css';
import TonLogo from '../assets/ton_logo.svg';
import { MethodRow } from './MethodsPage.tsx';

function getInfoTextWithLink() {
    return t('menu.info')
        .replace('{link}', '<a href="https://t.me/iamhro" target="_blank">')
        .replace('{/link}', '</a>');
}

export default function MenuPage() {
    const { user, setAccountsModalOpen } = useContext(AppContext);

    const userFriendlyAddress = useTonAddress();
    const miniApp = useMiniApp();
    const navigate = useNavigate();

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
            avatars.push(<OwnerAvatar key="user" owner={user} size={28} />);
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
                            before={
                                <Avatar size={40} style={{ backgroundColor: card.color }}>
                                    <card.icon size={28} stroke={1.2} />
                                </Avatar>
                            }
                            description={t(`menu.cards.${card.id}_description`)}
                            multiline={true}
                            onClick={() => {
                                navigate(`/methods/${card.id}`);
                                wrapCallMAMethod(() => miniApp.setHeaderColor(card.color));
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
                        before={<IconSearch opacity={0.3} />}
                        placeholder={t('menu.search_placeholder')}
                        className={classes.searchInput}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                {AccountsRow()}
            </div>

            <Divider />

            <List style={{ padding: 16 }}>{Content()}</List>
        </>
    );
}
