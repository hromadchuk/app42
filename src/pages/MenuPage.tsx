import { useUtils } from '@telegram-apps/sdk-react';
import { useContext, useEffect, useState } from 'react';
import {
    Avatar,
    AvatarStack,
    Blockquote,
    Divider,
    Input,
    List,
    Placeholder,
    Section,
    Spinner,
    Tappable
} from '@telegram-apps/telegram-ui';
import { IconNews, IconSearch, IconShare2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTonAddress } from '@tonconnect/ui-react';
import { cards } from '../cards.ts';
import { WrappedCell } from '../components/Helpers.tsx';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { getShareLink } from '../lib/helpers.ts';
import { getMethodById, getMethodsByName } from '../routes.tsx';
import { t, to } from '../lib/lang.ts';

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
    const { user, setAccountsModalOpen, isUserChecked, openMethod } = useContext(AppContext);
    const [randomMethodId, setRandomMethodId] = useState<string | null>(null);

    const userFriendlyAddress = useTonAddress();
    const navigate = useNavigate();
    const utils = useUtils();

    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const recommendations = to<{ [key: string]: string }>('menu.recommendations');
        const recommendationIds = Object.keys(recommendations);
        const randomRecommendationId = recommendationIds[Number(new Date()) % recommendationIds.length];

        setRandomMethodId(randomRecommendationId);
    }, []);

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
                onClick={() => (isUserChecked || userFriendlyAddress) && setAccountsModalOpen(true)}
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
                <RandomMethodRow />

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
                        before={<IconNews size={28} stroke={1.2} />}
                        href="https://t.me/app42news"
                        className={classes.link}
                    >
                        {t('menu.telegram_channel')}
                    </WrappedCell>

                    <WrappedCell
                        before={<IconShare2 size={28} stroke={1.2} />}
                        className={classes.link}
                        onClick={() => {
                            utils.openTelegramLink(getShareLink(t('menu.share_description')));
                        }}
                    >
                        {t('menu.share_app')}
                    </WrappedCell>
                </Section>

                <PopularMethodsRow />

                <Blockquote>
                    <div dangerouslySetInnerHTML={{ __html: getInfoTextWithLink() }}></div>
                </Blockquote>
            </>
        );
    }

    function RandomMethodRow() {
        if (!randomMethodId) {
            return null;
        }

        const method = getMethodById(randomMethodId);
        if (!method) {
            return null;
        }

        return (
            <Section className={classes.categories}>
                <Section.Header style={{ paddingTop: 4 }}>{t('menu.recommend_method')}</Section.Header>

                <WrappedCell
                    before={<method.icon size={28} stroke={1.2} />}
                    onClick={() => openMethod(method)}
                    description={t(`menu.recommendations.${method.id}`)}
                    className={classes.link}
                    multiline={true}
                >
                    {method.name}
                </WrappedCell>
            </Section>
        );
    }

    function PopularMethodsRow() {
        if (!window.initData.topMethods?.length) {
            return null;
        }

        const methods = window.initData.topMethods.map((methodId) => getMethodById(methodId)).filter(Boolean);
        if (!methods.length) {
            return null;
        }

        return (
            <Section className={classes.categories}>
                <Section.Header style={{ paddingTop: 4 }}>{t('menu.popular_methods')}</Section.Header>

                {methods.map((method) => (
                    <WrappedCell
                        key={method.id}
                        before={<method.icon size={28} stroke={1.2} />}
                        onClick={() => openMethod(method)}
                        className={classes.link}
                        multiline={true}
                    >
                        {method.name}
                    </WrappedCell>
                ))}
            </Section>
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
