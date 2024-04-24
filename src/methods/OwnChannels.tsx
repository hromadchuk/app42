import { Card } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { CallAPI, sleep } from '../lib/helpers.ts';

interface IUserItem {
    user: Api.TypeUser;
    personalChannel: Api.Channel;
}

export const OwnChannels = () => {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [usersList, setUsersList] = useState<IUserItem[]>([]);

    useEffect(() => {
        (async () => {
            setProgress({});

            const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

            if (!result.users?.length) {
                setProgress(null);
                setFinishBlock({ state: 'error', text: mt('no_contacts') });
                return;
            }

            const usersChannels = new Map<number, Api.long>();

            setProgress({ text: mt('get_users_info'), total: result.users.length });

            for (const user of result.users) {
                await sleep(666);
                const { fullUser } = await CallAPI(new Api.users.GetFullUser({ id: user.id }));
                if (fullUser.personalChannelId) {
                    usersChannels.set(user.id.valueOf(), fullUser.personalChannelId);
                }

                setProgress({ addCount: 1 });
            }

            const channelIds = Array.from(usersChannels.values());
            const channels = await CallAPI(new Api.channels.GetChannels({ id: channelIds }));

            const list: IUserItem[] = result.users
                .filter((user) => usersChannels.has(user.id.valueOf()))
                .map((user) => {
                    const channelId = usersChannels.get(user.id.valueOf());
                    const channel = channels.chats.find((chat) => chat.id.valueOf() === channelId?.valueOf());

                    return { user, personalChannel: channel as Api.Channel };
                });

            if (!list.length) {
                setProgress(null);
                setFinishBlock({ state: 'error', text: mt('no_channels') });
                return;
            }

            setUsersList(list);
            setProgress(null);
        })();
    }, []);

    if (needHideContent()) return null;

    if (usersList.length) {
        return usersList.map(({ user, personalChannel }, key) => {
            return (
                <Card radius="md" padding="xs" mb="xs">
                    <Card.Section>
                        <OwnerRow key={key} owner={user} />
                        <OwnerRow key={key} owner={personalChannel} />
                    </Card.Section>
                </Card>
            );
        });
    }

    return null;
};

export default OwnChannels;
