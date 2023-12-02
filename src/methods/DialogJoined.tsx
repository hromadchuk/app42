import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';

import { MethodContext, TDialogType } from '../contexts/MethodContext.tsx';
import DialogWithDate from '../components/DialogWithDate.tsx';

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

            return !correctType.creator;
        });

        if (!dialogs.length) {
            setFinishBlock({ state: 'error', text: mt('no_dialogs') });
            return;
        }

        const sorted = (createdChannels as Api.Channel[]).sort((a, b) => a.date - b.date);

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
