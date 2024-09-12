import { Api } from 'telegram';
import { CallAPI } from '../helpers.ts';
import { isDev } from '../utils.ts';
import { TDialogWithoutUser } from '../../contexts/MethodContext.tsx';

export async function getDialogMembers(dialog: TDialogWithoutUser): Promise<Api.User[]> {
    const participants = await getDialogParticipants(dialog);

    if (participants instanceof Api.channels.ChannelParticipantsNotModified) {
        return [];
    }

    return participants.users.filter((user) => user instanceof Api.User) as Api.User[];
}

export async function getDialogParticipants(
    dialog: TDialogWithoutUser
): Promise<Api.messages.ChatFull | Api.channels.TypeChannelParticipants> {
    if (dialog instanceof Api.Chat) {
        return await CallAPI(
            new Api.messages.GetFullChat({
                chatId: dialog.id
            })
        );
    }

    return await CallAPI(
        new Api.channels.GetParticipants({
            channel: dialog,
            limit: 200,
            offset: 0,
            filter: new Api.ChannelParticipantsRecent()
        })
    );
}

export async function kickMemberFromDialog(memberId: number, dialog: TDialogWithoutUser) {
    if (isDev) {
        console.log('kickMemberFromDialog', memberId, dialog);
        return;
    }

    if (dialog instanceof Api.Chat) {
        await CallAPI(
            new Api.messages.DeleteChatUser({
                chatId: dialog.id,
                userId: memberId
            })
        );
        return;
    }

    await CallAPI(
        new Api.channels.EditBanned({
            channel: dialog.id.valueOf(),
            participant: memberId,
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
