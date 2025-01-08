import { useContext, useState } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { Api } from 'telegram';
import { WrappedCell } from '../components/Helpers.tsx';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { useAsyncEffect } from '../hooks/useAsyncEffect.ts';
import { CallAPI, classNames, sleep } from '../lib/helpers.ts';
import commonClasses from '../styles/Common.module.css';

interface IUserItem {
    user: Api.TypeUser;
    personalChannel: Api.Channel;
}

export default function OwnChannels() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [usersList, setUsersList] = useState<IUserItem[]>([]);

    useAsyncEffect(async () => {
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
    }, []);

    if (needHideContent()) return null;

    function getUserName(user: Api.User) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }

    function getChannelUrl(channel: Api.Channel) {
        if (channel.username || channel.usernames) {
            const username = (channel.usernames ? channel.usernames[0].username : channel.username) as string;

            return `https://t.me/${username}`;
        }

        return undefined;
    }

    if (usersList.length) {
        return (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                {usersList.map(({ user, personalChannel }, key) => {
                    return (
                        <WrappedCell
                            key={key}
                            before={<OwnerAvatar size={48} owner={personalChannel} />}
                            href={getChannelUrl(personalChannel)}
                            description={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <OwnerAvatar size={20} owner={user} /> {getUserName(user as Api.User)}
                                </div>
                            }
                            style={{ borderRadius: 'inherit' }}
                        >
                            {personalChannel.title}
                        </WrappedCell>
                    );
                })}
            </Section>
        );
    }
}
