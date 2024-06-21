import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { getDialogs } from '../lib/logic_helpers.ts';
import { DialogWithDate } from '../components/DialogWithDate.tsx';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';

export default function ChannelsRegistration() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [channels, setChannels] = useState<Api.Channel[] | null>(null);

    useEffect(() => {
        getChannels();
    }, []);

    async function getChannels() {
        setProgress({});

        const dialogs = await getDialogs(
            {
                types: [Api.Chat, Api.Channel]
            },
            {
                setProgress
            }
        );

        const createdChannels = dialogs.filter((dialog) => {
            const correctType = dialog as TDialogWithoutUser;

            return correctType.creator;
        });

        if (!createdChannels.length) {
            setFinishBlock({ state: 'error', text: mt('no_created') });
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
}
