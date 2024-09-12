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
import { useCloudStorage, useUtils } from '@telegram-apps/sdk-react';
import dayjs from 'dayjs';
import Lottie from 'lottie-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CopyButton } from '../components/CopyButton.tsx';
import { WrappedCell } from '../components/Helpers.tsx';
import { Constants } from '../constants.ts';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { ServerResponses } from '../interfaces/server.ts';
import { getCache, setCache } from '../lib/cache.ts';
import { classNames, getShareLink } from '../lib/helpers.ts';
import { getContactsNames } from '../lib/logic_helpers.ts';
import { isDev, wrapCallMAMethod } from '../lib/utils.ts';

import AnimatedDuckFaceControl from '../assets/animated_stickers/duck_face_control.json';
import { t } from '../lib/lang.ts';

import commonClasses from '../styles/Common.module.css';

export default function ContactsNames() {
    const { mt, needHideContent, setProgress } = useContext(MethodContext);

    const storage = useCloudStorage();
    const utils = useUtils();
    const navigate = useNavigate();
    const [needShowWarning, setShowWarning] = useState<boolean>(false);
    const [serverData, setServerData] = useState<ServerResponses['get_my_names'] | null>(null);

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
                (async () => {
                    setProgress({});

                    const data = await getContactsNames();

                    setServerData(data);
                    setProgress(null);
                })();
            }
        });
    }, []);

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
                        onClick={async () => {
                            if (isDev) {
                                setCache(Constants.ALLOW_USE_CONTACTS_NAMES_KEY, 'allow', 15);
                            } else {
                                wrapCallMAMethod<string>(() => {
                                    storage.set(Constants.ALLOW_USE_CONTACTS_NAMES_KEY, 'allow');
                                });
                            }

                            setShowWarning(false);
                            setProgress({});

                            const data = await getContactsNames();

                            setServerData(data);
                            setProgress(null);
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
