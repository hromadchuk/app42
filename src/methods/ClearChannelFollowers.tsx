import { useContext, useEffect, useState } from 'react';
import { ActionIcon, Button, CopyButton, Input, Space, TextInput } from '@mantine/core';
import { IconAt, IconCheck, IconCopy } from '@tabler/icons-react';
import { Api } from 'telegram';
import { ChannelParticipantsRecent } from 'telegram/tl/api';
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

        // setProgress({ text: mt('loading_members'), total: channel.participantsCount as number });

        const users = await CallAPI(
            new Api.channels.GetParticipants({
                channel,
                filter: new Api.ChannelParticipantsRecent(),
                offset: 100,
                limit: 200,
            })
        );
    }

    if (needHideContent()) return null;

    if (channels) {
        return channels.map((channel, key) => {
            const hasRights = Boolean(channel.adminRights?.banUsers);
            const description = [declineAndFormat(Number(channel.participantsCount), md('decline_members'))];

            if (!hasRights) {
                description.push(mt('no_rights'));
            }

            return (
                <OwnerRow
                    key={key}
                    owner={channel}
                    disabled={!hasRights}
                    description={description.join(', ')}
                    callback={() => selectChannel(channel)}
                />
            );
        });
    }

    return (
        <>
            asd
        </>
    );
};

export default ClearChannelFollowers;
