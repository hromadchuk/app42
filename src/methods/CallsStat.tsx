import { useContext, useEffect, useState } from 'react';
import { Button, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconClock, IconClockUp, IconPhone, IconUsers } from '@tabler/icons-react';
import { Api } from 'telegram';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import { Padding, WrappedCell } from '../components/Helpers.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import { ICallStatImagesOptions } from '../images_generator/CallStatImagesGenerator.ts';
import { CallAPI, classNames, declineAndFormat, getShortTextTime, getTextTime } from '../lib/helpers.ts';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { t } from '../lib/lang.ts';
import { canShare, ShareType } from '../modals/ShareModal.tsx';

import { AppContext } from '../contexts/AppContext.tsx';
import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

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

export default function CallsStat() {
    const { user: appUser, showShareModal } = useContext(AppContext);
    const { mt, md, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    // const [isModalOpened, { open, close }] = useDisclosure(false);
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

            canShare(appUser as Api.User).then((share) => {
                if (share.canPost) {
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
                }
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
                callback={() => setModalData(row)}
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
                <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                    <WrappedCell before={<IconPhone />} after={stat.counts.calls}>
                        {mt('counts.calls')}
                    </WrappedCell>
                    <WrappedCell before={<IconUsers />} after={stat.counts.participants}>
                        {mt('counts.participants')}
                    </WrappedCell>
                    <WrappedCell before={<IconClock />} description={getTextTime(stat.counts.duration)}>
                        {mt('counts.duration')}
                    </WrappedCell>
                    <WrappedCell before={<IconClockUp />} description={getTextTime(stat.counts.maxDuration)}>
                        {mt('counts.max_duration')}
                    </WrappedCell>

                    {shareData && (
                        <Padding>
                            <Button
                                mode="filled"
                                size="m"
                                stretched
                                onClick={() => {
                                    showShareModal({
                                        owner: appUser as Api.User,
                                        type: ShareType.CALL_STAT,
                                        data: shareData
                                    });
                                }}
                            >
                                {t('share.button')}
                            </Button>
                        </Padding>
                    )}

                    <Padding>
                        <ActivityChart data={stat.activity} />
                    </Padding>
                </Section>

                <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                    <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                    <UsersContent />

                    {modalData && (
                        <Modal
                            header={<ModalHeader />}
                            open={Boolean(modalData)}
                            onOpenChange={(open) => {
                                if (!open) {
                                    setModalData(null);
                                }
                            }}
                        >
                            <OwnerRow owner={modalData.user as Api.User} />

                            <WrappedCell before={<IconPhone />} after={modalData.calls}>
                                {mt('counts.calls')}
                            </WrappedCell>
                            <WrappedCell before={<IconClock />} description={getTextTime(modalData.duration)}>
                                {mt('counts.duration')}
                            </WrappedCell>
                            <WrappedCell before={<IconClockUp />} description={getTextTime(modalData.maxDuration)}>
                                {mt('counts.max_duration')}
                            </WrappedCell>

                            <Padding>
                                <ActivityChart data={stat.activity} />
                            </Padding>
                        </Modal>
                    )}
                </Section>
            </>
        );
    }
}
