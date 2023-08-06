import { useContext, useEffect, useState } from 'react';
import { ActionIcon, Button, CopyButton, Input, Space, TextInput } from '@mantine/core';
import { IconAt, IconCheck, IconCopy } from '@tabler/icons-react';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { Api } from 'telegram';
import { CallAPI, sleep } from '../lib/helpers.tsx';

import { AppContext } from '../components/AppContext.tsx';
import { MethodContext } from '../components/MethodContext.tsx';

import HeartAnimation from '../assets/animated_messages/heart.tsx';

export const AnimatedMessages = () => {
    const { user } = useContext(AppContext);
    const { mt, needHideContent, setProgress } = useContext(MethodContext);

    const [dialogsList, setDialogsList] = useState<Api.User[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<Api.User | null>(null);

    useEffect(() => {
        getLastDialogs();
    }, []);

    async function getLastDialogs() {
        setProgress({ text: mt('loading_dialogs') });

        const result = (await CallAPI(
            new Api.messages.GetDialogs({
                offsetPeer: user?.id.valueOf(),
                limit: 100
            })
        )) as Api.messages.Dialogs;

        const dialogs = result.dialogs
            .filter((dialog) => dialog.peer instanceof Api.PeerUser || dialog.peer instanceof Api.PeerChat)
            .map((dialog) => {
                if (dialog.peer instanceof Api.PeerUser) {
                    const peer = dialog.peer as Api.PeerUser;

                    return result.users.find((findUser) => findUser.id.valueOf() === peer.userId.valueOf()) as Api.User;
                }

                const peer = dialog.peer as Api.PeerChat;

                return result.chats.find((findChat) => findChat.id.valueOf() === peer.chatId.valueOf()) as Api.Chat;
            });

        console.log('dialogs', dialogs);

        setDialogsList(dialogs);
        setProgress(null);
    }

    async function getOptions(owner: Api.User) {
        console.log('owner', owner);

        // TODO logic for choice animate and add text

        const lines = HeartAnimation().split('\n\n');

        console.log({lines});

        // const sent = await CallAPI(
        //     new Api.messages.SendMessage({
        //         peer: owner.id.valueOf(),
        //         message: 'test'
        //     })
        // );

        // let newMessageId = 0;
        //
        // if (sent instanceof Api.Updates) {
        //     newMessageId = (
        //         sent.updates.find((update) => update instanceof Api.UpdateMessageID) as Api.UpdateMessageID
        //     ).id.valueOf();
        // }
        //
        // if (sent instanceof Api.UpdateShortSentMessage) {
        //     newMessageId = sent.id.valueOf();
        // }
        //
        // console.log({newMessageId});

        // const result = await CallAPI(
        //     new Api.messages.GetMessagesViews({
        //         peer: owner.id.valueOf(),
        //         id: [811380, 811377]
        //     })
        // );
        // console.log(result); // prints the result

        // if (!newMessageId) {
        //     return;
        // }
        //
        // console.log({newMessageId});
        //
        // lines.push('Ты лалка!');
        //
        // for (const line of lines) {
        //     const result = await window.TelegramClient.invoke(
        //         new Api.messages.EditMessage({
        //             peer: owner.id.valueOf(),
        //             id: newMessageId,
        //             message: line
        //         })
        //     );
        //     console.log(result); // prints the result
        //
        //     await sleep(100);
        // }
    }

    if (needHideContent()) return null;

    if (dialogsList.length) {
        return (
            <>
                {dialogsList.map((dialog, key) => (
                    <OwnerRow key={key} owner={dialog} callback={() => getOptions(dialog)} />
                ))}
            </>
        );
    }

    return null;
};

export default AnimatedMessages;
