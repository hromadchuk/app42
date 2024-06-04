import { CSSProperties, useEffect, useState } from 'react';
import { Blockquote, Button, Modal, Placeholder, SegmentedControl, Spinner } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { SegmentedControlItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/SegmentedControl/components/SegmentedControlItem/SegmentedControlItem';
import { Api } from 'telegram';
import { IImagesGeneratorResponse } from '../images_generator/BaseImagesGenerator.ts';
import { CallStatImagesGenerator, ICallStatImagesOptions } from '../images_generator/CallStatImagesGenerator.ts';
import {
    IMessagesStatImagesOptions,
    MessageStatImagesGenerator
} from '../images_generator/MessageStatImagesGenerator.ts';
import { IRegDateImagesOptions, RegDateImagesGenerator } from '../images_generator/RegDateImagesGenerator.ts';
import { CallAPI, dataUrlToFile, notifyError, notifySuccess, TOwnerType } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

const MESSAGE_TEXT = 'by @app42';

export enum ShareType {
    REG_DATE = 'reg_date',
    MESSAGE_STAT = 'message_stat',
    CALL_STAT = 'call_stat'
}

export enum ActionType {
    STORY = 'story',
    POST = 'post'
}

export interface IShareOptions {
    owner: TOwnerType;
    type: ShareType;
    data: IRegDateImagesOptions | IMessagesStatImagesOptions | ICallStatImagesOptions;
}

interface IActionData {
    text: string;
    buttonText: string;
    publishButtonText: string;
    callback: (image: string) => Promise<Api.AnyRequest['__response']>;
    image: {
        height: CSSProperties['height'];
        width: CSSProperties['width'];
    };
}

interface IAccountsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    modalData: IShareOptions | null;
}

function runGenerator(type: ShareType, data: IShareOptions['data']): Promise<IImagesGeneratorResponse> {
    if (type === ShareType.REG_DATE) {
        return new RegDateImagesGenerator().generate(data as IRegDateImagesOptions);
    }

    if (type === ShareType.MESSAGE_STAT) {
        return new MessageStatImagesGenerator().generate(data as IMessagesStatImagesOptions);
    }

    if (type === ShareType.CALL_STAT) {
        return new CallStatImagesGenerator().generate(data as ICallStatImagesOptions);
    }

    return Promise.resolve({});
}

async function uploadFile(base64: string) {
    const file = dataUrlToFile(base64, 'image.png');

    return await window.TelegramClient.uploadFile({
        file,
        workers: 3
    });
}

async function sendMessage(base64: string, owner: TOwnerType) {
    const upload = await uploadFile(base64);

    return CallAPI(
        new Api.messages.SendMedia({
            peer: owner.id,
            media: new Api.InputMediaUploadedPhoto({
                file: upload
            }),
            message: MESSAGE_TEXT
        })
    );
}

async function sendStory(base64: string, owner: TOwnerType) {
    const upload = await uploadFile(base64);

    return CallAPI(
        new Api.stories.SendStory({
            peer: owner.id,
            media: new Api.InputMediaUploadedPhoto({
                file: upload
            }),
            caption: MESSAGE_TEXT,
            privacyRules: [new Api.InputPrivacyValueAllowAll()]
        })
    );
}

function getActionData(owner: TOwnerType, action: ActionType): IActionData {
    if (action === ActionType.STORY) {
        return {
            text: t('share.stories.publish_header'),
            image: {
                height: 350,
                width: '70%'
            },
            buttonText: t('share.stories.button'),
            publishButtonText: t('share.stories.publish_button'),
            callback: (base64: string) => {
                return sendStory(base64, owner);
            }
        };
    }

    if (action === ActionType.POST && owner instanceof Api.Channel) {
        return {
            text: t('share.posts.publish_header'),
            image: {
                height: 'auto',
                width: '100%'
            },
            buttonText: t('share.posts.button'),
            publishButtonText: t('share.posts.publish_button'),
            callback: (base64: string) => {
                return sendMessage(base64, owner);
            }
        };
    }

    return {
        text: t('share.messages.publish_header'),
        image: {
            height: 'auto',
            width: '100%'
        },
        buttonText: t('share.messages.button'),
        publishButtonText: t('share.messages.publish_button'),
        callback: (base64: string) => {
            return sendMessage(base64, owner);
        }
    };
}

export async function canShare(owner: TOwnerType) {
    const result = {
        canPost: false,
        canPostMessages: false,
        canPostStories: false
    };

    try {
        const data = await CallAPI(
            new Api.stories.CanSendStory({
                peer: owner.id
            }),
            {
                hideErrorAlert: true
            }
        );

        if (data) {
            result.canPost = true;
            result.canPostStories = true;
        }
    } catch (error) {
        console.error(error);
    }

    if (!owner || owner instanceof Api.User) {
        return result;
    }

    if (owner.adminRights?.postMessages === true || owner.creator === true || !owner.defaultBannedRights?.sendPhotos) {
        result.canPost = true;
        result.canPostMessages = true;
    }

    return result;
}

export function ShareModal({ isOpen, onOpenChange, modalData }: IAccountsModalProps) {
    const [isLoading, setLoading] = useState(false);
    const [isButtonLoading, setButtonLoading] = useState(false);
    const [canMakeMessages, setCanMakeMessages] = useState(false);
    const [canMakeStories, setCanMakeStories] = useState(false);
    const [actionType, setActionType] = useState<ActionType>(ActionType.POST);
    const [{ storyImage, messageImage }, setImages] = useState<IImagesGeneratorResponse>({});

    useEffect(() => {
        if (!modalData) {
            return;
        }

        setLoading(true);
        setActionType(ActionType.POST);

        canShare(modalData.owner).then(({ canPostMessages, canPostStories }) => {
            if (canPostMessages || canPostStories) {
                setCanMakeMessages(canPostMessages);
                setCanMakeStories(canPostStories);

                runGenerator(modalData.type, {
                    ...modalData.data,
                    storyImage: canPostStories,
                    messageImage: canPostMessages
                }).then((images) => {
                    if (images.storyImage || images.messageImage) {
                        setImages(images);
                        setLoading(false);

                        if (!images.messageImage) {
                            setActionType(ActionType.STORY);
                        }
                    } else {
                        onOpenChange(false);
                    }
                });
            }
        });
    }, [modalData]);

    if (!isOpen || !modalData) {
        return null;
    }

    function SpinnerRow() {
        return (
            <Placeholder>
                <Spinner size="m" />
            </Placeholder>
        );
    }

    function ContentRow() {
        const actionData = getActionData((modalData as IShareOptions).owner, actionType);
        const showSelect = Boolean(canMakeMessages && canMakeStories && storyImage && messageImage);
        const image = actionType === ActionType.POST ? messageImage : storyImage;

        return (
            <div style={{ padding: 16 }}>
                {showSelect && (
                    <SegmentedControl style={{ marginBottom: 16 }}>
                        <SegmentedControlItem
                            selected={actionType === ActionType.POST}
                            onClick={() => {
                                setActionType(ActionType.POST);
                            }}
                        >
                            {t('share.tabs.post')}
                        </SegmentedControlItem>
                        <SegmentedControlItem
                            selected={actionType === ActionType.STORY}
                            onClick={() => {
                                setActionType(ActionType.STORY);
                            }}
                        >
                            {t('share.tabs.story')}
                        </SegmentedControlItem>
                    </SegmentedControl>
                )}

                <Blockquote>{actionData.text}</Blockquote>

                <div style={{ padding: 10 }}>
                    <img
                        alt={actionType}
                        src={image}
                        style={{
                            display: 'block',
                            height: actionData.image.height,
                            objectFit: 'contain',
                            width: actionData.image.width,
                            borderRadius: 10,
                            margin: '0 auto'
                        }}
                    />
                </div>

                <Button
                    mode="filled"
                    size="m"
                    stretched
                    loading={isButtonLoading}
                    disabled={isButtonLoading}
                    onClick={() => {
                        setButtonLoading(true);

                        actionData
                            .callback(image as string)
                            .then(() => {
                                notifySuccess({ title: t('common.done'), message: t('share.success') });
                                setButtonLoading(false);
                                onOpenChange(false);
                            })
                            .catch((error) => {
                                console.error(error);

                                notifyError({
                                    title: t('share.cant_share.title'),
                                    message: String(error)
                                });
                                setButtonLoading(false);
                                onOpenChange(false);
                            });
                    }}
                >
                    {actionData.publishButtonText}
                </Button>
            </div>
        );
    }

    return (
        <Modal header={<ModalHeader />} open={isOpen} onOpenChange={onOpenChange}>
            {isLoading ? SpinnerRow() : ContentRow()}
        </Modal>
    );
}
