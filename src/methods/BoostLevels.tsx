import { useContext, useState } from 'react';
import { Placeholder, Section } from '@telegram-apps/telegram-ui';
import { IconMessages, IconUsersGroup } from '@tabler/icons-react';
import { Api } from 'telegram';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import useAsyncEffect from '../hooks/useAsyncEffect.ts';
import { classNames } from '../lib/helpers.ts';
import { getDialogs } from '../lib/logic_helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface IResult {
    channels: Api.Channel[];
    chats: Api.Channel[];
}

enum ETabId {
    chats = 'chats',
    channels = 'channels'
}

export default function BoostLevels() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [lists, setLists] = useState<IResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.channels);

    useAsyncEffect(async () => {
        setProgress({});

        const dialogs = await getDialogs<Api.Channel>(
            {
                types: [Api.Channel]
            },
            { setProgress }
        );

        const withLevel = dialogs.filter((dialog) => {
            return Boolean(dialog.level);
        });

        if (!withLevel.length) {
            setFinishBlock({ state: 'error', text: mt('no_boost') });
            return;
        }

        withLevel.sort((a, b) => Number(b.level) - Number(a.level));

        const chats = withLevel.filter((dialog) => dialog.megagroup);
        const channels = withLevel.filter((dialog) => !dialog.megagroup);

        setLists({ chats, channels });
        setProgress(null);
    });

    if (needHideContent()) return null;

    if (lists) {
        const tabsList: ITabItem[] = [
            {
                id: ETabId.channels,
                name: mt('channels'),
                icon: IconUsersGroup
            },
            {
                id: ETabId.chats,
                name: mt('chats'),
                icon: IconMessages
            }
        ];

        const list = lists[selectedTab];

        return (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />

                {list.length ? (
                    list.map((owner) => (
                        <OwnerRow
                            owner={owner}
                            key={owner.id.valueOf()}
                            description={mt('level').replace('{level}', String(owner.level || 0))}
                        />
                    ))
                ) : (
                    <Placeholder description={mt('no_list')} />
                )}
            </Section>
        );
    }
}
