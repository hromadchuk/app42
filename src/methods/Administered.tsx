import { useContext, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { Api } from 'telegram';

import { MethodContext, TDialogType } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

export const Administered = () => {
    const { mt, needHideContent, setFinishBlock, getDialogs } = useContext(MethodContext);

    const [adminsList, setAdminsList] = useState<TDialogType[] | null>(null);

    useEffect(() => {
        (async () => {
            const dialogs = await getDialogs({
                types: [Api.Chat, Api.Channel]
            });

            const adminChats = dialogs.filter((dialog) => {
                const correctType = dialog as Exclude<TDialogType, Api.User>;

                if (correctType.creator) {
                    return true;
                }

                if (correctType.adminRights) {
                    return true;
                }

                return false;
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
                    const correctType = dialog as Exclude<TDialogType, Api.User>;

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

export default Administered;
