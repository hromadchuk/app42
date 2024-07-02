import { IconShare2 } from '@tabler/icons-react';
import {
    Badge,
    Blockquote,
    Button,
    Caption,
    InlineButtons,
    Input,
    Placeholder,
    Section
} from '@telegram-apps/telegram-ui';
import { useCloudStorage, useUtils } from '@tma.js/sdk-react';
import dayjs from 'dayjs';
import Lottie from 'lottie-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { CopyButton } from '../components/CopyButton.tsx';
import { WrappedCell } from '../components/Helpers.tsx';
import { Constants } from '../constants.ts';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { getCache, setCache } from '../lib/cache.ts';
import { CallAPI, classNames, getShareLink, isDev, Server, wrapCallMAMethod } from '../lib/helpers.ts';

import AnimatedDuckFaceControl from '../assets/animated_stickers/duck_face_control.json';
import { t } from '../lib/lang.ts';

import commonClasses from '../styles/Common.module.css';

interface IServerData {
    date: number;
    names: {
        name: string;
        count: number;
    }[];
}

const PART_LIMIT = 300;

export default function ContactsNames() {
    const { mt, needHideContent, setProgress } = useContext(MethodContext);

    const storage = useCloudStorage();
    const utils = useUtils();
    const navigate = useNavigate();
    const [needShowWarning, setShowWarning] = useState<boolean>(false);
    const [serverData, setServerData] = useState<IServerData | null>(null);

    useEffect(() => {
        setProgress({});

        const storageData = isDev
            ? getCache(Constants.ALLOW_USE_CONTACTS_NAMES_KEY)
            : wrapCallMAMethod<string>(() => storage.get(Constants.ALLOW_USE_CONTACTS_NAMES_KEY));
        storageData.then((allowUseMethod) => {
            if (allowUseMethod !== 'allow') {
                setShowWarning(true);
                setProgress(null);
            } else {
                getContactsNames();
            }
        });
    }, []);

    async function getContactsNames() {
        setProgress({});

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;
        const usersParts: [number, string][] = [];

        result.users.forEach((user) => {
            if (user instanceof Api.User) {
                usersParts.push([user.id.valueOf(), `${user.firstName || ''} ${user.lastName || ''}`.trim()]);
            }
        });

        const firstSyncPart = getPart(usersParts.splice(0, PART_LIMIT));
        const data = await Server<IServerData>('get-my-names', { list: firstSyncPart });

        while (usersParts.length) {
            const part = getPart(usersParts.splice(0, PART_LIMIT));

            Server<IServerData>('get-my-names', { list: part, onlySync: part });
        }

        setServerData(data);
        setProgress(null);
    }

    function getPart(users: [number, string][]) {
        const result: { [key: number]: string } = {};

        users.forEach(([id, name]) => {
            result[id] = name;
        });

        return result;
    }

    if (needHideContent()) return null;

    if (needShowWarning) {
        return (
            <>
                <Placeholder description={mt('allow_description')}>
                    <Lottie animationData={AnimatedDuckFaceControl} loop className={commonClasses.partWidth} />
                </Placeholder>

                <InlineButtons className={commonClasses.center}>
                    <Button
                        mode="gray"
                        size="s"
                        onClick={() => {
                            navigate('/');
                        }}
                    >
                        {mt('decline_button')}
                    </Button>

                    <Button
                        mode="filled"
                        size="s"
                        onClick={() => {
                            if (isDev) {
                                setCache(Constants.ALLOW_USE_CONTACTS_NAMES_KEY, 'allow', 15);
                            } else {
                                wrapCallMAMethod<string>(() => {
                                    storage.set(Constants.ALLOW_USE_CONTACTS_NAMES_KEY, 'allow');
                                });
                            }

                            setShowWarning(false);
                            getContactsNames();
                        }}
                    >
                        {mt('allow_button')}
                    </Button>
                </InlineButtons>
            </>
        );
    }

    function LinkRow() {
        const link = 'https://t.me/app42/app?startapp=cn';

        return (
            <Section className={commonClasses.sectionBox}>
                <Blockquote>{mt('share_description')}</Blockquote>

                <div className={commonClasses.fixSearchBackground}>
                    <Input
                        after={
                            <>
                                <CopyButton value={link} />
                            </>
                        }
                        value={link}
                        readOnly
                    />

                    <Button
                        stretched={true}
                        mode="filled"
                        size="l"
                        before={<IconShare2 size={24} />}
                        onClick={() => {
                            utils.openTelegramLink(getShareLink(mt('share_message'), 'cn'));
                        }}
                    >
                        {t('common.share')}
                    </Button>
                </div>
            </Section>
        );
    }

    if (serverData) {
        if (serverData.names.length) {
            return (
                <>
                    <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                        {serverData.names.map(({ name, count }, key) => (
                            <WrappedCell
                                key={key}
                                after={
                                    <Badge type="number" mode="secondary">
                                        {count}
                                    </Badge>
                                }
                            >
                                {name}
                            </WrappedCell>
                        ))}
                    </Section>

                    <Caption className={commonClasses.footerCount}>
                        {mt('updated').replace('{date}', dayjs(serverData.date).format('MMM D, YYYY h:mm:ss A'))}
                    </Caption>

                    <LinkRow />
                </>
            );
        }

        return (
            <>
                <Placeholder description={mt('no_records')} />
                <Caption className={commonClasses.footerCount}>
                    {mt('updated').replace('{date}', dayjs(serverData.date).format('MMM D, YYYY h:mm:ss A'))}
                </Caption>

                <LinkRow />
            </>
        );
    }
}
