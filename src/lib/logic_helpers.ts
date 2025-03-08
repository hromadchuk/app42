import { Api } from 'telegram';
import { CallAPI, sleep, TOwnerType } from './helpers.ts';
import { t } from './lang.ts';
import { IProgress } from '../contexts/MethodContext.tsx';

interface IGetDialogsOptions {
    types: (typeof Api.Chat | typeof Api.Channel | typeof Api.User)[];
}

interface IGetDialogsMethods {
    setProgress: (progress: IProgress | null) => void;
}

export async function getDialogs<TYPES extends TOwnerType>(
    options: IGetDialogsOptions,
    { setProgress }: IGetDialogsMethods
): Promise<TYPES[]> {
    const { types } = options;

    const allDialogs: TOwnerType[] = [];

    setProgress({ text: t('common.getting_dialogs') });

    const params = {
        offsetPeer: new Api.InputPeerEmpty(),
        limit: 100,
        offsetDate: 0
    };

    while (true) {
        const { count, chats, users, dialogs, messages } = (await CallAPI(
            new Api.messages.GetDialogs(params)
        )) as Api.messages.DialogsSlice;

        setProgress({
            total: count || dialogs.length,
            addCount: dialogs.length
        });

        if (count > 2000) {
            await sleep(333);
        }

        if (dialogs.length) {
            dialogs.forEach((dialog) => {
                if (dialog.peer instanceof Api.PeerUser && types.includes(Api.User)) {
                    const findUser = users.find(
                        (user) => user.id.valueOf() === (dialog.peer as Api.PeerUser).userId.valueOf()
                    ) as Api.User;

                    allDialogs.push(findUser);
                } else if (dialog.peer instanceof Api.PeerChat && types.includes(Api.Chat)) {
                    const findChat = chats.find(
                        (chat) => chat.id.valueOf() === (dialog.peer as Api.PeerChat).chatId.valueOf()
                    ) as Api.Chat;

                    // skip system chats
                    if (findChat.migratedTo) {
                        return;
                    }

                    allDialogs.push(findChat);
                } else if (dialog.peer instanceof Api.PeerChannel && types.includes(Api.Channel)) {
                    const findChannel = chats.find(
                        (channel) => channel.id.valueOf() === (dialog.peer as Api.PeerChannel).channelId.valueOf()
                    ) as Api.Channel;

                    allDialogs.push(findChannel);
                }
            });

            const lastDialog = dialogs[dialogs.length - 1];
            const dialogPeer = JSON.stringify(lastDialog.peer.toJSON());

            const lastMessage = messages.find((message) => {
                return JSON.stringify((message as Api.Message).peerId.toJSON()) === dialogPeer;
            }) as Api.Message;

            params.offsetDate = lastMessage.date;
        } else {
            break;
        }
    }

    const filteredDialogs = allDialogs.reduce(
        (result, dialog) => {
            if (!result.ids.includes(dialog.id.valueOf())) {
                result.list.push(dialog);
                result.ids.push(dialog.id.valueOf());
            }

            return result;
        },
        { list: [], ids: [] } as { list: TOwnerType[]; ids: number[] }
    );

    setProgress(null);

    return filteredDialogs.list as TYPES[];
}
