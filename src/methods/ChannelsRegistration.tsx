import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { getTextTime } from '../lib/helpers.ts';
import dayjs from 'dayjs';

import { MethodContext, TDialogType } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

export const ChannelsRegistration = () => {
    const { mt, needHideContent, setProgress, setFinishBlock, getDialogs } = useContext(MethodContext);

    const [channels, setChannels] = useState<Api.Channel[] | null>(null);

    useEffect(() => {
        getChannels();
    }, []);

    async function getChannels() {
        setProgress({});

        const dialogs = await getDialogs({
            types: [Api.Chat, Api.Channel]
        });

        const createdChannels = dialogs.filter((dialog) => {
            const correctType = dialog as Exclude<TDialogType, Api.User>;

            return correctType.creator;
        });

        if (!dialogs.length) {
            setFinishBlock({ state: 'error', text: mt('no_created') });
            return;
        }

        const sorted = (createdChannels as Api.Channel[]).sort((a, b) => a.date - b.date);

        setChannels(sorted);
        setProgress(null);
    }

    if (needHideContent()) return null;

    if (channels) {
        return (
            <>
                {channels.map((channel, key) => {
                    const createdDate = dayjs(channel.date * 1000);
                    const diffInSeconds = dayjs().diff(createdDate, 'second');
                    let textTime = mt('today');

                    if (diffInSeconds > 24 * 60 * 60) {
                        textTime = getTextTime(diffInSeconds, true);
                    }

                    const createdText = mt('created').replace('{time}', textTime);
                    const createdDateText = createdDate.format('LL');

                    return <OwnerRow key={key} owner={channel} description={`${createdText} (${createdDateText})`} />;
                })}
            </>
        );
    }

    return null;
};

export default ChannelsRegistration;
