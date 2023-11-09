import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import { CallAPI } from '../lib/helpers.tsx';
import dayjs from 'dayjs';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

type TOwner = Api.Channel | Api.Chat;

interface IOwnerInfo {
    owner: TOwner;
    lastActive: number;
}

export const InactiveChannels = () => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

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

    if (inactiveOwners) {
        return (
            <>
                {inactiveOwners.map((owner, key) => (
                    <OwnerRow
                        key={key}
                        owner={owner.owner}
                        description={mt('last_active').replace(
                            '{diff_time}',
                            dayjs().to(dayjs(owner.lastActive * 1000))
                        )}
                    />
                ))}
            </>
        );
    }

    return null;
};

export default InactiveChannels;
