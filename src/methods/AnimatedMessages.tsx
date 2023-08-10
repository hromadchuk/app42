import { useDisclosure } from '@mantine/hooks';
import { JSX, useContext, useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    createStyles,
    Group,
    Image,
    Input,
    Modal,
    Notification,
    Space,
    Text
} from '@mantine/core';
import { IconHeart, IconMail, TablerIconsProps } from '@tabler/icons-react';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { Api } from 'telegram';
import { CallAPI, getTextTime, sleep } from '../lib/helpers.tsx';

import { AppContext } from '../components/AppContext.tsx';
import { MethodContext } from '../components/MethodContext.tsx';

import HeartAnimation from '../assets/animated_messages/heart.tsx';
// @ts-ignore
import HeartAnimationGif from '../assets/animated_messages/examples/heart.gif';

interface IOption {
    id: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    withEndText?: boolean;
    title: string;
    frames: string[];
}

const FRAME_TIME = 100;

const useStyles = createStyles((theme) => ({
    card: {
        cursor: 'pointer',

        '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]
        }
    }
}));

const stateReadMessages = new Map<number, number>();

export const AnimatedMessages = () => {
    const { user } = useContext(AppContext);
    const { mt, needHideContent, setProgress, setFinishBlock, getProgress } = useContext(MethodContext);
    const { classes } = useStyles();
    const [opened, { open, close }] = useDisclosure(false);

    const [dialogsList, setDialogsList] = useState<Api.User[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<Api.User | null>(null);
    const [selectedOption, setSelectedOption] = useState<IOption | null>(null);
    const [lastMessage, setLastMessage] = useState<string>('');

    const options: IOption[] = [
        {
            id: 'heart',
            icon: IconHeart,
            withEndText: true,
            title: mt('titles.heart'),
            frames: HeartAnimation().split('\n\n')
        }
    ];

    useEffect(() => {
        getLastDialogs();

        window.listenEvents.UpdateReadHistoryOutbox = (event: object) => {
            const thEvent = event as Api.UpdateReadHistoryOutbox;
            const peer = thEvent.peer as Api.PeerUser;
            const userId = peer.userId.valueOf();

            stateReadMessages.set(userId, thEvent.maxId);
        };

        return () => {
            delete window.listenEvents.UpdateReadHistoryOutbox;
        };
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
            .filter((dialog) => {
                if (!(dialog.peer instanceof Api.PeerUser)) {
                    return false;
                }

                return dialog.peer.userId.valueOf() !== user?.id.valueOf();
            })
            .map((dialog) => {
                const peer = dialog.peer as Api.PeerUser;

                return result.users.find((findUser) => findUser.id.valueOf() === peer.userId.valueOf()) as Api.User;
            });

        setDialogsList(dialogs);
        setProgress(null);
    }

    async function sendAnimation() {
        setProgress({ text: mt('sending_message') });

        const owner = selectedOwner as Api.User;
        const ownerId = owner.id.valueOf();
        const lines = selectedOption?.frames.slice(0) as string[];
        const firstLine = lines.shift() as string;

        const messageId = await sendMessage(ownerId, firstLine);

        if (!messageId) {
            setFinishBlock({
                text: mt('sending_message_error'),
                state: 'error'
            });
            return;
        }

        setProgress({ text: mt('read_wait') });

        await waitReadMessage(ownerId, messageId);

        if (lastMessage) {
            lines.push(lastMessage);
        }

        setProgress({ text: mt('loading_animation'), total: lines.length });

        for (const line of lines) {
            await CallAPI(
                new Api.messages.EditMessage({
                    peer: ownerId,
                    id: messageId,
                    message: line
                })
            );

            const currentProgress = getProgress();
            setProgress({ ...currentProgress, count: (currentProgress.count || 0) + 1 });

            await sleep(FRAME_TIME);
        }

        setFinishBlock({});
    }

    async function sendMessage(ownerId: number, message: string): Promise<number> {
        let newMessageId = 0;

        const sent = await CallAPI(
            new Api.messages.SendMessage({
                peer: ownerId,
                message
            })
        );

        if (sent instanceof Api.Updates) {
            newMessageId = (
                sent.updates.find((update) => update instanceof Api.UpdateMessageID) as Api.UpdateMessageID
            ).id.valueOf();
        }

        if (sent instanceof Api.UpdateShortSentMessage) {
            newMessageId = sent.id.valueOf();
        }

        return newMessageId;
    }

    async function waitReadMessage(ownerId: number, messageId: number) {
        let work = true;

        while (work) {
            const maxId = stateReadMessages.get(ownerId) || 0;

            if (maxId >= messageId) {
                work = false;
            }

            await sleep(200);
        }
    }

    function showModal(option: IOption) {
        setSelectedOption(option);
        open();
    }

    function OptionRow(option: IOption, key: number) {
        const seconds = Math.round(option.frames.length / (1000 / FRAME_TIME));

        return (
            <Card withBorder radius="md" key={key} className={classes.card} onClick={() => showModal(option)}>
                <Group position="apart">
                    <div>
                        <Text fw={500}>{option.title}</Text>
                        {option.withEndText && (
                            <Text fz="xs" c="dimmed">
                                {mt('has_message_after_animation')}
                            </Text>
                        )}
                    </div>
                    <Badge size="xs">~{getTextTime(seconds)}</Badge>
                </Group>
            </Card>
        );
    }

    if (needHideContent()) return null;

    if (selectedOwner) {
        return (
            <>
                <Modal opened={opened} onClose={close} title={selectedOption?.title}>
                    <Image maw={240} mx="auto" mb="xs" radius="md" src={HeartAnimationGif} alt="Random image" />

                    {selectedOption?.withEndText && (
                        <Input
                            icon={<IconMail size="1rem" />}
                            placeholder={mt('message_after_animation')}
                            onChange={(event) => setLastMessage(event.target.value)}
                        />
                    )}

                    <Button fullWidth variant="outline" mt="xs" onClick={sendAnimation}>
                        {mt('send_button')}
                    </Button>
                </Modal>

                <Notification withCloseButton={false} mb="xs" color="gray">
                    {mt('few_animation')}
                </Notification>

                <OwnerRow owner={selectedOwner} withoutLink={true} />
                <Space h={20} />
                {options.map(OptionRow)}
            </>
        );
    }

    if (dialogsList.length) {
        return (
            <>
                <Notification withCloseButton={false} mb="xs" color="gray">
                    {mt('message_recipient')}
                </Notification>
                {dialogsList.map((dialog, key) => (
                    <OwnerRow key={key} owner={dialog} callback={() => setSelectedOwner(dialog)} />
                ))}
            </>
        );
    }

    return null;
};

export default AnimatedMessages;
