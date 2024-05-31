import { Section } from '@telegram-apps/telegram-ui';
import { useContext, useEffect, useState } from 'react';
import { IconShare2 } from '@tabler/icons-react';
import { Api } from 'telegram';
import { classNames, getAvatars, getStringsTimeArray, getTextTime, notifyError } from '../lib/helpers.ts';
import { canShare, ShareType } from '../modals/ShareModal.tsx';
import { OwnerRow } from './OwnerRow.tsx';
import dayjs from 'dayjs';

import { AppContext } from '../contexts/AppContext.tsx';
import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

export function DialogWithDate({ dialogs }: { dialogs: Api.Channel[] | Api.Chat[] }) {
    const { showShareModal } = useContext(AppContext);
    const { mt, t } = useContext(MethodContext);
    const [avatars, setAvatars] = useState<Map<number, string | null>>(new Map());

    useEffect(() => {
        getAvatars(dialogs).then(setAvatars);
    }, [dialogs]);

    function UsersRow() {
        return dialogs.map((dialog, key) => {
            const createdDate = dayjs(dialog.date * 1000);
            const diffInSeconds = dayjs().diff(createdDate, 'second');
            let textTime = mt('today');

            if (diffInSeconds > 24 * 60 * 60) {
                textTime = getTextTime(diffInSeconds, true);
            }

            const channelCreatedTimeAgoText = getStringsTimeArray(diffInSeconds, true);

            const createdText = mt('created').replace('{time}', textTime);
            const createdDateText = createdDate.format('LL');
            const avatarUrl = avatars.get(dialog.id.valueOf()) || null;

            return (
                <OwnerRow
                    key={key}
                    owner={dialog}
                    description={`${createdText} (${createdDateText})`}
                    rightIcon={IconShare2}
                    callback={() => {
                        canShare(dialog).then((share) => {
                            if (share.canPost) {
                                showShareModal({
                                    owner: dialog,
                                    type: ShareType.REG_DATE,
                                    data: {
                                        title: channelCreatedTimeAgoText[0],
                                        subTitle: channelCreatedTimeAgoText.slice(1).join(' '),
                                        description: mt('share_description'),
                                        bottomText: dialog.title,
                                        bottomDateText: mt('was_created_date').replace('{date}', createdDateText),
                                        avatar: avatarUrl
                                    }
                                });
                            } else {
                                notifyError({
                                    title: t('share.cant_share.title'),
                                    message: t('share.cant_share.description')
                                });
                            }
                        });
                    }}
                />
            );
        });
    }

    return <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>{UsersRow()}</Section>;
}
