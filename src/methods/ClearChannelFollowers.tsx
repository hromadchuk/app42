import { useContext, useEffect, useState } from 'react';
import { ActionIcon, Button, CopyButton, Input, Space, TextInput } from '@mantine/core';
import { IconAt, IconCheck, IconCopy } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI, declineAndFormat } from '../lib/helpers.tsx';

import { MethodContext } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

export const ClearChannelFollowers = () => {
    const { mt, md, needHideContent, setProgress } = useContext(MethodContext);

    const [channels, setChannels] = useState<Api.Channel[]>([]);

    useEffect(() => {
        getChannels();
    }, []);

    async function getChannels() {
        const adminChannels = await CallAPI(
            new Api.channels.GetAdminedPublicChannels({
                // byLocation: true,
                // checkLimit: true,
            })
        );

        setChannels(adminChannels.chats as Api.Channel[]);
    }

    async function selectChannel(channel: Api.Channel) {
        console.log('channel', channel);

        setProgress({ text: mt('loading_members'), total: channel.participantsCount as number });
    }

    if (needHideContent()) return null;

    if (channels) {
        return channels.map((channel, key) => (
            <OwnerRow
                key={key}
                owner={channel}
                description={declineAndFormat(Number(channel.participantsCount), md('decline_members'))}
                callback={() => selectChannel(channel)}
            />
        ));
    }

    return (
        <>
            asd
        </>
    );
};

export default ClearChannelFollowers;
