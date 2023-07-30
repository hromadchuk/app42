import React, { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { Badge, Button, Card, Divider, Group, Modal, Text, UnstyledButton } from '@mantine/core';
import { IconCalendarTime, IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { AppContext } from '../components/AppContext.tsx';
import { MethodContext } from '../components/MethodContext.tsx';
import { declineAndFormat } from '../lib/helpers.tsx';

type TOwner = Api.User | Api.Chat | Api.Channel;

type TCorrectMessage = Api.Message | Api.MessageService;

interface IGetHistoryParams {
    peer: Api.TypeEntityLike;
    limit: number;
    offsetId?: number;
}

interface IPeriodData {
    period: number;
    disabled: boolean;
    count: number;
    periodDate: number;
    circa?: boolean;
}

interface IPeerData {
    count: number;
    uniqCount: number;
    emoji: number;
    attachments: number;
    stickers: number;
    voiceDuration: number;
    roundDuration: number;
}

interface IScanData {
    firstMessage: TCorrectMessage;
    lastMessage: TCorrectMessage;
    messages: number;
    uniqMessages: number;
    voiceDuration: number;
    roundDuration: number;
    callDuration: number;
    attachments: number;
    attachmentsTypes: { [key: string]: string };
    // emoji: {},
    // stickers: {},
    stickersTotal: number;
    servicesMessages: { [key: string]: number };
}

const ownersInfo = new Map<number, TOwner>();

export const MessagesStat = () => {
    const { user } = useContext(AppContext);
    const { mt, md, needHideContent, getProgress, setProgress, setFinishBlock } = useContext(MethodContext);

    const [dialogsList, setDialogsList] = useState<(Api.User | Api.Chat | Api.Channel)[]>([]);
    const [ownerMessages, setOwnerMessages] = useState<Api.TypeMessage[]>([]);
    const [ownerPeriods, setOwnerPeriods] = useState<IPeriodData[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<TOwner | null>(null);

    useEffect(() => {
        getLastDialogs();
    }, []);

    async function getLastDialogs() {
        setProgress({ text: mt('loading_dialogs') });

        const result = (await window.TelegramClient.invoke(
            new Api.messages.GetDialogs({
                offsetPeer: user?.id.valueOf(),
                limit: 100
            })
        )) as Api.messages.Dialogs;

        const dialogs = result.dialogs.map((dialog): TOwner => {
            const isUser = dialog.peer instanceof Api.PeerUser;
            const isChat = dialog.peer instanceof Api.PeerChat;
            const isChannel = dialog.peer instanceof Api.PeerChannel;

            let ownerId = 0;
            if (isUser) {
                ownerId = (dialog.peer as Api.PeerUser).userId.valueOf();
            } else if (isChat) {
                ownerId = (dialog.peer as Api.PeerChat).chatId.valueOf();
            } else if (isChannel) {
                ownerId = (dialog.peer as Api.PeerChannel).channelId.valueOf();
            }

            if (isUser) {
                return result.users.find((findUser) => findUser.id.valueOf() === ownerId) as Api.User;
            }

            if (isChat) {
                return result.chats.find((findChat) => findChat.id.valueOf() === ownerId) as Api.Chat;
            }

            return result.chats.find((findChannel) => findChannel.id.valueOf() === ownerId) as Api.Channel;
        });

        setDialogsList(dialogs);
        setProgress(null);
    }

    async function getOptions(owner: TOwner) {
        setProgress({ text: mt('loading_messages') });
        setSelectedOwner(owner);

        console.log('owner', owner);

        const { count } = (await window.TelegramClient.invoke(
            new Api.messages.GetHistory({
                peer: owner.id,
                limit: 1
            })
        )) as Api.messages.MessagesSlice;

        if (!count) {
            setFinishBlock({ text: mt('no_messages'), state: 'error' });
            return;
        }

        if (count < 20) {
            setFinishBlock({ text: mt('too_few_messages'), state: 'error' });
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
        const periodsData: IPeriodData[] = [];

        if (count < 3_000) {
            const messages = await getMessages(owner, count, 0);

            console.log(1, { messages });

            for (const period of periods) {
                const periodDate = Math.round(Number(dayjs().add(-period, 'days')) / 1000);
                const periodMessages = messages.filter((message) => message.date > periodDate);

                periodsData.push({
                    period,
                    disabled: periodMessages.length === 0,
                    count: periodMessages.length,
                    periodDate
                });
            }
        } else {
            for (const period of periods) {
                const periodDate = Math.round(Number(dayjs().add(-period, 'days')) / 1000);

                const { offsetIdOffset } = (await window.TelegramClient.invoke(
                    new Api.messages.Search({
                        peer: owner.id,
                        q: '',
                        filter: new Api.InputMessagesFilterEmpty(),
                        maxDate: periodDate,
                        limit: 1
                    })
                )) as Api.messages.MessagesSlice;

                periodsData.push({
                    period,
                    circa: true,
                    disabled: !offsetIdOffset,
                    count: (offsetIdOffset || 0) + 1,
                    periodDate
                });
            }
        }

        periodsData.push({
            period: 0,
            disabled: false,
            count,
            periodDate: 0
        });

        setOwnerPeriods(periodsData);
        setProgress(null);
    }

    function filterMessages(messages: Api.TypeMessage[], endTime: number): TCorrectMessage[] {
        const correctMessages: TCorrectMessage[] = messages.filter((message) => {
            return !(message instanceof Api.MessageEmpty);
        }) as TCorrectMessage[];

        if (endTime) {
            return correctMessages.filter((message) => {
                return message.date > endTime;
            });
        }

        return correctMessages;
    }

    function getAuthorId(message: TCorrectMessage): number {
        const author = message.fromId || message.peerId;

        if (author instanceof Api.PeerUser) {
            return author.userId.valueOf();
        }

        if (author instanceof Api.PeerChat) {
            return author.chatId.valueOf();
        }

        return author.channelId.valueOf();
    }

    async function getMessages(owner: TOwner, total: number, endTime: number): Promise<TCorrectMessage[]> {
        console.log({ owner, total, endTime });

        if (ownerMessages.length) {
            return filterMessages(ownerMessages, endTime);
        }

        const processMessages: TCorrectMessage[] = [];

        setProgress({ text: mt('loading_messages'), total });

        const params: IGetHistoryParams = {
            peer: owner.id,
            limit: 100
        };

        let working = true;

        while (working) {
            const { messages, chats, users } = (await window.TelegramClient.invoke(
                new Api.messages.GetHistory(params)
            )) as Api.messages.MessagesSlice;

            for (const dialogOwner of [...users, ...chats]) {
                ownersInfo.set(dialogOwner.id.valueOf(), dialogOwner as TOwner);
            }

            const partMessages = filterMessages(messages, endTime);

            if (partMessages.length) {
                processMessages.push(...partMessages);

                setProgress({ ...getProgress(), count: processMessages.length });

                params.offsetId = partMessages[partMessages.length - 1].id;
            } else {
                working = false;
            }
        }

        console.log('ownersInfo', ownersInfo);

        setOwnerMessages(processMessages);

        return processMessages;
    }

    async function calcStatistic(period: IPeriodData) {
        console.log({period, selectedOwner});

        const messages = await getMessages(selectedOwner as TOwner, period.count, period.periodDate);

        setProgress({ text: mt('loading_calculation') });

        console.log({messages});

        let lastPeerId = 0;
        const groupedIds = new Set<number>();
        const peersData: { [key: number]: IPeerData } = {};
        const statData: IScanData = {
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
            attachments: 0,
            attachmentsTypes: {},
            // emoji: {},
            // stickers: {},
            stickersTotal: 0,
            servicesMessages: {}
        };

        messages.forEach((message) => {
            const peerId = getAuthorId(message);

            console.log(peerId);

            if (!peersData[peerId]) {
                peersData[peerId] = {
                    count: 0,
                    uniqCount: 0,
                    emoji: 0,
                    attachments: 0,
                    stickers: 0,
                    voiceDuration: 0,
                    roundDuration: 0
                };
            }

            if (message instanceof Api.MessageService) {
                console.log('SERVICE', message);

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

        //     if (message.media) {
        //         const type = message.media._;
        //         const isDocument = type === 'messageMediaDocument';
        //         const attributes = (isDocument && ((message.media.document && message.media.document.attributes) || [])) || []
        //
        //         const sticker = attributes.find((attr) => attr._ === 'documentAttributeSticker');
        //         const voice = attributes.find((attr) => attr.voice);
        //         const round = attributes.find((attr) => attr.round_message);
        //
        //         if (sticker) {
        //             const stickerId = `${ message.media.document.id }_${ message.media.document.access_hash }`;
        //
        //             if (!statData.stickers[stickerId]) {
        //                 statData.stickers[stickerId] = 0;
        //             }
        //
        //             peersData[peerId].stickers++;
        //             statData.stickers[stickerId]++;
        //             statData.stickersTotal++;
        //         } else if (voice) {
        //             statData.voiceDuration += voice.duration;
        //             peersData[peerId].voiceDuration += voice.duration;
        //         } else if (round) {
        //             statData.roundDuration += round.duration;
        //             peersData[peerId].roundDuration += round.duration;
        //         } else {
        //             const attachType = message.media._.replace('messageMedia', '').toLowerCase();
        //
        //             if (!statData.attachmentsTypes[attachType]) {
        //                 statData.attachmentsTypes[attachType] = 0;
        //             }
        //
        //             peersData[peerId].attachments++;
        //
        //             statData.attachmentsTypes[attachType]++;
        //             statData.attachments++;
        //         }
        //     }
        //
        //     if (message.entities) {
        //         message.entities.forEach(({ _, document_id }) => {
        //             if (_ === 'messageEntityCustomEmoji') {
        //                 if (!statData.emoji[document_id]) {
        //                     statData.emoji[document_id] = 0;
        //                 }
        //
        //                 peersData[peerId].emoji++;
        //                 statData.emoji[document_id]++;
        //             }
        //         });
        //     }
        //
        //     if (message.grouped_id) {
        //         if (groupedIds[message.grouped_id]) {
        //             return; // skip duplicate
        //         }
        //
        //         groupedIds[message.grouped_id] = true;
        //     }

            if (peerId !== lastPeerId) {
                statData.uniqMessages++;
                peersData[peerId].uniqCount++;
                lastPeerId = peerId;
            }

            peersData[peerId].count++;
            statData.messages++;
        });

        // this.log('statData', statData);
        //
        // const usersDataArray = Object.keys(peersData).map((peerId) => {
        //     peersData[peerId].id = peerId;
        //
        //     return peersData[peerId];
        // });
        //
        // const getTop = (key) => {
        //     return usersDataArray
        //         .sort((a, b) => b[key] - a[key])
        //         .slice(0, 50)
        //         .filter(user => user[key]);
        // };
        //
        // statData.tops = {
        //     count: getTop('count'),
        //     uniq_count: getTop('uniqCount'),
        //     emoji: getTop('emoji'),
        //     attachments: getTop('attachments'),
        //     stickers: getTop('stickers'),
        //     voice_duration: getTop('voiceDuration'),
        //     round_duration: getTop('roundDuration'),
        // };
        //
        // Object.keys(statData.tops).forEach((key) => {
        //     if (!statData.tops[key].length) {
        //         delete statData.tops[key];
        //     }
        // });
        //
        // this.setState({
        //     stat: statData,
        //     selectedTopTab: Object.keys(statData.tops)[0],
        // });
        //
        // this.endProgress();

        console.log('statData', statData);
        console.log('peersData', peersData);
    }

    if (needHideContent()) return null;

    if (ownerPeriods.length) {
        return (
            <>
                {OwnerRow({ owner: selectedOwner, withoutLink: true })}
                {ownerPeriods.map((period, key) => (
                    <div key={key}>
                        <UnstyledButton
                            component="button"
                            disabled={period.disabled}
                            style={{ opacity: period.disabled ? 0.5 : 1 }}
                            onClick={() => calcStatistic(period)}
                        >
                            <Group spacing="sm" py={3}>
                                <IconCalendarTime />

                                <div>
                                    <Text lineClamp={1} span fz="sm" fw={500}>
                                        {mt(`periods.${period.period}`)}
                                    </Text>
                                    <Text c="dimmed" fz="xs">
                                        {period.circa ? '~' : ''}
                                        {declineAndFormat(period.count, md('decline.messages'))}
                                    </Text>
                                </div>
                            </Group>
                        </UnstyledButton>
                    </div>
                ))}
            </>
        );
    }

    if (dialogsList.length) {
        return (
            <>
                {dialogsList.map((dialog, key) => (
                    <div key={key}>
                        {OwnerRow({
                            owner: dialog,
                            callback: () => getOptions(dialog)
                        })}
                    </div>
                ))}
            </>
        );
    }

    return null;
};

export default MessagesStat;
