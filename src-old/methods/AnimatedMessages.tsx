import { useDisclosure } from '@mantine/hooks';
import { JSX, useContext, useEffect, useState } from 'react';
import { Badge, Button, Card, Group, Image, Input, Modal, Notification, Space, Text, TextInput } from '@mantine/core';
import {
    IconHeart,
    IconMail,
    IconRocket,
    IconTextWrapDisabled,
    IconTicTac,
    TablerIconsProps
} from '@tabler/icons-react';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { Api } from 'telegram';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { CallAPI, getTextTime, notifyError, sleep } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import classes from '../styles/AnimatedMessages.module.css';

import HeartAnimation from '../assets/animated_messages/heart.tsx';
import SpaceInvadersAnimation from '../assets/animated_messages/space-invaders.tsx';
import TicTacToeAnimation from '../assets/animated_messages/tic-tac-toe.tsx';
import HeartAnimationGif from '../assets/animated_messages/examples/heart.gif';
import SpaceInvadersGif from '../assets/animated_messages/examples/space-invaders.gif';
import TicTacToeGif from '../assets/animated_messages/examples/tic-tac-toe.gif';
import emojiText from '../assets/animated_messages/emoji-text.ts';

interface IOption {
    id: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    withEndText?: boolean;
    description?: string;
    requireText?: boolean;
    errorText?: string;
    gif?: String;
    title: string;
    frames: string[];
}

const FRAME_TIME = 100;
export const MAX_FRAMES_COUNT = 50;

const stateReadMessages = new Map<number, number>();

export default function AnimatedMessages() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);
    const [opened, { open, close }] = useDisclosure(false);

    const [selectedOwner, setSelectedOwner] = useState<Api.User | null>(null);
    const [textToAnimate, setTextToAnimate] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<IOption | null>(null);
    const [lastMessage, setLastMessage] = useState<string>('');

    const options: IOption[] = [
        {
            id: 'heart',
            icon: IconHeart,
            gif: HeartAnimationGif,
            withEndText: true,
            title: mt('titles.heart'),
            frames: HeartAnimation().split('\n\n')
        },
        {
            id: 'space_invaders',
            icon: IconRocket,
            gif: SpaceInvadersGif,
            withEndText: true,
            title: mt('titles.space_invaders'),
            frames: SpaceInvadersAnimation().split('\n\n')
        },
        {
            id: 'tic_tac_toe',
            icon: IconTicTac,
            gif: TicTacToeGif,
            withEndText: false,
            title: mt('titles.tic_tac_toe'),
            frames: TicTacToeAnimation(mt)
        },
        {
            id: 'emoji-text',
            icon: IconTextWrapDisabled,
            withEndText: false,
            requireText: true,
            description: mt('animated_text.description'),
            errorText: mt('animated_text.incorrect'),
            title: mt('titles.emoji_text'),
            frames: emojiText(textToAnimate || '')
        }
    ];

    useEffect(() => {
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

    useEffect(() => {
        if (selectedOption) {
            setSelectedOption(options.find((option) => option.id === selectedOption.id) as IOption);
        }
    }, [textToAnimate]);

    async function sendAnimation() {
        const owner = selectedOwner as Api.User;
        const ownerId = owner.id.valueOf();
        const lines = selectedOption?.frames.slice(0) as string[];
        const firstLine = lines.shift() as string;

        if (lines.length === 0) {
            notifyError({ message: selectedOption?.errorText || mt('error') });
            return;
        }

        setProgress({ text: mt('sending_message'), warningText: mt('loading_warning') });

        const messageId = await sendMessage(ownerId, firstLine);

        if (!messageId) {
            setFinishBlock({
                text: mt('sending_message_error'),
                state: 'error'
            });
            return;
        }

        setProgress({ text: mt('read_wait'), warningText: mt('loading_warning') });

        await waitReadMessage(ownerId, messageId);

        if (lastMessage) {
            lines.push(lastMessage);
        }

        setProgress({
            text: mt('loading_animation'),
            total: lines.length,
            warningText: mt('loading_warning')
        });

        for (const line of lines) {
            await CallAPI(
                new Api.messages.EditMessage({
                    peer: ownerId,
                    id: messageId,
                    message: line
                })
            );

            setProgress({ addCount: 1 });

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

    function calculateFramesRenderTime(option: IOption): number {
        return Math.ceil(option.frames.length / (1000 / FRAME_TIME));
    }

    function OptionRow(option: IOption, key: number) {
        const seconds = calculateFramesRenderTime(option);

        return (
            <Card mb={5} withBorder radius="md" key={key} className={classes.card} onClick={() => showModal(option)}>
                <Group>
                    <div>
                        <Text fw={500}>{option.title}</Text>
                        {option.withEndText && (
                            <Text fz="xs" c="dimmed">
                                {mt('has_message_after_animation')}
                            </Text>
                        )}
                        {option.requireText && (
                            <Text fz="xs" c="dimmed">
                                {mt('animated_text.require')}
                            </Text>
                        )}
                    </div>
                    {seconds && <Badge size="xs">~{getTextTime(seconds)}</Badge>}
                </Group>
            </Card>
        );
    }

    if (needHideContent()) return null;

    if (selectedOwner) {
        const framesRenderTime = selectedOption ? calculateFramesRenderTime(selectedOption) : 0;

        return (
            <>
                <Modal opened={opened} onClose={close} title={selectedOption?.title}>
                    {framesRenderTime > 0 && <Badge size="xs">~{getTextTime(framesRenderTime)}</Badge>}

                    {selectedOption?.gif && (
                        <Image maw={240} mx="auto" mb="xs" radius="md" src={selectedOption?.gif} alt="Random image" />
                    )}
                    {selectedOption?.withEndText && (
                        <Input
                            leftSection={<IconMail size={16} />}
                            placeholder={mt('message_after_animation')}
                            onChange={(event) => setLastMessage(event.target.value)}
                        />
                    )}

                    {selectedOption?.requireText && (
                        <TextInput
                            label={selectedOption.description || ''}
                            leftSection={<IconMail size="1rem" />}
                            placeholder={mt('animated_text.text')}
                            onChange={(event) => setTextToAnimate(event.target.value)}
                        />
                    )}

                    <Button
                        fullWidth
                        variant="outline"
                        disabled={selectedOption?.requireText && !textToAnimate && framesRenderTime <= 0}
                        mt="xs"
                        onClick={sendAnimation}
                    >
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

    return (
        <>
            <Notification withCloseButton={false} mb="xs" color="gray">
                {mt('message_recipient')}
            </Notification>

            <SelectDialog
                allowTypes={[EOwnerType.user]}
                selfIgnore={true}
                onOwnerSelect={(owner) => {
                    setSelectedOwner(owner as Api.User);
                }}
            />
        </>
    );
}