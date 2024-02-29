import { Container } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { IconShare2 } from '@tabler/icons-react';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { getAvatars, getStringsTimeArray, getTextTime } from '../lib/helpers.ts';
import { OwnerRow } from './OwnerRow.tsx';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { ShareButtons, ShareType } from './Share.tsx';

const DialogWithDate = ({ dialogs }: { dialogs: Api.Channel[] | Api.Chat[] }) => {
    const { mt } = useContext(MethodContext);
    const [avatars, setAvatars] = useState<Map<number, string | null>>(new Map());
    const [selectedDialog, setSelectedDialog] = useState<number>(0);

    useEffect(() => {
        getAvatars(dialogs).then(setAvatars);
    }, [dialogs]);

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
        const dialogId = dialog.id.valueOf();

        return (
            <div key={key}>
                <OwnerRow
                    owner={dialog}
                    description={`${createdText} (${createdDateText})`}
                    rightIcon={IconShare2}
                    callback={() => {
                        setSelectedDialog(dialogId);
                    }}
                />

                {selectedDialog === dialogId && (
                    <Container m="xs">
                        <ShareButtons
                            owner={dialog}
                            type={ShareType.REG_DATE}
                            data={{
                                title: channelCreatedTimeAgoText[0],
                                subTitle: channelCreatedTimeAgoText.slice(1).join(' '),
                                description: mt('share_description'),
                                bottomNameText: dialog.title,
                                bottomDateText: mt('was_created_date').replace('{date}', createdDateText),
                                avatar: avatarUrl
                            }}
                        />
                    </Container>
                )}
            </div>
        );
    });
};

export default DialogWithDate;
