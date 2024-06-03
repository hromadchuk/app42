import { ForwardRefExoticComponent, RefAttributes, useContext, useState } from 'react';
import { Blockquote, Button, Cell, Modal, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import {
    Icon,
    IconHeart,
    IconMessage,
    IconMessage2Bolt,
    IconMicrophone,
    IconMoodSmile,
    IconPaperclip,
    IconPhone,
    IconProps,
    IconSticker,
    IconVideo
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Api } from 'telegram';
import { usePopup } from '@tma.js/sdk-react';
import { Padding } from '../components/Helpers.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import { IMessagesStatImagesOptions } from '../images_generator/MessageStatImagesGenerator.ts';
import { t } from '../lib/lang.ts';
import {
    calculatePeriodsMessagesCount,
    filterMessages,
    getMessages,
    getMessagesByPeriod,
    getTotalMessagesCount,
    IGetMessagesCallbackArguments,
    IPeriodData,
    TPeriodType,
    ValidationError
} from '../lib/methods/messages.ts';
import {
    CallAPI,
    classNames,
    declineAndFormat,
    formatNumber,
    getAvatars,
    getPeerId,
    getStringsTimeArray,
    getTextTime,
    getUserId,
    isDev,
    notifyError,
    TOwnerType
} from '../lib/helpers.ts';
import { StatsPeriodPicker } from '../components/StatsPeriodPicker.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import { ReactionsList } from '../components/ReactionsList.tsx';
import { getDialogMembers, kickMemberFromDialog } from '../lib/methods/dialogs.ts';
import { canShare, ShareType } from '../modals/ShareModal.tsx';

import { AppContext } from '../contexts/AppContext.tsx';
import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

type TCorrectMessage = Api.Message | Api.MessageService;

interface IPeerData {
    peerId: number;
    count: number;
    uniqCount: number;
    reactions: number;
    attachments: number;
    stickers: number;
    voiceDuration: number;
    roundDuration: number;
}

interface IScanDataCalculation {
    firstMessage: TCorrectMessage;
    lastMessage: TCorrectMessage;
    messages: number;
    uniqMessages: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    attachmentsTypes: { [key: string]: number };
    stickersTotal: number;
    stickers: { [key: string]: number };
    reactionsTotal: number;
    reactions: { [key: string]: number };
    servicesMessages: { [key: string]: number };
    mentions: { [key: string]: number };
}

interface ITopItem {
    count: number;
    owner: TOwnerType;
    activity?: number[][];
}

interface IScanDataResult {
    activity: number[][];
    period: string;
    messages: number;
    uniqMessages: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachmentsTotal: number;
    stickersTotal: number;
    reactionsTotal: number;
    reactions: Map<string, number>;
    tops: {
        messages: ITopItem[];
        uniqMessages: ITopItem[];
        reactions: ITopItem[];
        attachments: ITopItem[];
        stickers: ITopItem[];
        voiceDuration: ITopItem[];
        roundDuration: ITopItem[];
    };
}

enum ETabId {
    messages = 'messages',
    uniqMessages = 'uniqMessages',
    reactions = 'reactions',
    attachments = 'attachments',
    stickers = 'stickers',
    voiceDuration = 'voiceDuration',
    roundDuration = 'roundDuration'
}

interface ITabTops {
    id: ETabId;
    lang: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    owners: ITopItem[];
}

interface ITopic {
    id: number;
    name: string;
}

const ownersInfo = new Map<number, TOwnerType>();

export default function MessagesStat() {
    const { showShareModal } = useContext(AppContext);
    const { mt, md, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);
    const popup = usePopup();

    const [userActivityModalData, setUserActivityModalData] = useState<ITopItem | null>(null);

    const [ownerMessages, setOwnerMessages] = useState<Api.TypeMessage[]>([]);
    const [ownerPeriods, setOwnerPeriods] = useState<IPeriodData[]>([]);
    const [chatInactiveMembers, setChatInactiveMembers] = useState<Api.User[]>([]);
    const [chatInactiveMembersShowCount, setChatInactiveMembersShowCount] = useState<number>(3);
    const [recordsPeriod, setRecordsPeriod] = useState<TPeriodType>([null, null]);
    const [selectedOwner, setSelectedOwner] = useState<TOwnerType | null>(null);
    const [statResult, setStatResult] = useState<IScanDataResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.messages);
    const [chatTopics, setChatTopics] = useState<ITopic[]>([]);
    const [selectedChatTopic, setSelectedChatTopic] = useState<number>(0);
    const [shareData, setShareData] = useState<IMessagesStatImagesOptions | null>(null);

    function checkIsMessagesCountLessThanMinimal(messagesCount: number): boolean {
        if (messagesCount < 10) {
            setFinishBlock({ text: mt('need_more_messages'), state: 'error' });
            return true;
        }

        return false;
    }

    async function getOptions(owner: TOwnerType) {
        setProgress({ text: mt('loading_messages') });
        setSelectedOwner(owner);

        const count = await getTotalMessagesCount(owner.id);

        if (!count) {
            setFinishBlock({ text: mt('no_messages'), state: 'error' });
            return;
        }

        if (checkIsMessagesCountLessThanMinimal(count)) {
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

        const periodsData = await calculatePeriodsMessagesCount(count, periods, owner, getMessagesDecorator);

        periodsData.push({
            period: 0,
            disabled: false,
            count,
            periodDate: 0
        });

        if (owner instanceof Api.Channel && owner.forum) {
            const data = await CallAPI(
                new Api.channels.GetForumTopics({
                    channel: owner,
                    limit: 100
                })
            );

            const topics: ITopic[] = (data.topics as Api.ForumTopic[]).map((topic) => ({
                id: topic.id,
                name: topic.title
            }));

            setChatTopics(topics);
        }

        setOwnerPeriods(periodsData);
        setProgress(null);
    }

    function getAuthorId(message: TCorrectMessage): number {
        const author = message.fromId || message.peerId;

        return getPeerId(author);
    }

    async function getMessagesDecorator({
        peer,
        total,
        endTime,
        startDate = null
    }: IGetMessagesCallbackArguments): Promise<TCorrectMessage[]> {
        if (ownerMessages.length) {
            return filterMessages(ownerMessages, endTime, startDate);
        }

        setProgress({ text: mt('loading_messages'), total });

        const messages = await getMessages({
            peer,
            total,
            startDate,
            endTime,
            peerInfo: ownersInfo,
            setProgress
        });

        setOwnerMessages(messages);

        return messages;
    }

    function getSelectedPeriod(firstMessage: TCorrectMessage, lastMessage: TCorrectMessage): string {
        const firstMessageDate = dayjs.unix(firstMessage.date).format('DD.MM.YYYY');
        const lastMessageDate = dayjs.unix(lastMessage.date).format('DD.MM.YYYY');

        if (firstMessageDate === lastMessageDate) {
            return firstMessageDate;
        }

        return `${firstMessageDate} - ${lastMessageDate}`;
    }

    function getOwnerName(owner: TOwnerType): string {
        const name = owner instanceof Api.User ? owner.firstName : owner.title;

        return name || 'No name';
    }

    async function calcStatistic() {
        let messages;

        try {
            messages = await getMessagesByPeriod(recordsPeriod, selectedOwner, getMessagesDecorator);
        } catch (error) {
            if (!(error instanceof ValidationError)) {
                throw error;
            }

            notifyError({ message: mt(error.message) });
            return;
        }

        console.log({ selectedChatTopic });
        console.log('messages', messages);

        setProgress({ text: mt('loading_calculation') });

        let lastPeerId = 0;
        const groupedIds = new Set<number>();
        const peersData: { [key: number]: IPeerData } = {};
        const statData: IScanDataCalculation = {
            firstMessage: messages.reduce((prev, current) => {
                return prev.date < current.date ? prev : current;
            }),
            lastMessage: messages.reduce((prev, current) => {
                return prev.date > current.date ? prev : current;
            }),
            messages: 0,
            uniqMessages: 0,
            voiceDuration: 0,
            roundDuration: 0,
            callDuration: 0,
            attachmentsTotal: 0,
            attachmentsTypes: {},
            stickersTotal: 0,
            stickers: {},
            servicesMessages: {},
            mentions: {},
            reactionsTotal: 0,
            reactions: {}
        };

        const usersMessagesByTime = new CalculateActivityTime();
        messages.forEach((message) => {
            if (selectedChatTopic) {
                if (!message.replyTo) {
                    return;
                } else if (message.replyTo.replyToTopId && message.replyTo.replyToTopId !== selectedChatTopic) {
                    return;
                } else if (message.replyTo.replyToMsgId !== selectedChatTopic) {
                    return;
                }
            }

            const peerId = getAuthorId(message);

            if (!peersData[peerId]) {
                peersData[peerId] = {
                    peerId,
                    count: 0,
                    uniqCount: 0,
                    reactions: 0,
                    attachments: 0,
                    stickers: 0,
                    voiceDuration: 0,
                    roundDuration: 0
                };
            }

            if (message.reactions) {
                message.reactions.results.forEach((reactionCount: Api.ReactionCount) => {
                    const reaction = reactionCount.reaction;
                    if (reaction instanceof Api.ReactionEmoji) {
                        statData.reactionsTotal += reactionCount.count;
                        if (!statData.reactions[reaction.emoticon]) {
                            statData.reactions[reaction.emoticon] = 0;
                        }

                        statData.reactions[reaction.emoticon] += reactionCount.count;
                        peersData[peerId].reactions += reactionCount.count;
                    }
                });
            }

            if (message instanceof Api.MessageService) {
                const action = message.action;
                const actionKey = action.className;

                if (!statData.servicesMessages[actionKey]) {
                    statData.servicesMessages[actionKey] = 0;
                }

                statData.servicesMessages[actionKey]++;

                if (action instanceof Api.MessageActionGroupCall && action.duration) {
                    statData.callDuration += action.duration;
                }
            }

            if (message.media) {
                const type = message.media.className;

                statData.attachmentsTotal++;
                peersData[peerId].attachments++;
                if (!statData.attachmentsTypes[type]) {
                    statData.attachmentsTypes[type] = 0;
                }
                statData.attachmentsTypes[type]++;

                const isDocument = message.media instanceof Api.MessageMediaDocument;
                if (isDocument) {
                    const media = message.media as Api.MessageMediaDocument;

                    if (media.document instanceof Api.Document) {
                        const attributes = media.document.attributes;

                        const sticker = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeSticker
                        ) as Api.DocumentAttributeSticker | undefined;
                        if (sticker && sticker.stickerset instanceof Api.InputStickerSetID) {
                            const stickerId = `${sticker.stickerset.id}_${sticker.stickerset.accessHash}`;

                            if (!statData.stickers[stickerId]) {
                                statData.stickers[stickerId] = 0;
                            }

                            peersData[peerId].stickers++;
                            statData.stickersTotal++;
                            statData.stickers[stickerId]++;
                        }

                        const voice = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeAudio
                        ) as Api.DocumentAttributeAudio | undefined;
                        if (voice?.voice) {
                            peersData[peerId].voiceDuration += voice.duration;
                            statData.voiceDuration += voice.duration;
                        }

                        const round = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeVideo
                        ) as Api.DocumentAttributeVideo | undefined;
                        if (round?.roundMessage) {
                            peersData[peerId].roundDuration += round.duration;
                            statData.roundDuration += round.duration;
                        }
                    }
                }
            }

            if (message.entities) {
                message.entities.forEach((entity) => {
                    if (entity instanceof Api.MessageEntityMention) {
                        const mention = message.message.slice(entity.offset, entity.offset + entity.length);

                        if (!statData.mentions[mention]) {
                            statData.mentions[mention] = 0;
                        }

                        statData.mentions[mention]++;
                    }
                });
            }

            if (message.groupedId) {
                if (groupedIds.has(message.groupedId.valueOf())) {
                    return; // skip duplicate
                }

                groupedIds.add(message.groupedId.valueOf());
            }

            if (!(message instanceof Api.MessageService)) {
                usersMessagesByTime.add(0, message.date);
                usersMessagesByTime.add(getAuthorId(message), message.date);
            }

            if (peerId !== lastPeerId) {
                statData.uniqMessages++;
                peersData[peerId].uniqCount++;
                lastPeerId = peerId;
            }

            peersData[peerId].count++;
            statData.messages++;
        });

        if (checkIsMessagesCountLessThanMinimal(statData.messages)) {
            return;
        }

        const stat: IScanDataResult = {
            activity: usersMessagesByTime.get(0),
            period: getSelectedPeriod(statData.firstMessage, statData.lastMessage),
            messages: statData.messages,
            uniqMessages: statData.uniqMessages,
            voiceDuration: statData.voiceDuration,
            roundDuration: statData.roundDuration,
            callDuration: statData.callDuration,
            attachmentsTotal: statData.attachmentsTotal,
            stickersTotal: statData.stickersTotal,
            reactionsTotal: statData.reactionsTotal,
            reactions: new Map(Object.entries(statData.reactions)),
            tops: {
                messages: [],
                uniqMessages: [],
                reactions: [],
                attachments: [],
                stickers: [],
                voiceDuration: [],
                roundDuration: []
            }
        };

        const usersDataArray = Object.values(peersData);
        const topLimit = 30;

        stat.tops.messages = usersDataArray
            .sort((a, b) => b.count - a.count)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.count,
                    owner: ownersInfo.get(peer.peerId),
                    activity: usersMessagesByTime.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.uniqMessages = usersDataArray
            .sort((a, b) => b.uniqCount - a.uniqCount)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.uniqCount,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.reactions = usersDataArray
            .sort((a, b) => b.reactions - a.reactions)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.reactions,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.attachments = usersDataArray
            .sort((a, b) => b.attachments - a.attachments)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.attachments,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.stickers = usersDataArray
            .sort((a, b) => b.stickers - a.stickers)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.stickers,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.voiceDuration = usersDataArray
            .sort((a, b) => b.voiceDuration - a.voiceDuration)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.voiceDuration,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));
        stat.tops.roundDuration = usersDataArray
            .sort((a, b) => b.roundDuration - a.roundDuration)
            .slice(0, topLimit)
            .map((peer) => {
                return {
                    count: peer.roundDuration,
                    owner: ownersInfo.get(peer.peerId)
                } as ITopItem;
            })
            .filter(({ count }) => Boolean(count));

        const isSimpleChat = selectedOwner instanceof Api.Chat;
        const isMegaGroupChat = (selectedOwner instanceof Api.Channel && selectedOwner.megagroup) || false;
        const membersCount =
            selectedOwner instanceof Api.Chat || (selectedOwner instanceof Api.Channel && selectedOwner.megagroup)
                ? selectedOwner.participantsCount || 0
                : 0;

        if ((isSimpleChat || isMegaGroupChat) && membersCount <= 200) {
            const activeUserIds = usersDataArray
                .filter((activeUser) => activeUser.count > 0)
                .map((activeUser) => activeUser.peerId);
            const members = await getDialogMembers(selectedOwner as TDialogWithoutUser);
            const membersWithoutMessages = members.filter((member) => {
                const userId = member.id.valueOf();

                if (userId === getUserId() || member.deleted) {
                    return false;
                }

                return !activeUserIds.includes(userId);
            });

            if (membersWithoutMessages.length) {
                setChatInactiveMembers(membersWithoutMessages);
            }
        }

        setStatResult(stat);
        setProgress(null);

        if (stat.tops.messages.length >= 3) {
            const owners = stat.tops.messages.map((item) => item.owner);
            const avatars = await getAvatars(owners);

            const users = stat.tops.messages.slice(0, 8).map((item) => ({
                name: getOwnerName(item.owner),
                description: declineAndFormat(item.count, md('decline.messages')),
                avatar: avatars.get(item.owner.id.valueOf()) || undefined
            }));

            canShare(selectedOwner as TOwnerType).then(({ canPost }) => {
                if (canPost) {
                    setShareData({
                        title: mt('share_title'),
                        description: mt('share_description').replace(
                            '{name}',
                            getOwnerName(selectedOwner as TOwnerType)
                        ),
                        bottomText: mt('stat_date').replace('{date}', stat.period),
                        users
                    });
                }
            });
        }
    }

    function kickMember(userId: number) {
        kickMemberFromDialog(userId, selectedOwner as TDialogWithoutUser);

        setChatInactiveMembers(chatInactiveMembers.filter((member) => member.id.valueOf() !== userId));
    }

    function getTabs(stat: IScanDataResult) {
        const tabs: ITabTops[] = [
            {
                id: ETabId.messages,
                lang: 'count',
                icon: IconMessage,
                owners: stat.tops.messages
            },
            {
                id: ETabId.uniqMessages,
                lang: 'uniq_count',
                icon: IconMessage2Bolt,
                owners: stat.tops.uniqMessages
            },
            {
                id: ETabId.reactions,
                lang: 'reactions',
                icon: IconMoodSmile,
                owners: stat.tops.reactions
            },
            {
                id: ETabId.attachments,
                lang: 'attachments',
                icon: IconPaperclip,
                owners: stat.tops.attachments
            },
            {
                id: ETabId.stickers,
                lang: 'stickers',
                icon: IconSticker,
                owners: stat.tops.stickers
            },
            {
                id: ETabId.voiceDuration,
                lang: 'voice_duration',
                icon: IconMicrophone,
                owners: stat.tops.voiceDuration
            },
            {
                id: ETabId.roundDuration,
                lang: 'round_duration',
                icon: IconVideo,
                owners: stat.tops.roundDuration
            }
        ].filter((tab) => {
            if (
                tab.id === ETabId.uniqMessages &&
                (selectedOwner instanceof Api.Channel || selectedOwner instanceof Api.User)
            ) {
                return false;
            }

            return tab.owners.length;
        });

        return tabs;
    }

    function getDescription(tabId: ETabId, count: number, isSharing: boolean): string {
        if (tabId === ETabId.messages) {
            return declineAndFormat(count, md('decline.messages'));
        }

        if (tabId === ETabId.uniqMessages) {
            return declineAndFormat(count, md('decline.uniq_messages'));
        }

        if (tabId === ETabId.reactions) {
            return declineAndFormat(count, md('decline.reactions'));
        }

        if (tabId === ETabId.attachments) {
            return declineAndFormat(count, md('decline.attachments'));
        }

        if (tabId === ETabId.stickers) {
            return declineAndFormat(count, md('decline.stickers'));
        }

        if (tabId === ETabId.voiceDuration || tabId === ETabId.roundDuration) {
            if (isSharing) {
                const part = getStringsTimeArray(count);

                return part.slice(0, 2).join(' ');
            }

            return getTextTime(count);
        }

        return '';
    }

    if (needHideContent()) return null;

    if (statResult) {
        const counts = [
            { icon: IconMessage, label: mt('headers.count'), value: formatNumber(statResult.messages) },
            { icon: IconMessage2Bolt, label: mt('headers.uniq_count'), value: formatNumber(statResult.uniqMessages) },
            { icon: IconPaperclip, label: mt('headers.attachments'), value: formatNumber(statResult.attachmentsTotal) },
            { icon: IconSticker, label: mt('headers.stickers'), value: formatNumber(statResult.stickersTotal) },
            { icon: IconHeart, label: mt('headers.reactions'), value: formatNumber(statResult.reactionsTotal) },
            { icon: IconMicrophone, label: mt('headers.voice_duration'), value: getTextTime(statResult.voiceDuration) },
            { icon: IconVideo, label: mt('headers.round_duration'), value: getTextTime(statResult.roundDuration) },
            { icon: IconPhone, label: mt('headers.call_duration'), value: getTextTime(statResult.callDuration) }
        ].filter((item) => Boolean(item.value) && item.value !== '0');

        const tabs = getTabs(statResult);
        const tabsList = tabs.map(
            (tab) =>
                ({
                    id: tab.id as string,
                    name: mt(`headers.${tab.lang}`),
                    icon: tab.icon
                }) as ITabItem
        );

        const getTabDescription = () => {
            let langKey = null;

            if (selectedTab === ETabId.uniqMessages) {
                langKey = 'uniq_description';
            }

            if (selectedTab === ETabId.reactions) {
                langKey = 'reactions_description';
            }

            if (langKey) {
                return (
                    <Padding>
                        <Blockquote type="text">{mt(langKey)}</Blockquote>
                    </Padding>
                );
            }

            return null;
        };

        const onKickUserClick = (owner: Api.User) => {
            if (isDev) {
                console.log('kickMember', owner.id.valueOf());
                return;
            }

            popup
                .open({
                    message: mt('kick_question').replace('{name}', owner.firstName || 'No name'),
                    buttons: [
                        {
                            id: 'kick',
                            type: 'destructive',
                            text: mt('kick_button_yes')
                        },
                        {
                            id: 'save',
                            type: 'cancel'
                        }
                    ]
                })
                .then((result) => {
                    if (result === 'kick') {
                        kickMember(owner.id.valueOf());
                    }
                });
        };

        const topOwners = tabs.find((tab) => tab.id === selectedTab)?.owners || [];

        return (
            <>
                <Section className={commonClasses.sectionBox}>
                    <OwnerRow
                        owner={selectedOwner}
                        withoutLink={true}
                        description={mt('stat_date').replace('{date}', statResult.period)}
                    />

                    {shareData && (
                        <Padding>
                            <Button
                                mode="filled"
                                size="m"
                                stretched
                                onClick={() => {
                                    showShareModal({
                                        owner: selectedOwner as TOwnerType,
                                        type: ShareType.MESSAGE_STAT,
                                        data: shareData
                                    });
                                }}
                            >
                                {t('share.button')}
                            </Button>
                        </Padding>
                    )}
                </Section>

                <Section
                    className={classNames(commonClasses.sectionBox, commonClasses.showHr)}
                    header={mt('headers.counts')}
                >
                    {counts.map((item, key) => (
                        <Cell key={key} before={<item.icon size={14} />} after={item.value}>
                            {item.label}
                        </Cell>
                    ))}

                    <Padding>
                        <ReactionsList reactions={statResult.reactions} />
                    </Padding>
                </Section>

                <Section className={commonClasses.sectionBox}>
                    <Padding>
                        <ActivityChart data={statResult.activity} />
                    </Padding>
                </Section>

                {chatInactiveMembers.length > 0 && (
                    <Section
                        className={commonClasses.sectionBox}
                        header={`${mt('headers.inactive_users')} (${chatInactiveMembers.length})`}
                    >
                        <Placeholder description={mt('inactive_users_description')} />

                        {chatInactiveMembers.slice(0, chatInactiveMembersShowCount).map((owner, key) => (
                            <div key={owner.id.valueOf() + key}>
                                {OwnerRow({
                                    owner,
                                    callback:
                                        !(selectedOwner instanceof Api.User) && !selectedOwner?.adminRights?.banUsers
                                            ? undefined
                                            : () => onKickUserClick(owner)
                                })}
                            </div>
                        ))}

                        {chatInactiveMembers.length >
                            chatInactiveMembers.slice(0, chatInactiveMembersShowCount).length && (
                            <Padding>
                                <Button
                                    mode="filled"
                                    color="gray"
                                    stretched
                                    onClick={() => setChatInactiveMembersShowCount(1e3)}
                                >
                                    {mt('inactive_users_show_more')}
                                </Button>
                            </Padding>
                        )}
                    </Section>
                )}

                <Section className={commonClasses.sectionBox} header={mt('headers.tops')}>
                    <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                    {getTabDescription()}
                    {topOwners.map((top) => (
                        <OwnerRow
                            key={selectedTab + top.owner.id.valueOf()}
                            owner={top.owner}
                            description={getDescription(selectedTab, top.count, false)}
                            callback={top.activity ? () => setUserActivityModalData(top) : undefined}
                        />
                    ))}
                </Section>

                {userActivityModalData && (
                    <Modal
                        header={<ModalHeader />}
                        open={Boolean(userActivityModalData)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setUserActivityModalData(null);
                            }
                        }}
                    >
                        <OwnerRow owner={userActivityModalData.owner as Api.User} />
                        {userActivityModalData.activity && (
                            <Padding>
                                <ActivityChart data={userActivityModalData.activity} />
                            </Padding>
                        )}
                    </Modal>
                )}
            </>
        );
    }

    if (ownerPeriods.length) {
        return (
            <Section className={commonClasses.sectionBox}>
                <OwnerRow owner={selectedOwner} withoutLink={true} />

                {chatTopics.length > 0 && (
                    <Section header={mt('headers.topics')}>
                        {/* <Divider my="xs" label={mt('headers.topics')} labelPosition="center" mb={0} /> */}
                        <Padding>
                            <Button
                                stretched
                                size="s"
                                onClick={() => setSelectedChatTopic(0)}
                                mode={selectedChatTopic === 0 ? 'bezeled' : 'filled'}
                            >
                                {mt('all_messages_button')}
                            </Button>
                        </Padding>

                        {chatTopics.map((topic) => (
                            <div key={topic.id} style={{ padding: '0 10px 10px 10px' }}>
                                <Button
                                    stretched
                                    size="s"
                                    onClick={() => setSelectedChatTopic(topic.id)}
                                    mode={selectedChatTopic === topic.id ? 'bezeled' : 'filled'}
                                >
                                    {topic.name}
                                </Button>
                            </div>
                        ))}
                    </Section>
                )}

                <StatsPeriodPicker
                    statsPeriods={ownerPeriods}
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
                allowTypes={[EOwnerType.user, EOwnerType.chat, EOwnerType.supergroup]}
                onOwnerSelect={(owner) => {
                    setSelectedOwner(owner);
                    getOptions(owner);
                }}
            />
        </Section>
    );
}
