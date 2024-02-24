import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getAvatars, getStringsTimeArray, getTextTime } from '../lib/helpers.ts';
import { OwnerRow } from './OwnerRow.tsx';
import { Api } from 'telegram';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { ShareButtons, ShareType } from './Share.tsx';
import { IRegDateImagesOptions } from '../images_generator/RegDateImagesGenerator.ts';

const DialogWithDate = ({ dialogs }: { dialogs: Api.Channel[] | Api.Chat[] }) => {
    const { mt } = useContext(MethodContext);
    const [avatars, setAvatars] = useState<Map<number, string | null>>(new Map());

    useEffect(() => {
        const getDialogAvatars = async () => {
            setAvatars(await getAvatars(dialogs));
        };
        getDialogAvatars();
    }, [dialogs]);

    return dialogs.map((dialog, key) => {
        const createdDate = dayjs(dialog.date * 1000);
        const diffInSeconds = dayjs().diff(createdDate, 'second');
        let textTime = mt('today');

        if (diffInSeconds > 24 * 60 * 60) {
            textTime = getTextTime(diffInSeconds, true);
        }

        const channelCreatedTimeAgoText = getStringsTimeArray(diffInSeconds);

        const createdText = mt('created').replace('{time}', textTime);
        const createdDateText = createdDate.format('LL');
        const avatarUrl = avatars.get(dialog.id.valueOf()) || null;

        return (
            <div key={key}>
                <OwnerRow owner={dialog} description={`${createdText} (${createdDateText})`} />
                <ShareButtons
                    owner={dialog}
                    type={ShareType.REG_DATE}
                    data={
                        {
                            storyImage: true,
                            messageImage: true,
                            data: {
                                title: channelCreatedTimeAgoText[0],
                                subTitle: channelCreatedTimeAgoText[1],
                                description: mt('share_description'),
                                bottomNameText: dialog.title,
                                bottomDateText: mt('was_created_date').replace('{date}', createdDateText),
                                avatar: avatarUrl
                            }
                        } as IRegDateImagesOptions
                    }
                />
            </div>
        );
    });
};

export default DialogWithDate;
