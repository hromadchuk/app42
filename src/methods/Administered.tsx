import { useContext, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { Api } from 'telegram';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { TOwnerType } from '../lib/helpers.ts';

export default function Administered() {
    const { mt, needHideContent, setFinishBlock, getDialogs } = useContext(MethodContext);

    const [adminsList, setAdminsList] = useState<TOwnerType[] | null>(null);

    useEffect(() => {
        (async () => {
            const dialogs = await getDialogs({
                types: [Api.Chat, Api.Channel]
            });

            const adminChats = dialogs.filter((dialog) => {
                const correctType = dialog as TDialogWithoutUser;

                if (correctType.creator) {
                    return true;
                }

                return Boolean(correctType.adminRights);
            });

            if (!adminChats.length) {
                setFinishBlock({ state: 'error', text: mt('no_admins') });
                return;
            }

            setAdminsList(adminChats);
        })();
    }, []);

    if (needHideContent()) return null;

    if (adminsList?.length) {
        return (
            <>
                <Text c="dimmed">{mt('title').replace('{count}', adminsList.length.toString())}</Text>

                {adminsList.map((dialog, key) => {
                    const correctType = dialog as TDialogWithoutUser;

                    return (
                        <OwnerRow
                            key={key}
                            owner={dialog}
                            description={correctType.creator ? mt('creator') : mt('admin')}
                        />
                    );
                })}
            </>
        );
    }

    return null;
};
