import { useContext, useState } from 'react';
import {
    Avatar,
    AvatarStack,
    Blockquote,
    Cell,
    Input,
    List,
    Section,
    Tappable
} from '@telegram-apps/telegram-ui';
import {
    IconAddressBook,
    IconBook2,
    IconMessages,
    IconNews,
    IconPigMoney,
    IconUser,
    IconUsersGroup,
    IconWallet
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { classNames } from '../../src-old/lib/helpers.ts';
import { MethodCategory } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import { AppContext } from '../contexts/AppContext.tsx';
import AuthorizationModal from '../modals/AuthorizationModal.tsx';

import classes from '../styles/MenuPage.module.css';

const cards = [
    {
        id: MethodCategory.ACCOUNT,
        icon: IconUser,
        color: '#9747FF'
    },
    {
        id: MethodCategory.CONTACTS,
        icon: IconAddressBook,
        color: '#FF0D72'
    },
    {
        id: MethodCategory.CHANNELS,
        icon: IconUsersGroup,
        color: '#0D9D71'
    },
    {
        id: MethodCategory.CHATS,
        icon: IconMessages,
        color: '#FF9900'
    },
    {
        id: MethodCategory.TON,
        icon: IconWallet,
        color: '#0098EA'
    }
];

function getInfoTextWithLink() {
    return t('menu.info')
        .replace('{link}', '<a href="https://t.me/iamhro" target="_blank">')
        .replace('{/link}', '</a>');
}

export default function MenuPage() {
    const { user } = useContext(AppContext);

    const [authorizationOpen, setAuthorizationOpen] = useState(false);

    console.log('user', user);

    function AccountsRow() {
        // if (!user) {
        //     return null;
        // }

        return (
            <Tappable
                onClick={() => setAuthorizationOpen(true)}
                className={classes.avatarsBox}
                interactiveAnimation="opacity"
            >
                <AvatarStack>
                    <Avatar
                        size={28}
                        src={
                            'https://unsplash.com/photos/DItYlc26zVI/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8bWFufGVufDB8fHx8MTcxNDg1MzcwOHww&force=true&w=640'
                        }
                    />
                    <Avatar size={28} src={'https://ton.org/download/ton_symbol.svg'} />
                </AvatarStack>
            </Tappable>
        );
    }

    function Content() {
        return (
            <>
                <Section className={classes.categories}>
                    {cards.map((card, key) => (
                        <Cell
                            key={key}
                            before={<card.icon size={28} color={card.color} stroke={1.2} />}
                            onClick={() => {
                                // miniApp.setHeaderColor(item.color);
                                // navigate('/category/' + index);
                            }}
                        >
                            {t(`menu.cards.${card.id}`)}
                        </Cell>
                    ))}
                </Section>

                <Section className={classes.categories}>
                    <Link to="https://wiki.kit42.app/v/en/" className={classes.link}>
                        <Cell before={<IconBook2 size={28} stroke={1.2} />}>{t('menu.documentation')}</Cell>
                    </Link>
                    <Link to="https://t.me/tribute?start=sd1c" className={classes.link}>
                        <Cell
                            before={
                                <IconPigMoney
                                    size={28}
                                    stroke={1.2}
                                    className={classNames(classes.linkIcon, classes.donutIcon)}
                                />
                            }
                        >
                            {t('menu.donate')}
                        </Cell>
                    </Link>
                    <Link to="https://t.me/kit42_app" className={classes.link}>
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
                    <Input placeholder={t('menu.search_placeholder')} />
                </div>

                {AccountsRow()}
            </div>

            <List style={{ padding: 16 }}>{Content()}</List>

            <AuthorizationModal open={authorizationOpen} onOpenChange={(open) => setAuthorizationOpen(open)} />
        </>
    );
}
