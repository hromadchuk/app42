import { ForwardRefExoticComponent, RefAttributes, useContext, useEffect, useState } from 'react';
import { Blockquote, Button, Cell, Input, Modal, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import {
    Icon,
    IconClock,
    IconHeart,
    IconProps,
    IconRocket,
    IconTextWrapDisabled,
    IconTicTac
} from '@tabler/icons-react';
import { Api } from 'telegram';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { CallAPI, classNames, getTextTime, notifyError, sleep } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

import HeartAnimation from '../assets/animated_messages/heart.tsx';
import SpaceInvadersAnimation from '../assets/animated_messages/space-invaders.tsx';
import TicTacToeAnimation from '../assets/animated_messages/tic-tac-toe.tsx';
import HeartAnimationGif from '../assets/animated_messages/examples/heart.gif';
import SpaceInvadersGif from '../assets/animated_messages/examples/space-invaders.gif';
import TicTacToeGif from '../assets/animated_messages/examples/tic-tac-toe.gif';
import emojiText from '../assets/animated_messages/emoji-text.ts';

interface IOption {
    id: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
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
    // const [opened, { open, close }] = useDisclosure(false);

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

    function calculateFramesRenderTime(option: IOption): number {
        return Math.ceil(option.frames.length / (1000 / FRAME_TIME));
    }

    function OptionRow(option: IOption, key: number) {
        const seconds = calculateFramesRenderTime(option);
        const description: string[] = [];

        if (seconds) {
            description.push(`~${getTextTime(seconds)}`);
        }

        if (option.withEndText) {
            description.push(mt('has_message_after_animation'));
        }

        if (option.requireText) {
            description.push(mt('animated_text.require'));
        }

        return (
            <Cell
                key={key}
                before={<option.icon size={28} stroke={1.2} />}
                multiline={true}
                description={description.map((text) => (
                    <div key={text}>{text}</div>
                ))}
                onClick={() => setSelectedOption(option)}
            >
                {option.title}
            </Cell>
        );
    }

    if (needHideContent()) return null;

    if (selectedOwner) {
        const framesRenderTime = selectedOption ? calculateFramesRenderTime(selectedOption) : 0;

        console.log('framesRenderTime', framesRenderTime);

        return (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                {options.map(OptionRow)}

                {selectedOption && (
                    <Modal
                        header={<ModalHeader />}
                        open={Boolean(selectedOption)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedOption(null);
                            }
                        }}
                    >
                        <Section className={commonClasses.hideHr}>
                            <div style={{ padding: 10 }}>
                                {framesRenderTime > 0 && (
                                    <Blockquote topRightIcon={<IconClock size={12} />}>
                                        ~{getTextTime(framesRenderTime)}
                                    </Blockquote>
                                )}

                                {selectedOption.gif && (
                                    <Placeholder>
                                        <img height={150} src={selectedOption.gif as string} alt="example" />
                                    </Placeholder>
                                )}

                                {selectedOption.withEndText && (
                                    <Input
                                        type="text"
                                        placeholder={mt('message_after_animation')}
                                        onChange={(event) => setLastMessage(event.target.value)}
                                    />
                                )}

                                {selectedOption.requireText && (
                                    <Input
                                        type="text"
                                        placeholder={mt('animated_text.text')}
                                        onChange={(event) => setTextToAnimate(event.target.value)}
                                    />
                                )}

                                <Button
                                    stretched
                                    size="l"
                                    disabled={selectedOption?.requireText && !textToAnimate && framesRenderTime <= 0}
                                    onClick={sendAnimation}
                                >
                                    {mt('send_button')}
                                </Button>
                            </div>
                        </Section>
                    </Modal>
                )}
            </Section>
        );
    }

    return (
        <>
            <Section className={commonClasses.sectionBox}>
                <Blockquote>{mt('message_recipient')}</Blockquote>
            </Section>

            <Section className={commonClasses.sectionBox}>
                <SelectDialog
                    allowTypes={[EOwnerType.user]}
                    selfIgnore={true}
                    onOwnerSelect={(owner) => {
                        setSelectedOwner(owner as Api.User);
                    }}
                />
            </Section>
        </>
    );
}
