import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { CallAPI } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import DialogWithDate from '../components/DialogWithDate.tsx';

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
        return <DialogWithDate dialogs={channels} />;
    }

    return null;
};

export default ChannelsRegistration;
