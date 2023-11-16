import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { CallAPI, getTextTime } from '../lib/helpers.tsx';
import dayjs from 'dayjs';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

export const ChannelsRegistration = () => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [channels, setChannels] = useState<Api.Channel[] | null>(null);

    useEffect(() => {
        getChannels();
    }, []);

    async function getChannels() {
        setProgress({});

        const { chats } = await CallAPI(new Api.channels.GetAdminedPublicChannels({}));

        if (!chats.length) {
            setFinishBlock({ state: 'error', text: mt('no_created') });
            return;
        }

        const sorted = (chats as Api.Channel[]).sort((a, b) => a.date - b.date);

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
                    const createdText = mt('created').replace('{time}', getTextTime(diffInSeconds, true));
                    const createdDateText = createdDate.format('LL');

                    return <OwnerRow key={key} owner={channel} description={`${createdText} (${createdDateText})`} />;
                })}
            </>
        );
    }

    return null;
};

export default ChannelsRegistration;
