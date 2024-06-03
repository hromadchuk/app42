import {
    Icon,
    IconEye,
    IconHeart,
    IconMessage,
    IconMessagePlus,
    IconMicrophone,
    IconPaperclip,
    IconPhone,
    IconProps,
    IconSticker,
    IconVideo
} from '@tabler/icons-react';
import { Cell, Section } from '@telegram-apps/telegram-ui';
import { ForwardRefExoticComponent, JSX, RefAttributes, useContext, useState } from 'react';
import { Api } from 'telegram';

import { Padding } from '../components/Helpers.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { RecordRow } from '../components/RecordRow.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import { declineAndFormat, formatNumber, getTextTime, notifyError } from '../lib/helpers.ts';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import {
    calculatePeriodsMessagesCount,
    filterMessages,
    getMessages,
    getMessagesByPeriod,
    getTotalMessagesCount,
    IGetMessagesCallbackArguments,
    IPeriodData,
    TCorrectMessage,
    TPeriodType,
    ValidationError
} from '../lib/methods/messages.ts';
// import { RecordRow } from '../components/RecordRow.tsx';
import dayjs from 'dayjs';
import { ReactionsList } from '../components/ReactionsList.tsx';
import { StatsPeriodPicker } from '../components/StatsPeriodPicker.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

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
    period: string;
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
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
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
    icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    records: IStatsRecords;
}

const channelsInfo = new Map<number, Api.Channel>();

export default function RecordsStat() {
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
            peerInfo: channelsInfo,
            setProgress
        });

        setChannelRecords(records);

        return records;
    }

    async function calcStatistic() {
        let records;

        try {
            records = await getMessagesByPeriod(recordsPeriod, selectedChannel, getRecordsDecorator);
        } catch (error) {
            if (!(error instanceof ValidationError)) {
                throw error;
            }

            notifyError({ message: mt(error.message) });
            return;
        }

        setProgress({ text: mt('loading_calculation') });

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

        // find first grouped message
        const groupedMessagesIds = new Map<number, number>();
        records.forEach((record) => {
            if (record.groupedId) {
                const recordId = record.id.valueOf();
                const groupId = record.groupedId.valueOf();
                const currentValue = groupedMessagesIds.get(groupId) || 0;

                if (!currentValue || currentValue > recordId) {
                    groupedMessagesIds.set(groupId, recordId);
                }
            }
        });

        records.forEach((record) => {
            activityTime.add(Number(selectedChannel?.id.valueOf()), record.date);

            if (record.media instanceof Api.MessageMediaUnsupported) {
                return;
            }

            // skip second and next messages in group
            if (record.groupedId) {
                const groupId = record.groupedId.valueOf();
                const groupedFirstMessageId = groupedMessagesIds.get(groupId) as number;

                if (groupedFirstMessageId !== record.id.valueOf()) {
                    return;
                }
            }

            if (record instanceof Api.MessageService) {
                const action = record.action;
                if (action instanceof Api.MessageActionGroupCall && action.duration) {
                    statData.callDuration += action.duration;
                }

                return;
            }

            getRecordReactionsStats(record, statData);
            getRecordMediaStats(record, statData);
            getRecordViewsStats(record, statData);
            getRecordCommentsStats(record, statData);

            const recordCommentsCount = record.replies?.replies;
            if (recordCommentsCount) {
                statData.commentsTotal += recordCommentsCount;
            }

            statData.records++;
        });

        setRecordsByTime(activityTime);

        const stat: IScanDataResult = {
            period: getSelectedPeriod(statData.firstMessage, statData.lastMessage),
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
        ].filter((tab) => Object.values(tab.records).length);
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
                    if (voice?.voice) {
                        statData.voiceDuration += voice.duration;
                    }

                    const round = getMediaFromAttributes(attributes, Api.DocumentAttributeVideo) as
                        | Api.DocumentAttributeVideo
                        | undefined;
                    if (round?.roundMessage) {
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
            pushStatCountToStatRecords(statData.comments, recordCommentsCount, record);
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

    function getSelectedPeriod(firstMessage: TCorrectMessage, lastMessage: TCorrectMessage): string {
        const firstMessageDate = dayjs.unix(firstMessage.date).format('DD.MM.YYYY');
        const lastMessageDate = dayjs.unix(lastMessage.date).format('DD.MM.YYYY');

        if (firstMessageDate === lastMessageDate) {
            return firstMessageDate;
        }

        return `${firstMessageDate} - ${lastMessageDate}`;
    }

    function getReactionsElement(stats: IScanDataResult): JSX.Element {
        const reactions = new Map(
            Object.keys(stats.reactions.reactions).map((reaction) => {
                const reactionsCount = stats.reactions.reactions[reaction].count;

                return [reaction, reactionsCount];
            })
        );

        return <ReactionsList reactions={reactions} />;
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

        const tabRecords = (getSelectedTabObject(tabs) as ITabTops).records;

        return (
            <Section className={commonClasses.sectionBox}>
                <OwnerRow
                    owner={selectedChannel}
                    withoutLink={true}
                    description={mt('stat_date').replace('{period}', statResult.period)}
                />

                {counts.map((item, key) => (
                    <Cell
                        key={key}
                        description={!item.isInteger ? String(item.value) : undefined}
                        before={<item.icon />}
                        after={item.isInteger ? formatNumber(Number(item.value)) : undefined}
                    >
                        {item.label}
                    </Cell>
                ))}

                {getReactionsElement(statResult)}

                <Padding>
                    <ActivityChart data={recordsByTime.get(Number(selectedChannel?.id.valueOf()))} />
                </Padding>

                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId | string)} />

                {prepareRecordsStatsToDisplay(tabRecords).map((statCount: string) =>
                    tabRecords[statCount].map((record: TCorrectMessage) => (
                        <RecordRow
                            key={selectedTab + record.id}
                            record={record}
                            description={getTabDescription(tabs, Number(statCount))}
                        />
                    ))
                )}
            </Section>
        );
    }

    if (channelPeriods.length) {
        return (
            <Section className={commonClasses.sectionBox}>
                <OwnerRow owner={selectedChannel} withoutLink={true} />
                <StatsPeriodPicker
                    statsPeriods={channelPeriods}
                    statsPeriod={recordsPeriod}
                    setStatsPeriod={setRecordsPeriod}
                    calcStatistic={calcStatistic}
                />
            </Section>
        );
    }

    return (
        <Section className={commonClasses.sectionBox}>
            <SelectDialog
                allowTypes={[EOwnerType.channel]}
                onOwnerSelect={(channel) => {
                    setSelectedChannel(channel as Api.Channel);
                    calculateEmbeddedPeriods(channel as Api.Channel);
                }}
            />
        </Section>
    );
}
