import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { DialogWithDate } from '../components/DialogWithDate.tsx';
import { getDialogs } from '../lib/logic_helpers.ts';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';

export default function DialogJoined() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [channels, setChannels] = useState<Api.Channel[] | null>(null);

    useEffect(() => {
        getChannels();
    }, []);

    async function getChannels() {
        setProgress({});

        const dialogs = await getDialogs<Api.Chat | Api.Channel>(
            {
                types: [Api.Chat, Api.Channel]
            },
            { setProgress }
        );

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
        return <DialogWithDate dialogs={channels} withoutSharing={true} />;
    }
}
