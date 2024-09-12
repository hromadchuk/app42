import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { CallAPI } from '../lib/helpers.ts';
import { isDev } from '../lib/utils.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import dayjs from 'dayjs';

type TOwner = Api.Channel | Api.Chat;

interface IOwnerInfo {
    owner: TOwner;
    lastActive: number;
}

export default function InactiveChannels() {
    const { mt, needHideContent, setProgress, setFinishBlock, setListAction } = useContext(MethodContext);

    const [inactiveOwners, setInactiveOwners] = useState<IOwnerInfo[] | null>(null);

    useEffect(() => {
        getOwners();
    }, []);

    async function getOwners() {
        setProgress({});

        const owners = await CallAPI(new Api.channels.GetInactiveChannels());

        if (!owners.chats.length) {
            setFinishBlock({ state: 'done', text: mt('no_inactive') });
            return;
        }

        const list: IOwnerInfo[] = [];
        for (let i = 0; i < owners.chats.length; i++) {
            const chat = owners.chats[i] as TOwner;

            list.push({ owner: chat, lastActive: owners.dates[i] });
        }

        setInactiveOwners(list);
        setProgress(null);
    }

    if (needHideContent()) return null;

    if (!inactiveOwners) return null;

    const descriptions = inactiveOwners.reduce(
        (acc, ownerInfo) => {
            acc[ownerInfo.owner.id.valueOf()] = mt('last_active').replace(
                '{diff_time}',
                dayjs().to(dayjs(ownerInfo.lastActive * 1000))
            );

            return acc;
        },
        {} as Record<string | number, string>
    );

    setListAction({
        buttonText: mt('button_clear'),
        loadingText: mt('clearing_progress'),
        requestSleep: 777,
        owners: inactiveOwners.map((ownerInfo) => ownerInfo.owner),
        descriptions,
        action: async (owner) => {
            if (isDev) {
                console.log('Leave', {
                    id: owner.id.valueOf()
                });
            } else {
                await CallAPI(
                    new Api.channels.LeaveChannel({
                        channel: owner.id
                    })
                );
            }
        }
    });
}
