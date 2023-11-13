import { Button, Center, Divider, Flex, Notification, Text } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
    IconCalendarTime,
    IconHeart,
    IconMessage,
    IconMicrophone,
    IconMoodSmile,
    IconPaperclip,
    IconPhone,
    IconSticker,
    IconVideo,
    TablerIconsProps
} from '@tabler/icons-react';
import { JSX, useContext, useState } from 'react';
import { Api } from 'telegram';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import { declineAndFormat, formatNumber, getTextTime, notifyError } from '../lib/helpers.tsx';
import { getAppLangCode } from '../lib/lang.tsx';
import { InfoRow } from '../components/InfoRow.tsx';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import {
    calculateEstimatedNumberOfPeriodMessages,
    calculatePeriodsMessagesCount,
    filterMessages,
    getMessages,
    getTotalMessagesCount,
    IGetMessagesCallbackArguments,
    IPeriodData,
    TCorrectMessage
} from '../lib/methods/messages.ts';

type TPeriodType = [Date | null, Date | null];

interface IScanDataCalculation {
    firstMessage: TCorrectMessage;
    lastMessage: TCorrectMessage;
    messages: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    stickersTotal: number;
    reactionsTotal: number;
}

interface IScanDataResult {
    messages: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    stickersTotal: number;
    reactionsTotal: number;
}

interface IStatRow {
    icon: (props: TablerIconsProps) => JSX.Element;
    label: string;
    value: number | string;
    isInteger: boolean;
}
enum ETabId {
    reactions = 'reactions'
}

interface ITabTops {
    id: ETabId;
    lang: string;
    icon: (props: TablerIconsProps) => JSX.Element;
}

const channelsInfo = new Map<number, Api.Channel>();

export const RecordsStat = () => {
    const { mt, md, needHideContent, getProgress, setProgress, setFinishBlock } = useContext(MethodContext);

    const [channelRecords, setChannelRecords] = useState<Api.TypeMessage[]>([]);
    const [channelPeriods, setChannelPeriods] = useState<IPeriodData[]>([]);
    const [recordsPeriod, setRecordsPeriod] = useState<TPeriodType>([null, null]);
    const [recordsByTime, setRecordsByTime] = useState<CalculateActivityTime>(new CalculateActivityTime());
    const [selectedChannel, setSelectedChannel] = useState<Api.Channel | null>(null);
    const [statResult, setStatResult] = useState<IScanDataResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.reactions);

    async function calculateEmbeddedPeriods(channel: Api.Channel) {
        setProgress({ text: mt('loading_records') });
        setSelectedChannel(channel);

        const recordsCount = await getTotalMessagesCount(channel.id);

        if (!recordsCount) {
            setFinishBlock({ text: mt('no_records'), state: 'error' });
            return;
        }

        const periods = [
            1, // 1 day
            3, // 3 days
            7, // 1 week
            14, // 2 weeks
            30, // 1 month
            90, // 3 months
            180, // 6 months
            365 // 1 year
        ];

        const periodsData = await calculatePeriodsMessagesCount(recordsCount, periods, channel, getRecords);
        periodsData.unshift({
            period: 0,
            disabled: false,
            count: recordsCount,
            periodDate: 0
        });

        setChannelPeriods(periodsData);
        setProgress(null);
    }

    async function getRecords({
        peer,
        total,
        endTime,
        startDate = null
    }: IGetMessagesCallbackArguments): Promise<TCorrectMessage[]> {
        if (channelRecords.length) {
            return filterMessages(channelRecords, endTime, startDate);
        }

        setProgress({ text: mt('loading_records'), total });

        const getMessagesGenerator = getMessages({
            peer,
            total,
            startDate,
            endTime,
            peerInfo: channelsInfo
        });

        let messagesCount;
        // "for of" doesn't work because we need return value
        while ((messagesCount = await getMessagesGenerator.next()).done === false) {
            setProgress({ ...getProgress(), count: messagesCount.value });
        }

        // @ts-ignore
        const processMessages: TCorrectMessage[] = messagesCount.value;
        setChannelRecords(processMessages);

        return processMessages;
    }

    function setDatePeriod(period: IPeriodData) {
        setRecordsPeriod([new Date(period.periodDate * 1000), new Date()]);
    }

    async function calcStatistic() {
        const dateFrom = recordsPeriod[0]?.getTime();
        const dateTo = recordsPeriod[1]?.getTime();

        if (dateFrom === null || dateFrom === undefined || !dateTo) {
            notifyError({ message: mt('incorrect_period') });
            return;
        }

        if (selectedChannel === null) {
            return;
        }

        const recordsCountInPeriod = await calculateEstimatedNumberOfPeriodMessages({
            peerId: selectedChannel.id,
            periodFrom: dateFrom / 1000,
            periodTo: dateTo / 1000
        });

        if (!recordsCountInPeriod) {
            notifyError({ message: mt('no_records_for_period') });
            return;
        }

        const messages = await getRecords({
            peer: selectedChannel as Api.Channel,
            total: recordsCountInPeriod + 1,
            endTime: dateFrom / 1000,
            startDate: dateTo / 1000
        });

        if (messages.length === 0) {
            notifyError({ message: mt('no_records_for_period') });
            return;
        }

        setProgress({ text: mt('loading_calculation') });

        const groupedIds = new Set<number>();
        const statData: IScanDataCalculation = {
            firstMessage: messages.reduce((prev, current) => {
                return prev.date < current.date ? prev : current;
            }),
            lastMessage: messages.reduce((prev, current) => {
                return prev.date > current.date ? prev : current;
            }),
            messages: 0,
            voiceDuration: 0,
            roundDuration: 0,
            callDuration: 0,
            attachmentsTotal: 0,
            stickersTotal: 0,
            reactionsTotal: 0
        };

        const activityTime = new CalculateActivityTime();
        messages.forEach((message) => {
            activityTime.add(Number(selectedChannel.id.valueOf()), message.date);

            if (message.reactions) {
                message.reactions.results.forEach(({ reaction }) => {
                    if (reaction instanceof Api.ReactionEmoji) {
                        statData.reactionsTotal++;
                    }
                });
            }

            if (message instanceof Api.MessageService) {
                const action = message.action;
                if (action instanceof Api.MessageActionGroupCall && action.duration) {
                    statData.callDuration += action.duration;
                }
            }

            if (message.media) {
                statData.attachmentsTotal++;

                const isDocument = message.media instanceof Api.MessageMediaDocument;
                if (isDocument) {
                    const media = message.media as Api.MessageMediaDocument;

                    if (media.document instanceof Api.Document) {
                        const attributes = media.document.attributes;

                        const sticker = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeSticker
                        ) as Api.DocumentAttributeSticker | undefined;
                        if (sticker && sticker.stickerset instanceof Api.InputStickerSetID) {
                            statData.stickersTotal++;
                        }

                        const voice = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeAudio
                        ) as Api.DocumentAttributeAudio | undefined;
                        if (voice) {
                            statData.voiceDuration += voice.duration;
                        }

                        const round = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeVideo
                        ) as Api.DocumentAttributeVideo | undefined;
                        if (round) {
                            statData.roundDuration += round.duration;
                        }
                    }
                }
            }

            if (message.groupedId) {
                if (groupedIds.has(message.groupedId.valueOf())) {
                    return; // skip duplicate
                }

                groupedIds.add(message.groupedId.valueOf());
            }

            statData.messages++;
        });
        setRecordsByTime(activityTime);

        const stat: IScanDataResult = {
            messages: statData.messages,
            voiceDuration: statData.voiceDuration,
            roundDuration: statData.roundDuration,
            callDuration: statData.callDuration,
            attachmentsTotal: statData.attachmentsTotal,
            stickersTotal: statData.stickersTotal,
            reactionsTotal: statData.reactionsTotal
        };

        setStatResult(stat);
        setProgress(null);
    }

    if (needHideContent()) return null;

    if (statResult) {
        const counts: IStatRow[] = [
            {
                icon: IconMessage,
                label: mt('headers.count'),
                value: formatNumber(statResult.messages),
                isInteger: true
            },
            {
                icon: IconPaperclip,
                label: mt('headers.attachments'),
                value: formatNumber(statResult.attachmentsTotal),
                isInteger: true
            },
            {
                icon: IconSticker,
                label: mt('headers.stickers'),
                value: formatNumber(statResult.stickersTotal),
                isInteger: true
            },
            {
                icon: IconHeart,
                label: mt('headers.reactions'),
                value: formatNumber(statResult.reactionsTotal),
                isInteger: true
            },
            {
                icon: IconMicrophone,
                label: mt('headers.voice_duration'),
                value: getTextTime(statResult.voiceDuration),
                isInteger: false
            },
            {
                icon: IconVideo,
                label: mt('headers.round_duration'),
                value: getTextTime(statResult.roundDuration),
                isInteger: false
            },
            {
                icon: IconPhone,
                label: mt('headers.call_duration'),
                value: getTextTime(statResult.callDuration),
                isInteger: false
            }
        ].filter((item) => Boolean(item.value) && item.value !== '0');

        const tabs: ITabTops[] = [
            {
                id: ETabId.reactions,
                lang: 'reactions',
                icon: IconMoodSmile
            }
        ];

        const tabsList: ITabItem[] = tabs.map(
            (tab) =>
                ({
                    id: tab.id as string,
                    name: mt(`headers.${tab.lang}`),
                    icon: tab.icon
                }) as ITabItem
        );

        const getTabDescription = () => {
            let langKey = null;

            if (selectedTab === ETabId.reactions) {
                langKey = 'reactions_description';
            }

            if (langKey) {
                return (
                    <Notification withCloseButton={false} my="xs" color="gray">
                        {mt(langKey)}
                    </Notification>
                );
            }

            return null;
        };

        return (
            <>
                <OwnerRow
                    owner={selectedChannel}
                    withoutLink={true}
                    description={mt('stat_date')
                        // @ts-ignore
                        .replace('{dateFrom}', recordsPeriod[0]?.toLocaleDateString())
                        // @ts-ignore
                        .replace('{dateTo}', recordsPeriod[1]?.toLocaleDateString())}
                />
                <Divider my="xs" />

                {counts.map((item, key) => (
                    <InfoRow
                        key={key}
                        title={item.label}
                        description={!item.isInteger ? String(item.value) : undefined}
                        count={item.isInteger ? Number(item.value) : undefined}
                        icon={item.icon}
                    />
                ))}

                <ActivityChart data={recordsByTime?.get(Number(selectedChannel?.id.valueOf()))} />
                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                {getTabDescription()}
            </>
        );
    }

    if (channelPeriods.length) {
        return (
            <>
                <OwnerRow owner={selectedChannel} withoutLink={true} />

                <Divider my="xs" label={mt('headers.period')} labelPosition="center" mb={0} />
                <Flex direction="column" gap="xl">
                    <Center>
                        <DatePicker
                            type="range"
                            value={recordsPeriod}
                            onChange={setRecordsPeriod}
                            locale={getAppLangCode()}
                        />
                    </Center>

                    <Flex direction="column" gap="xs">
                        <Button
                            size="md"
                            fullWidth
                            component="button"
                            disabled={!recordsPeriod.filter((period) => period !== null).length}
                            onClick={() => calcStatistic()}
                        >
                            {mt('get_stats')}
                        </Button>
                        {channelPeriods.map((period, key) => (
                            <Button
                                leftSection={<IconCalendarTime />}
                                size="md"
                                fullWidth
                                variant="default"
                                justify="space-between"
                                component="button"
                                key={key}
                                disabled={period.disabled}
                                onClick={() => setDatePeriod(period)}
                            >
                                <Flex gap="xs">
                                    <Text lineClamp={1} span fz="sm" fw={500}>
                                        {mt(`periods.${period.period}`)}
                                    </Text>
                                    <Text c="dimmed" fz="xs">
                                        {period.circa ? '~' : ''}(
                                        {declineAndFormat(period.count, md('decline.messages'))})
                                    </Text>
                                </Flex>
                            </Button>
                        ))}
                    </Flex>
                </Flex>
            </>
        );
    }

    return (
        <SelectDialog
            allowTypes={[EOwnerType.channel]}
            onOwnerSelect={(channel) => {
                // @ts-ignore
                setSelectedChannel(channel);
                // @ts-ignore
                calculateEmbeddedPeriods(channel);
            }}
        />
    );
};

export default RecordsStat;
