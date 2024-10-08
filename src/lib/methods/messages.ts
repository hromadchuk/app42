import { Api } from 'telegram';
import dayjs from 'dayjs';
import { CallAPI, sleep, TOwnerType } from '../helpers.ts';
import { Constants } from '../../constants.ts';
import { IProgress } from '../../contexts/MethodContext.tsx';

export type TCorrectMessage = Api.Message | Api.MessageService;

export type TPeriodType = [Date | null, Date | null];

export interface IPeriodData {
    period: number;
    disabled: boolean;
    count: number;
    periodDate: number;
    circa?: boolean;
}

export interface IGetHistoryParams {
    peer: Api.TypeEntityLike;
    limit: number;
    offsetDate?: number;
    offsetId?: number;
}

export interface IGetMessagesCallbackArguments {
    peer: TOwnerType;
    total: number;
    endTime: number;
    startDate?: number | undefined | null;
}

export interface IGetMessagesArguments extends IGetMessagesCallbackArguments {
    peerInfo: Map<number, TOwnerType>;
    setProgress: (progress: IProgress | null) => void;
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export async function getTotalMessagesCount(channelId: Api.long): Promise<number> {
    const { count } = (await CallAPI(
        new Api.messages.GetHistory({
            peer: channelId,
            limit: 1
        })
    )) as Api.messages.MessagesSlice;

    return count;
}

export async function calculatePeriodsMessagesCount(
    messagesCount: number,
    periods: number[],
    peer: TOwnerType,
    getMessagesCallback: ({
        peer,
        total,
        endTime,
        startDate
    }: IGetMessagesCallbackArguments) => Promise<TCorrectMessage[]>
): Promise<IPeriodData[]> {
    const periodsData: IPeriodData[] = [];

    if (messagesCount < 3_000) {
        const messages = await getMessagesCallback(<IGetMessagesCallbackArguments>{
            peer,
            total: messagesCount,
            endTime: 0
        });

        for (const period of periods) {
            const periodTimestamp = calculatePeriodTimestamp(period);
            const periodMessages = messages.filter((record) => record.date > periodTimestamp);

            periodsData.push({
                period,
                disabled: periodMessages.length === 0,
                count: periodMessages.length,
                periodDate: periodTimestamp
            });
        }

        return periodsData;
    }

    for (const period of periods) {
        const periodTimestamp = calculatePeriodTimestamp(period);
        const offsetIdOffset = await calculateEstimatedNumberOfPeriodMessages({
            peerId: peer.id,
            periodTo: periodTimestamp
        });

        periodsData.push({
            period,
            circa: true,
            disabled: !offsetIdOffset,
            count: offsetIdOffset + 1,
            periodDate: periodTimestamp
        });
    }

    return periodsData;
}

export async function getMessages({
    peer,
    total,
    endTime,
    startDate = null,
    peerInfo,
    setProgress
}: IGetMessagesArguments) {
    const processMessages: TCorrectMessage[] = [];
    const limit = 100;

    const params: IGetHistoryParams = {
        peer: peer.id,
        limit
    };

    if (startDate !== null) {
        params.offsetDate = startDate;
    }

    while (true) {
        if (total > 3_000) {
            await sleep(777);
        }

        const { messages, chats, users } = (await CallAPI(
            new Api.messages.GetHistory(params)
        )) as Api.messages.MessagesSlice;

        for (const dialogOwner of [...users, ...chats]) {
            peerInfo.set(dialogOwner.id.valueOf(), dialogOwner as Api.Chat);
        }

        const partMessages = filterMessages(messages, endTime, startDate);

        if (!partMessages.length) {
            break;
        }

        processMessages.push(...partMessages);
        setProgress({ addCount: partMessages.length });

        params.offsetId = partMessages[partMessages.length - 1].id;
    }

    return processMessages;
}

export function filterMessages(
    messages: Api.TypeMessage[],
    endTime: number,
    startTime?: number | null
): TCorrectMessage[] {
    let correctMessages: TCorrectMessage[] = messages.filter((message) => {
        return !(message instanceof Api.MessageEmpty);
    }) as TCorrectMessage[];

    if (endTime) {
        correctMessages = correctMessages.filter((message) => message.date >= endTime);
    }

    if (startTime) {
        correctMessages = correctMessages.filter((message) => message.date < startTime);
    }

    return correctMessages;
}

export async function calculateEstimatedNumberOfPeriodMessages({
    peerId,
    periodFrom,
    periodTo
}: {
    peerId: Api.long;
    periodFrom?: number;
    periodTo: number;
}): Promise<number> {
    const messagesSearchParams = {
        peer: peerId,
        q: '',
        filter: new Api.InputMessagesFilterEmpty(),
        maxDate: periodTo,
        limit: 1
    };

    const { offsetIdOffset } = (await CallAPI(
        new Api.messages.Search(messagesSearchParams)
    )) as Api.messages.MessagesSlice;

    if (!offsetIdOffset && periodFrom !== 0 && !periodFrom) {
        return 0;
    }

    if (periodFrom !== undefined) {
        messagesSearchParams.maxDate = periodFrom;

        let periodFromMessagesCount: number;
        // For some reason if you get messages with max date greater than telegram foundation,
        // api returns null as offset
        if (Constants.TELEGRAM_FOUNDATION_DATE >= periodFrom) {
            periodFromMessagesCount = await getTotalMessagesCount(peerId);
        } else {
            const { offsetIdOffset: periodFromOffsetId } = (await CallAPI(
                new Api.messages.Search(messagesSearchParams)
            )) as Api.messages.MessagesSlice;

            periodFromMessagesCount = periodFromOffsetId || 0;
        }

        return periodFromMessagesCount - (offsetIdOffset || 0);
    }

    return offsetIdOffset || 0;
}

export async function getMessagesByPeriod(
    period: TPeriodType,
    selectedPeer: TOwnerType | null,
    getMessagesDecorator: (args: IGetMessagesCallbackArguments) => Promise<TCorrectMessage[]>
) {
    const dateFrom = period[0]?.getTime();
    const dateTo = period[1]?.getTime();

    if (dateFrom === null || dateFrom === undefined || !dateTo) {
        throw new ValidationError('incorrect_period');
    }

    if (selectedPeer === null) {
        throw new ValidationError('channel_not_selected');
    }

    const messagesCountInPeriod = await calculateEstimatedNumberOfPeriodMessages({
        peerId: selectedPeer.id,
        periodFrom: dateFrom / 1000,
        periodTo: dateTo / 1000
    });

    if (!messagesCountInPeriod) {
        throw new ValidationError('no_messages_for_period');
    }

    const messages = await getMessagesDecorator({
        peer: selectedPeer as Api.Channel,
        total: messagesCountInPeriod + 1,
        endTime: dateFrom / 1000,
        startDate: dateTo / 1000
    });

    if (messages.length === 0) {
        throw new ValidationError('no_messages_for_period');
    }

    return messages;
}

export function calculatePeriodTimestamp(period: number) {
    return Math.round(Number(dayjs().add(-period, 'days')) / 1000);
}
