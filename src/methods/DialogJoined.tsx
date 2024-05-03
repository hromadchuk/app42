import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import DialogWithDate from '../components/DialogWithDate.tsx';

export default function ChannelsRegistration() {
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
            const correctType = dialog as TDialogWithoutUser;

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
}
