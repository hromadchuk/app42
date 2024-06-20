import { useContext, useState } from 'react';
import {
    Avatar,
    AvatarStack,
    Divider,
    Input,
    List,
    Placeholder,
    Section,
    Spinner,
    Tappable
} from '@telegram-apps/telegram-ui';
import { IconNews, IconPigMoney, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTonAddress } from '@tonconnect/ui-react';
import { cards } from '../cards.ts';
import { WrappedCell } from '../components/Helpers.tsx';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { getMethodsByName } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import { AppContext } from '../contexts/AppContext.tsx';

import classes from '../styles/MenuPage.module.css';
import TonLogo from '../assets/ton_logo.svg';
import { MethodRow } from './MethodsPage.tsx';

// function getInfoTextWithLink() {
//     return t('menu.info')
//         .replace('{link}', '<a href="https://t.me/iamhro" target="_blank">')
//         .replace('{/link}', '</a>');
// }

export default function MenuPage() {
    const { user, setAccountsModalOpen, isUserChecked } = useContext(AppContext);

    const userFriendlyAddress = useTonAddress();
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');

    function AccountsRow() {
        if (!user && !userFriendlyAddress && isUserChecked) {
            return null;
        }

        const avatars = [];

        if (userFriendlyAddress) {
            avatars.push(<Avatar key="wallet" size={28} src={TonLogo} />);
        }

        if (user) {
            avatars.push(<OwnerAvatar key="user" owner={user} size={28} />);
        } else if (!isUserChecked) {
            avatars.push(
                <div key="avatar-spinner" className={classes.avatarSpinnerBox}>
                    <Avatar size={28} src={''}>
                        <div className={classes.avatarSpinner}>
                            <Spinner size="s" />
                        </div>
                    </Avatar>
                </div>
            );
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
                        <WrappedCell
                            key={key}
                            before={
                                <Avatar size={40} style={{ backgroundColor: card.color }}>
                                    <card.icon size={28} stroke={1.2} color="white" />
                                </Avatar>
                            }
                            description={t(`menu.cards.${card.id}_description`)}
                            multiline={true}
                            onClick={() => {
                                navigate(`/methods/${card.id}`);
                            }}
                        >
                            {t(`menu.cards.${card.id}`)}
                        </WrappedCell>
                    ))}
                </Section>

                <Section className={classes.categories}>
                    <WrappedCell
                        before={<IconPigMoney size={28} stroke={1.2} className={classes.donutIcon} />}
                        href="https://t.me/tribute/app?startapp=donation_13215"
                        className={classes.link}
                    >
                        {t('menu.donate')}
                    </WrappedCell>

                    <WrappedCell
                        before={<IconNews size={28} stroke={1.2} />}
                        href="https://t.me/app42news"
                        className={classes.link}
                    >
                        {t('menu.telegram_channel')}
                    </WrappedCell>
                </Section>

                {/* <Blockquote> */}
                {/*     <div dangerouslySetInnerHTML={{ __html: getInfoTextWithLink() }}></div> */}
                {/* </Blockquote> */}
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
