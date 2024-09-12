import { useContext, useEffect, useState } from 'react';
import { Caption, Section } from '@telegram-apps/telegram-ui';
import { Api } from 'telegram';

import { OwnerRow } from '../components/OwnerRow.tsx';
import { TOwnerType } from '../lib/helpers.ts';
import { getDialogs } from '../lib/logic_helpers.ts';
import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

export default function Administered() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [adminsList, setAdminsList] = useState<TOwnerType[] | null>(null);

    useEffect(() => {
        (async () => {
            const dialogs = await getDialogs<Api.Chat | Api.Channel>(
                {
                    types: [Api.Chat, Api.Channel]
                },
                {
                    setProgress
                }
            );

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
            <Section className={commonClasses.sectionBox}>
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

                <Caption className={commonClasses.footerCount}>
                    {mt('title').replace('{count}', adminsList.length.toString())}
                </Caption>
            </Section>
        );
    }
}
