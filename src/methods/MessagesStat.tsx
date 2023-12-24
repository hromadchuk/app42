import { JSX, useContext, useState } from 'react';
import {
    Button,
    Center,
    Container,
    Divider,
    Flex,
    Group,
    Image,
    Modal,
    Notification,
    Radio,
    SegmentedControl,
    Text,
    Textarea,
    Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHeart,
    IconMessage,
    IconMessage2Bolt,
    IconMicrophone,
    IconMoodSmile,
    IconPaperclip,
    IconPhone,
    IconSticker,
    IconVideo,
    TablerIconsProps
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Api } from 'telegram';
import { usePopup } from '@tma.js/sdk-react';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';
import {
    calculatePeriodsMessagesCount,
    filterMessages,
    getMessages,
    getMessagesByPeriod,
    getTotalMessagesCount,
    IGetMessagesCallbackArguments,
    IPeriodData,
    TPeer,
    TPeriodType,
    ValidationError
} from '../lib/methods/messages.ts';
import {
    CallAPI,
    declineAndFormat,
    formatNumber,
    getPeerId,
    getStringsTimeArray,
    getTextTime,
    notifyError
} from '../lib/helpers.ts';
import { MessagesStatSharingGenerator } from '../sharing/MessagesStatSharingGenerator.ts';
import { StatsPeriodPicker } from '../components/StatsPeriodPicker.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import { ReactionsList } from '../components/ReactionsList.tsx';

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
    owner: TPeer;
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

enum ENameImageType {
    firstName = 'firstName',
    username = 'username'
}

enum EModalType {
    text = 'text',
    image = 'image'
}

interface ITabTops {
    id: ETabId;
    lang: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    owners: ITopItem[];
}

interface ITopic {
    id: number;
    name: string;
}

const ownersInfo = new Map<number, TPeer>();
const sharingImages = new Map<string, string>();

export const MessagesStat = () => {
    const { mt, md, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);
    const [isModalOpened, { open, close }] = useDisclosure(false);
    const popup = usePopup();

    const [userActivityModalData, setUserActivityModalData] = useState<ITopItem | null>(null);
    const [isUserActivityModalOpened, { open: openUserActivityModal, close: closeUserActivityModal }] =
        useDisclosure(false);

    const [ownerMessages, setOwnerMessages] = useState<Api.TypeMessage[]>([]);
    const [ownerPeriods, setOwnerPeriods] = useState<IPeriodData[]>([]);
    const [chatInactiveMembers, setChatInactiveMembers] = useState<Api.User[]>([]);
    const [chatInactiveMembersShowCount, setChatInactiveMembersShowCount] = useState<number>(3);
    const [recordsPeriod, setRecordsPeriod] = useState<TPeriodType>([null, null]);
    const [selectedOwner, setSelectedOwner] = useState<TPeer | null>(null);
    const [statResult, setStatResult] = useState<IScanDataResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.messages);
    const [chatTopics, setChatTopics] = useState<ITopic[]>([]);
    const [selectedChatTopic, setSelectedChatTopic] = useState<number>(0);

    // sharing vars
    const [sharingNameType, setSharingNameType] = useState<ENameImageType>(ENameImageType.firstName);
    const [sharingTopType, setSharingTopType] = useState<ETabId>(ETabId.messages);
    const [isSharingImagesLoading, setSharingImagesLoading] = useState<boolean>(true);
    const [isSharingButtonVisible, setSharingButtonVisible] = useState<boolean>(true);
    const [messageText, setMessageText] = useState<string>('');
    const [isSentToChat, setSentToChat] = useState<boolean>(false);
    const [modalType, setModalType] = useState<EModalType>(EModalType.text);

    async function getOptions(owner: TPeer) {
        setProgress({ text: mt('loading_messages') });
        setSelectedOwner(owner);

        const count = await getTotalMessagesCount(owner.id);

        if (!count) {
            setFinishBlock({ text: mt('no_messages'), state: 'error' });
            return;
        }

        if (count < 10) {
            setFinishBlock({ text: mt('need_more_messages'), state: 'error' });
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
                        if (voice) {
                            peersData[peerId].voiceDuration += voice.duration;
                            statData.voiceDuration += voice.duration;
                        }

                        const round = attributes.find(
                            (attribute) => attribute instanceof Api.DocumentAttributeVideo
                        ) as Api.DocumentAttributeVideo | undefined;
                        if (round) {
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
            const activeUserIds = usersDataArray.filter((user) => user.count > 0).map((user) => user.peerId);
            const members = await getMembers();
            const membersWithoutMessages = members.filter((member) => {
                const userId = member.id.valueOf();

                if (userId === window.userId) {
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
        prepareImages(stat);
    }

    function getImageName(type: ENameImageType, owner: TPeer): string {
        if (type === ENameImageType.username) {
            let username = '';

            if ((owner instanceof Api.User || owner instanceof Api.Channel) && owner.username) {
                username = owner.username;
            }

            if ((owner instanceof Api.User || owner instanceof Api.Channel) && owner.usernames?.length) {
                username = owner.usernames[0].username;
            }

            if (username) {
                return `@${username.toLowerCase()}`;
            }
        }

        if (owner instanceof Api.User && owner.firstName) {
            return owner.firstName;
        }

        if (owner instanceof Api.Chat || owner instanceof Api.Channel) {
            return owner.title;
        }

        return 'unknown name';
    }

    async function getMembers(): Promise<Api.User[]> {
        if (selectedOwner instanceof Api.Chat) {
            const result = (await CallAPI(
                new Api.messages.GetFullChat({
                    chatId: selectedOwner.id
                })
            )) as Api.messages.ChatFull;

            return result.users as Api.User[];
        }

        if (selectedOwner instanceof Api.Channel) {
            const result = (await CallAPI(
                new Api.channels.GetParticipants({
                    channel: selectedOwner,
                    limit: 200,
                    offset: 0,
                    filter: new Api.ChannelParticipantsRecent()
                })
            )) as Api.channels.ChannelParticipants;

            return result.users as Api.User[];
        }

        return [];
    }

    function kickMember(userId: number) {
        if (selectedOwner instanceof Api.Chat) {
            CallAPI(
                new Api.messages.DeleteChatUser({
                    chatId: selectedOwner.id,
                    userId
                })
            );
        }

        if (selectedOwner instanceof Api.Channel) {
            CallAPI(
                new Api.channels.EditBanned({
                    channel: selectedOwner.id.valueOf(),
                    participant: userId,
                    bannedRights: new Api.ChatBannedRights({
                        untilDate: 1,
                        viewMessages: true,
                        sendMessages: true,
                        sendMedia: true,
                        sendStickers: true,
                        sendGifs: true,
                        sendGames: true,
                        sendInline: true,
                        sendPolls: true,
                        changeInfo: true,
                        inviteUsers: true,
                        pinMessages: true
                    })
                })
            );
        }

        setChatInactiveMembers(chatInactiveMembers.filter((member) => member.id.valueOf() !== userId));
    }

    async function prepareImages(stat: IScanDataResult) {
        const tabs = getImageTabs(stat);

        if (tabs.length === 0) {
            setSharingButtonVisible(false);
            setSharingImagesLoading(false);
            return;
        }

        const tabsOwners = [];

        for (const tab of tabs) {
            for (const item of tab.owners) {
                tabsOwners.push(item.owner);
            }
        }

        await MessagesStatSharingGenerator.prepareImages(tabsOwners);

        const imagesTasks = [];
        for (const imaneNameType of Object.values(ENameImageType)) {
            for (const tab of tabs) {
                imagesTasks.push(
                    (async () => {
                        const data = await new MessagesStatSharingGenerator().getMessageImage({
                            title: mt('sharing.image_title'),
                            users: tab.owners.map((item) => ({
                                info: item.owner as Api.User,
                                name: getImageName(imaneNameType, item.owner),
                                description: getDescription(tab.id, item.count, true)
                            })),
                            description: mt('sharing.image_period').replace('{period}', stat.period),
                            subDescription: getImageSubDescription(tab.id)
                        });

                        sharingImages.set(`${imaneNameType}_${tab.id}`, data);
                    })()
                );
            }
        }

        await Promise.all(imagesTasks);

        setSharingImagesLoading(false);
    }

    function getImageTabs(stat: IScanDataResult) {
        return getTabs(stat).filter((tab) => {
            if (tab.id === ETabId.uniqMessages) {
                return false;
            }

            return tab.owners.length >= 3;
        });
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

    function getImageSubDescription(tabId: ETabId): string {
        if (tabId === ETabId.messages) {
            return mt('sharing.by.messages');
        }

        if (tabId === ETabId.uniqMessages) {
            return mt('sharing.by.uniq_messages');
        }

        if (tabId === ETabId.reactions) {
            return mt('sharing.by.reactions');
        }

        if (tabId === ETabId.attachments) {
            return mt('sharing.by.attachments');
        }

        if (tabId === ETabId.stickers) {
            return mt('sharing.by.stickers');
        }

        if (tabId === ETabId.voiceDuration) {
            return mt('sharing.by.voice_duration');
        }

        if (tabId === ETabId.roundDuration) {
            return mt('sharing.by.round_duration');
        }

        return '';
    }

    function ModalContent() {
        if (modalType === EModalType.text) {
            return (
                <>
                    {mt('sharing.text_description')}

                    <Textarea autosize value={messageText} readOnly />

                    <Button
                        fullWidth
                        size="xs"
                        mt="xs"
                        onClick={() => {
                            CallAPI(
                                new Api.messages.SendMessage({
                                    peer: selectedOwner?.id,
                                    message: messageText
                                })
                            );

                            setSentToChat(true);
                            close();
                        }}
                    >
                        {mt('button_send')}
                    </Button>
                </>
            );
        }

        const imageKey = `${sharingNameType}_${sharingTopType}`;
        const image = sharingImages.get(imageKey) as string;
        const tabs = getImageTabs(statResult as IScanDataResult);

        return (
            <>
                <Image key={imageKey} radius="md" src={image} />

                <Title mt="xs" order={6}>
                    {mt('sharing.image_name_type')}
                </Title>

                <SegmentedControl
                    fullWidth
                    size="xs"
                    value={sharingNameType}
                    onChange={(type) => setSharingNameType(type as ENameImageType)}
                    data={[
                        { label: mt('sharing.names_type.name'), value: ENameImageType.firstName },
                        { label: mt('sharing.names_type.username'), value: ENameImageType.username }
                    ]}
                />

                <Title mt="xs" order={6}>
                    {mt('sharing.image_type')}
                </Title>
                <Radio.Group value={sharingTopType} onChange={(type) => setSharingTopType(type as ETabId)}>
                    {tabs.map((tab, key) => (
                        <Radio key={key} value={tab.id} label={mt(`headers.${tab.lang}`)} mt={5} />
                    ))}
                </Radio.Group>

                <Button
                    fullWidth
                    size="xs"
                    mt="xs"
                    loading={isSharingImagesLoading}
                    onClick={async () => {
                        setSharingImagesLoading(true);

                        await MessagesStatSharingGenerator.sendMessage(image, selectedOwner as TPeer);

                        setSharingImagesLoading(false);
                        close();
                    }}
                >
                    {mt('button_send_image')}
                </Button>
            </>
        );
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

        const getRowBackground = (index: number): string => {
            if (index % 2) {
                return `var(--tg-color-secondary-bg-color)`;
            }

            return '';
        };

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
                    <Notification withCloseButton={false} my="xs" color="gray">
                        {mt(langKey)}
                    </Notification>
                );
            }

            return null;
        };

        const sendToChat = () => {
            const lines = [mt('stat_date').replace('{date}', statResult.period), ''];

            counts.forEach(({ label, value }) => {
                lines.push(`* ${label} — ${value}`);
            });

            setMessageText(lines.join('\n'));
            setModalType(EModalType.text);

            open();
        };

        const onTopOwnerClick = (top: ITopItem) => {
            setUserActivityModalData(top);
            openUserActivityModal();
        };

        const sendToChatImage = () => {
            setModalType(EModalType.image);
            open();
        };

        const topOwners = tabs.find((tab) => tab.id === selectedTab)?.owners || [];

        return (
            <>
                <Modal opened={isModalOpened} onClose={close} title={mt('sharing.modal_title')}>
                    {ModalContent()}
                </Modal>

                <Modal
                    opened={isUserActivityModalOpened}
                    onClose={closeUserActivityModal}
                    title={mt('user_activity.modal_title')}
                >
                    {userActivityModalData && (
                        <>
                            <OwnerRow owner={userActivityModalData.owner as Api.User} />
                            <Divider my="sm" />
                            {userActivityModalData.activity && <ActivityChart data={userActivityModalData.activity} />}
                        </>
                    )}
                </Modal>

                <OwnerRow
                    owner={selectedOwner}
                    withoutLink={true}
                    description={mt('stat_date').replace('{date}', statResult.period)}
                />

                <Button fullWidth size="xs" mt="xs" onClick={sendToChat} disabled={isSentToChat}>
                    {isSentToChat ? mt('button_send_done') : mt('button_send')}
                </Button>

                {isSharingButtonVisible && (
                    <Button
                        fullWidth
                        size="xs"
                        mt="xs"
                        onClick={sendToChatImage}
                        loading={isSharingImagesLoading}
                        disabled={isSharingImagesLoading}
                    >
                        {mt('button_send_image')}
                    </Button>
                )}

                <Divider my="xs" label={mt('headers.counts')} labelPosition="center" mb={0} />
                {counts.map((item, key) => (
                    <Flex
                        key={key}
                        gap="md"
                        p={5}
                        justify="flex-start"
                        align="center"
                        direction="row"
                        wrap="wrap"
                        bg={getRowBackground(key)}
                    >
                        <item.icon size={14} />
                        <Text size="sm" inline>
                            {item.label}
                        </Text>

                        <Container p={0} mr={0}>
                            <Text size="12px" c="dimmed">
                                {item.value}
                            </Text>
                        </Container>
                    </Flex>
                ))}

                <ReactionsList reactions={statResult.reactions} />
                <ActivityChart data={statResult.activity} />

                {chatInactiveMembers.length > 0 && (
                    <>
                        <Divider
                            my="xs"
                            label={`${mt('headers.inactive_users')} (${chatInactiveMembers.length})`}
                            labelPosition="center"
                            mb={0}
                        />

                        <Center>
                            <Text size="xs" mb="xs">
                                {mt('inactive_users_description')}
                            </Text>
                        </Center>

                        {chatInactiveMembers.slice(0, chatInactiveMembersShowCount).map((owner, key) => (
                            <div key={owner.id.valueOf() + key}>
                                {OwnerRow({
                                    owner,
                                    callback() {
                                        window.listenMAEvents.popup_closed = (data) => {
                                            delete window.listenMAEvents.popup_closed;

                                            if (data?.button_id === 'kick') {
                                                kickMember(owner.id.valueOf());
                                            }
                                        };

                                        popup.open({
                                            message: mt('kick_question').replace(
                                                '{name}',
                                                owner.firstName || 'No name'
                                            ),
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
                                        });
                                    }
                                })}
                            </div>
                        ))}

                        {chatInactiveMembers.length >
                            chatInactiveMembers.slice(0, chatInactiveMembersShowCount).length && (
                            <Group mt="xs">
                                <Button
                                    variant="light"
                                    color="gray"
                                    fullWidth
                                    onClick={() => setChatInactiveMembersShowCount(1e3)}
                                >
                                    {mt('inactive_users_show_more')}
                                </Button>
                            </Group>
                        )}
                    </>
                )}

                <Divider my="xs" label={mt('headers.tops')} labelPosition="center" mb={0} />
                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                {getTabDescription()}
                {topOwners.map((top) => (
                    <OwnerRow
                        key={selectedTab + top.owner.id.valueOf()}
                        owner={top.owner}
                        description={getDescription(selectedTab, top.count, false)}
                        callback={top.activity ? () => onTopOwnerClick(top) : undefined}
                    />
                ))}
            </>
        );
    }

    if (ownerPeriods.length) {
        return (
            <>
                <OwnerRow owner={selectedOwner} withoutLink={true} />

                {chatTopics.length > 0 && (
                    <>
                        <Divider my="xs" label={mt('headers.topics')} labelPosition="center" mb={0} />
                        <Button
                            fullWidth
                            onClick={() => setSelectedChatTopic(0)}
                            variant={selectedChatTopic === 0 ? 'primary' : 'light'}
                        >
                            {mt('all_messages_button')}
                        </Button>

                        {chatTopics.map((topic) => (
                            <Button
                                key={topic.id}
                                mt="xs"
                                fullWidth
                                onClick={() => setSelectedChatTopic(topic.id)}
                                variant={topic.id === selectedChatTopic ? 'primary' : 'light'}
                            >
                                {topic.name}
                            </Button>
                        ))}
                    </>
                )}

                <StatsPeriodPicker
                    statsPeriods={ownerPeriods}
                    statsPeriod={recordsPeriod}
                    setStatsPeriod={setRecordsPeriod}
                    calcStatistic={calcStatistic}
                />
            </>
        );
    }

    return (
        <SelectDialog
            allowTypes={[EOwnerType.user, EOwnerType.chat, EOwnerType.supergroup]}
            onOwnerSelect={(owner) => {
                setSelectedOwner(owner);
                getOptions(owner);
            }}
        />
    );
};

export default MessagesStat;
