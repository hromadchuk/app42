import { useDisclosure } from '@mantine/hooks';
import { useContext, useEffect, useState } from 'react';
import { Divider, Modal } from '@mantine/core';
import { IconClock, IconClockUp, IconPhone, IconUsers } from '@tabler/icons-react';
import { Api } from 'telegram';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import { InfoRow } from '../components/InfoRow.tsx';
import { ShareButtons, ShareType } from '../components/Share.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import { ICallStatImagesOptions } from '../images_generator/CallStatImagesGenerator.ts';
import { CallAPI, declineAndFormat, getShortTextTime, getTextTime } from '../lib/helpers.ts';

import { AppContext } from '../contexts/AppContext.tsx';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

enum ETabId {
    calls = 'calls',
    duration = 'duration',
    maxDuration = 'maxDuration'
}

interface IUserStat {
    calls: number;
    duration: number;
    maxDuration: number;
}

interface IUserTop extends IUserStat {
    time: number[][];
    user: Api.User;
}

interface IStatResult {
    activity: number[][];
    counts: {
        calls: number;
        duration: number;
        maxDuration: number;
        participants: number;
    };
    tops: {
        calls: IUserTop[];
        duration: IUserTop[];
        maxDuration: IUserTop[];
    };
}

export const CallsStat = () => {
    const { user: appUser } = useContext(AppContext);
    const { mt, md, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [isModalOpened, { open, close }] = useDisclosure(false);
    const [stat, setStat] = useState<IStatResult | null>(null);
    const [modalData, setModalData] = useState<IUserTop | null>(null);
    const [shareData, setShareData] = useState<ICallStatImagesOptions | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.calls);

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

                    setProgress({ total: data.count, count: allMessages.length });
                }
            } while (work);

            const userActionsByTime = new CalculateActivityTime();

            if (!allMessages.length) {
                setFinishBlock({ text: mt('no_calls'), state: 'error' });
                setProgress(null);
                return;
            }

            allMessages.forEach((message) => {
                const typedMessage = message as Api.Message;
                const action = typedMessage.action;

                if (!(action instanceof Api.MessageActionPhoneCall)) {
                    console.log('unknown event', message);
                    return;
                }

                const peerId = typedMessage.peerId;
                const userId = (peerId as Api.PeerUser).userId.valueOf();
                const currentStat = usersStat.get(userId) || { calls: 0, duration: 0, maxDuration: 0 };

                userActionsByTime.add(userId, typedMessage.date);
                userActionsByTime.add(0, typedMessage.date);

                usersStat.set(userId, {
                    calls: currentStat.calls + 1,
                    duration: currentStat.duration + (action.duration || 0),
                    maxDuration: Math.max(currentStat.maxDuration, action.duration || 0)
                });
            });

            // totals
            const totalCalls = Array.from(usersStat.values()).reduce((res, user) => res + user.calls, 0);
            const totalDuration = Array.from(usersStat.values()).reduce((res, user) => res + user.duration, 0);
            const maxDuration = Array.from(usersStat.values()).reduce(
                (res, user) => Math.max(res, user.maxDuration),
                0
            );

            // tops
            const getTopUser = ([userId, user]: [number, IUserStat]): IUserTop => {
                const time = userActionsByTime.get(userId);
                const findUser = users.get(userId) as Api.User;

                return {
                    ...user,
                    time,
                    user: findUser
                };
            };

            const topByCalls = Array.from(usersStat.entries())
                .sort((a, b) => b[1].calls - a[1].calls)
                .map(getTopUser);

            const topByDuration = Array.from(usersStat.entries())
                .sort((a, b) => b[1].duration - a[1].duration)
                .map(getTopUser);

            const topByMaxDuration = Array.from(usersStat.entries())
                .sort((a, b) => b[1].maxDuration - a[1].maxDuration)
                .map(getTopUser);

            const result: IStatResult = {
                activity: userActionsByTime.get(0),
                counts: {
                    calls: totalCalls,
                    duration: totalDuration,
                    maxDuration,
                    participants: users.size
                },
                tops: {
                    calls: topByCalls,
                    duration: topByDuration,
                    maxDuration: topByMaxDuration
                }
            };

            setShareData({
                title: mt('sharing.title'),
                totalDurationCount: getShortTextTime(totalDuration, 3),
                totalDurationLabel: mt('sharing.total_duration'),
                callsCount: totalCalls,
                callsLabel: mt('sharing.total_calls'),
                participantsCount: users.size,
                participantsLabel: mt('sharing.participants'),
                maxDurationCount: getShortTextTime(maxDuration, 3),
                maxDurationLabel: mt('sharing.max_duration')
            });

            setStat(result);
            setProgress(null);
        })();
    }, []);

    function UsersContent() {
        if (!stat) return null;

        const topUsers = stat.tops[selectedTab];

        const getDescription = (row: IUserTop): string => {
            if (selectedTab === ETabId.duration) {
                return getTextTime(row.duration);
            }

            if (selectedTab === ETabId.maxDuration) {
                return getTextTime(row.maxDuration);
            }

            return declineAndFormat(row.calls, md('calls_decline'));
        };

        return topUsers.map((row, key) => (
            <OwnerRow
                key={selectedTab + key}
                owner={row.user}
                description={getDescription(row)}
                callback={() => {
                    setModalData(row);
                    open();
                }}
            />
        ));
    }

    if (needHideContent()) return null;

    const tabsList: ITabItem[] = [
        {
            id: ETabId.calls,
            name: mt('tops.calls'),
            icon: IconPhone
        },
        {
            id: ETabId.duration,
            name: mt('tops.duration'),
            icon: IconClock
        },
        {
            id: ETabId.maxDuration,
            name: mt('tops.max_duration'),
            icon: IconClockUp
        }
    ];

    if (stat) {
        return (
            <>
                <Modal opened={isModalOpened} onClose={close} title={mt('modal_title')}>
                    {modalData && (
                        <>
                            <OwnerRow owner={modalData.user as Api.User} />
                            <Divider my="sm" />
                            <InfoRow title={mt('counts.calls')} count={modalData.calls} icon={IconPhone} />
                            <InfoRow
                                title={mt('counts.duration')}
                                description={getTextTime(modalData.duration)}
                                icon={IconClock}
                            />
                            <InfoRow
                                title={mt('counts.max_duration')}
                                description={getTextTime(modalData.maxDuration)}
                                icon={IconClockUp}
                            />
                            <Divider my="sm" />
                            <ActivityChart data={modalData.time} />
                        </>
                    )}
                </Modal>

                <InfoRow title={mt('counts.calls')} count={stat.counts.calls} icon={IconPhone} />
                <InfoRow title={mt('counts.participants')} count={stat.counts.participants} icon={IconUsers} />
                <InfoRow
                    title={mt('counts.duration')}
                    description={getTextTime(stat.counts.duration)}
                    icon={IconClock}
                />
                <InfoRow
                    title={mt('counts.max_duration')}
                    description={getTextTime(stat.counts.maxDuration)}
                    icon={IconClockUp}
                />

                {shareData && <ShareButtons owner={appUser as Api.User} type={ShareType.CALL_STAT} data={shareData} />}

                <ActivityChart data={stat.activity} />

                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                <UsersContent />
            </>
        );
    }

    return null;
};

export default CallsStat;
