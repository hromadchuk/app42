import { Badge, Button, Center, Divider, Flex, Group, Text } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
    IconCalendarTime,
    IconEye,
    IconHeart,
    IconMessage,
    IconMessagePlus,
    IconMicrophone,
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
import { RecordRow } from '../components/RecordRow.tsx';

type TPeriodType = [Date | null, Date | null];

type DocumentAttributeType =
    | typeof Api.DocumentAttributeSticker
    | typeof Api.DocumentAttributeAudio
    | typeof Api.DocumentAttributeVideo;

interface IStatsRecords {
    [recordStatCount: string]: TCorrectMessage[];
}

interface ITopRecords {
    count: number;
    records: IStatsRecords;
}

interface IScanReactions {
    total: ITopRecords;
    reactions: { [reactionEmoji: string]: ITopRecords };
}

interface IScanDataCalculation {
    firstMessage: TCorrectMessage;
    lastMessage: TCorrectMessage;
    records: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    commentsTotal: number;
    viewsTotal: number;
    stickersTotal: number;
    reactions: IScanReactions;
    comments: IStatsRecords;
    views: IStatsRecords;
}

interface IScanDataResult {
    records: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    commentsTotal: number;
    viewsTotal: number;
    stickersTotal: number;
    views: IStatsRecords;
    comments: IStatsRecords;
    reactions: IScanReactions;
}

interface IStatRow {
    icon: (props: TablerIconsProps) => JSX.Element;
    label: string;
    value: number | string;
    isInteger: boolean;
}
enum ETabId {
    reactions = 'reactions',
    comments = 'comments',
    views = 'views'
}

interface ITabTops {
    id: ETabId | string;
    lang: string;
    parentTab?: ETabId;
    icon?: (props: TablerIconsProps) => JSX.Element;
    records: IStatsRecords;
}

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

const channelsInfo = new Map<number, Api.Channel>();

export const RecordsStat = () => {
    const { mt, md, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [channelRecords, setChannelRecords] = useState<Api.TypeMessage[]>([]);
    const [channelPeriods, setChannelPeriods] = useState<IPeriodData[]>([]);
    const [recordsPeriod, setRecordsPeriod] = useState<TPeriodType>([null, null]);
    const [recordsByTime, setRecordsByTime] = useState<CalculateActivityTime>(new CalculateActivityTime());
    const [selectedChannel, setSelectedChannel] = useState<Api.Channel | null>(null);
    const [statResult, setStatResult] = useState<IScanDataResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<string | ETabId>(ETabId.views);

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

        const periodsData = await calculatePeriodsMessagesCount(recordsCount, periods, channel, getRecordsDecorator);
        periodsData.unshift({
            period: 0,
            disabled: false,
            count: recordsCount,
            periodDate: 0
        });

        setChannelPeriods(periodsData);
        setProgress(null);
    }

    async function getRecords() {
        const dateFrom = recordsPeriod[0]?.getTime();
        const dateTo = recordsPeriod[1]?.getTime();

        if (dateFrom === null || dateFrom === undefined || !dateTo) {
            throw new ValidationError(mt('incorrect_period'));
        }

        if (selectedChannel === null) {
            throw new ValidationError(mt('channel_not_selected'));
        }

        const recordsCountInPeriod = await calculateEstimatedNumberOfPeriodMessages({
            peerId: selectedChannel.id,
            periodFrom: dateFrom / 1000,
            periodTo: dateTo / 1000
        });

        if (!recordsCountInPeriod) {
            throw new ValidationError(mt('no_records_for_period'));
        }

        const records = await getRecordsDecorator({
            peer: selectedChannel as Api.Channel,
            total: recordsCountInPeriod + 1,
            endTime: dateFrom / 1000,
            startDate: dateTo / 1000
        });

        if (records.length === 0) {
            throw new ValidationError(mt('no_records_for_period'));
        }

        return records;
    }

    async function getRecordsDecorator({
        peer,
        total,
        endTime,
        startDate = null
    }: IGetMessagesCallbackArguments): Promise<TCorrectMessage[]> {
        if (channelRecords.length) {
            return filterMessages(channelRecords, endTime, startDate);
        }

        setProgress({ text: mt('loading_records'), total });

        const records = await getMessages({
            peer,
            total,
            startDate,
            endTime,
            peerInfo: channelsInfo
        });

        setChannelRecords(records);
        return records;
    }

    function setDatePeriod(period: IPeriodData) {
        setRecordsPeriod([new Date(period.periodDate * 1000), new Date()]);
    }

    async function calcStatistic() {
        let records;
        try {
            records = await getRecords();
        } catch (error) {
            if (!(error instanceof ValidationError)) {
                throw error;
            }

            notifyError({ message: error.message });
            return;
        }

        setProgress({ text: mt('loading_calculation') });

        const groupedIds = new Set<number>();
        const statData: IScanDataCalculation = {
            firstMessage: records.reduce((prev, current) => {
                return prev.date < current.date ? prev : current;
            }),
            lastMessage: records.reduce((prev, current) => {
                return prev.date > current.date ? prev : current;
            }),
            records: 0,
            voiceDuration: 0,
            roundDuration: 0,
            callDuration: 0,
            attachmentsTotal: 0,
            commentsTotal: 0,
            viewsTotal: 0,
            stickersTotal: 0,
            comments: {},
            views: {},
            reactions: {
                total: {
                    count: 0,
                    records: {}
                },
                reactions: {}
            }
        };

        const activityTime = new CalculateActivityTime();
        records.forEach((record) => {
            // @ts-ignore
            activityTime.add(Number(selectedChannel.id.valueOf()), record.date);

            if (record instanceof Api.MessageService) {
                const action = record.action;
                if (action instanceof Api.MessageActionGroupCall && action.duration) {
                    statData.callDuration += action.duration;
                }
            }

            getRecordReactionsStats(record, statData);
            getRecordMediaStats(record, statData);
            getRecordViewsStats(record, statData);
            getRecordCommentsStats(record, statData);

            const recordCommentsCount = record.replies?.replies;
            if (recordCommentsCount) {
                statData.commentsTotal += recordCommentsCount;
            }

            if (record.groupedId) {
                if (groupedIds.has(record.groupedId.valueOf())) {
                    return;
                }

                groupedIds.add(record.groupedId.valueOf());
            }

            statData.records++;
        });

        setRecordsByTime(activityTime);

        const stat: IScanDataResult = {
            records: statData.records,
            voiceDuration: statData.voiceDuration,
            roundDuration: statData.roundDuration,
            callDuration: statData.callDuration,
            attachmentsTotal: statData.attachmentsTotal,
            commentsTotal: statData.commentsTotal,
            viewsTotal: statData.viewsTotal,
            stickersTotal: statData.stickersTotal,
            reactions: statData.reactions,
            comments: statData.comments,
            views: statData.views
        };

        setStatResult(stat);
        setProgress(null);
    }

    function getTabs(stats: IScanDataResult): ITabTops[] {
        return [
            {
                id: ETabId.views,
                lang: 'views',
                icon: IconEye,
                records: stats.views
            },
            {
                id: ETabId.comments,
                lang: 'comments',
                icon: IconMessagePlus,
                records: stats.comments
            },
            {
                id: ETabId.reactions,
                lang: 'reactions',
                icon: IconHeart,
                records: stats.reactions.total.records
            }
        ];
    }

    function getRecordReactionsStats(record: TCorrectMessage, statData: IScanDataCalculation): void {
        let recordReactionsCount = 0;
        const recordReactions: { [reaction: string]: number } = {};

        if (!record.reactions) {
            return;
        }

        record.reactions.results.forEach((reactionCount: Api.ReactionCount) => {
            const reaction = reactionCount.reaction;
            if (!(reaction instanceof Api.ReactionEmoji)) {
                return;
            }

            recordReactionsCount += reactionCount.count;
            statData.reactions.total.count += reactionCount.count;

            const emoticon = reaction.emoticon;
            const statReaction = statData.reactions.reactions[emoticon];
            if (!statReaction) {
                statData.reactions.reactions[emoticon] = {
                    count: 0,
                    records: {}
                };
            }

            statData.reactions.reactions[emoticon].count += reactionCount.count;
            recordReactions[emoticon] = (recordReactions[emoticon] || 0) + reactionCount.count;
        });

        pushStatCountToStatRecords(statData.reactions.total.records, recordReactionsCount, record);
        Object.keys(recordReactions).forEach((reaction) => {
            pushStatCountToStatRecords(
                statData.reactions.reactions[reaction].records,
                recordReactions[reaction],
                record
            );
        });
    }

    function pushStatCountToStatRecords(
        statRecords: IStatsRecords,
        recordReactionsCount: number,
        record: TCorrectMessage
    ) {
        if (!statRecords[recordReactionsCount]) {
            statRecords[recordReactionsCount] = [];
        }

        statRecords[recordReactionsCount].push(record);
    }

    function getRecordMediaStats(record: TCorrectMessage, statData: IScanDataCalculation) {
        if (record.media) {
            statData.attachmentsTotal++;

            const isDocument = record.media instanceof Api.MessageMediaDocument;
            if (isDocument) {
                const media = record.media as Api.MessageMediaDocument;

                if (media.document instanceof Api.Document) {
                    const attributes = media.document.attributes;

                    const sticker = getMediaFromAttributes(attributes, Api.DocumentAttributeSticker) as
                        | Api.DocumentAttributeSticker
                        | undefined;
                    if (sticker && sticker.stickerset instanceof Api.InputStickerSetID) {
                        statData.stickersTotal++;
                    }

                    const voice = getMediaFromAttributes(attributes, Api.DocumentAttributeAudio) as
                        | Api.DocumentAttributeAudio
                        | undefined;
                    if (voice) {
                        statData.voiceDuration += voice.duration;
                    }

                    const round = getMediaFromAttributes(attributes, Api.DocumentAttributeVideo) as
                        | Api.DocumentAttributeVideo
                        | undefined;
                    if (round) {
                        statData.roundDuration += round.duration;
                    }
                }
            }
        }
    }

    function getRecordViewsStats(record: TCorrectMessage, statData: IScanDataCalculation) {
        const recordViewsCount = record.views || 0;
        statData.viewsTotal += recordViewsCount;
        pushStatCountToStatRecords(statData.views, recordViewsCount, record);
    }

    function getRecordCommentsStats(record: TCorrectMessage, statData: IScanDataCalculation) {
        const recordCommentsCount = record.replies?.replies;
        if (recordCommentsCount) {
            statData.commentsTotal += recordCommentsCount;
            pushStatCountToStatRecords(statData.views, recordCommentsCount, record);
        }
    }

    function getMediaFromAttributes(attributes: Api.TypeDocumentAttribute[], mediaType: DocumentAttributeType) {
        return attributes.find((attribute) => attribute instanceof mediaType);
    }

    function prepareRecordsStatsToDisplay(records?: IStatsRecords): string[] {
        return Object.keys(records || [])
            .sort((a: string, b: string) => Number(b) - Number(a))
            .slice(0, 99);
    }

    function getEmojiTabsList(stats: IScanDataResult): ITabItem[] {
        const emojiTabs: ITabItem[] = [];
        emojiTabs.push(
            ...Object.keys(stats.reactions.reactions).map((emoji) => ({
                id: emoji,
                name: emoji
            }))
        );

        return emojiTabs;
    }

    function getEmojiTabs(stats: IScanDataResult): ITabTops[] {
        const emojiTabs: ITabTops[] = [];
        emojiTabs.push(
            ...Object.keys(stats.reactions.reactions).map((emoji) => ({
                id: emoji,
                lang: emoji,
                records: stats.reactions.reactions[emoji].records,
                parentTab: ETabId.reactions
            }))
        );

        return emojiTabs;
    }

    function getTabDescription(tabs: ITabTops[], recordStatCount: number): string | undefined {
        if (selectedTab === ETabId.views) {
            return declineAndFormat(recordStatCount, md('decline.views'));
        }

        if (selectedTab === ETabId.comments) {
            return declineAndFormat(recordStatCount, md('decline.comments'));
        }

        if (selectedTab === ETabId.reactions || getSelectedTabObject(tabs)) {
            return declineAndFormat(recordStatCount, md('decline.reactions'));
        }

        return undefined;
    }

    function getReactionsElement(stats: IScanDataResult): JSX.Element {
        const reactions = stats.reactions.reactions;
        const reactionsEmoticons = Object.keys(reactions).sort(
            (reactionA, reactionB) => reactions[reactionB].count - reactions[reactionA].count
        );

        return (
            <Group pt={10}>
                {reactionsEmoticons.map((reaction) => (
                    <Badge key={reaction} leftSection={reaction} size="lg" color="gray">
                        {formatNumber(reactions[reaction].count)}
                    </Badge>
                ))}
            </Group>
        );
    }

    function getSelectedTabObject(tabs: ITabTops[]) {
        return tabs.find((tab) => tab.id === selectedTab);
    }

    if (needHideContent()) return null;

    if (statResult) {
        const counts: IStatRow[] = [
            {
                icon: IconMessage,
                label: mt('headers.count'),
                value: statResult.records,
                isInteger: true
            },
            {
                icon: IconPaperclip,
                label: mt('headers.attachments'),
                value: statResult.attachmentsTotal,
                isInteger: true
            },
            {
                icon: IconMessagePlus,
                label: mt('headers.comments'),
                value: statResult.commentsTotal,
                isInteger: true
            },
            {
                icon: IconEye,
                label: mt('headers.views'),
                value: statResult.viewsTotal,
                isInteger: true
            },
            {
                icon: IconSticker,
                label: mt('headers.stickers'),
                value: statResult.stickersTotal,
                isInteger: true
            },
            {
                icon: IconHeart,
                label: mt('headers.reactions'),
                value: statResult.reactions.total.count,
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

        const tabs: ITabTops[] = getTabs(statResult);
        const tabsList: ITabItem[] = tabs.map(
            (tab) =>
                ({
                    id: tab.id as string,
                    name: mt(`headers.${tab.lang}`),
                    icon: tab.icon
                }) as ITabItem
        );

        tabs.push(...getEmojiTabs(statResult));
        tabsList.push(...getEmojiTabsList(statResult));

        const tabRecords = getSelectedTabObject(tabs)?.records;

        // @ts-ignore
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
                {getReactionsElement(statResult)}

                <ActivityChart data={recordsByTime?.get(Number(selectedChannel?.id.valueOf()))} />
                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId | string)} />

                {prepareRecordsStatsToDisplay(tabRecords).map((statCount: string) =>
                    // @ts-ignore
                    tabRecords[statCount].map((record: TCorrectMessage) => (
                        <RecordRow
                            key={selectedTab + record.id}
                            record={record}
                            description={getTabDescription(tabs, Number(statCount))}
                        />
                    ))
                )}
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
                                        {declineAndFormat(period.count, md('decline.records'))})
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
