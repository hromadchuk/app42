import { useContext, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { Api } from 'telegram';

import { MethodContext, TDialogType } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI } from '../lib/helpers.tsx';

interface IUserStat {
    calls: number;
    duration: number;
    maxDuration: number;
}

export const CallsStat = () => {
    const { mt, needHideContent, setFinishBlock, setProgress, getProgress } = useContext(MethodContext);

    const [adminsList, setAdminsList] = useState<TDialogType[] | null>(null);

    useEffect(() => {
        (async () => {
            setProgress({ text: mt('get_calls') });

            const users = new Map<number, Api.User>();
            const usersStat = new Map<number, IUserStat>();
            const params = {
                q: '',
                limit: 100,
                addOffset: 0,
                filter: new Api.InputMessagesFilterPhoneCalls({}),
                peer: new Api.InputPeerEmpty()
            };

            const allMessages: Api.TypeMessage[] = [];
            let work = false;
            do {
                const data = (await CallAPI(new Api.messages.Search(params))) as Exclude<
                    Api.messages.TypeMessages,
                    Api.messages.MessagesNotModified
                >;

                allMessages.push(...data.messages);

                data.messages.forEach((message) => {
                    const user = data.users.find((findUser) => {
                        const peerId = (message as Api.Message).peerId;
                        const userId = (peerId as Api.PeerUser).userId.valueOf();

                        return findUser.id.valueOf() === userId;
                    }) as Api.User;

                    if (!user) {
                        console.log('user not found', message);
                    }

                    if (user) {
                        users.set(user.id.valueOf(), user);
                    }
                });

                if (data instanceof Api.messages.MessagesSlice) {
                    params.addOffset += params.limit;
                    work = params.addOffset < data.count;

                    setProgress({ ...getProgress(), total: data.count, count: allMessages.length });
                }
            } while (work);

            console.log('allMessages', allMessages);
            console.log('users', users);

            allMessages.forEach((message) => {
                const action = (message as Api.Message).action;

                if (!(action instanceof Api.MessageActionPhoneCall)) {
                    console.log('not call', message);
                    return;
                }

                const peerId = (message as Api.Message).peerId;
                const userId = (peerId as Api.PeerUser).userId.valueOf();

                const currentStat = usersStat.get(userId) || { calls: 0, duration: 0, maxDuration: 0 };

                usersStat.set(userId, {
                    calls: currentStat.calls + 1,
                    duration: currentStat.duration + (action.duration || 0),
                    maxDuration: Math.max(currentStat.maxDuration, action.duration || 0)
                });

                // TODO don't forget about stats by days
            });

            console.log('usersStat', usersStat);
        })();
    }, []);

    if (needHideContent()) return null;

    return 'calls';
};

export default CallsStat;
