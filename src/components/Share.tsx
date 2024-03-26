import React, { useEffect, useState } from 'react';
import { Button, Flex, Image, StyleProp, Text } from '@mantine/core';
import { Api } from 'telegram';
import { CallStatImagesGenerator, ICallStatImagesOptions } from '../images_generator/CallStatImagesGenerator.ts';
import {
    IMessagesStatImagesOptions,
    MessageStatImagesGenerator
} from '../images_generator/MessageStatImagesGenerator.ts';
import { IRegDateImagesOptions, RegDateImagesGenerator } from '../images_generator/RegDateImagesGenerator.ts';
import { modals } from '@mantine/modals';
import { IImagesGeneratorResponse } from '../images_generator/BaseImagesGenerator.ts';
import { t } from '../lib/lang.ts';
import { CallAPI, dataUrlToFile, notifySuccess, TOwnerType } from '../lib/helpers.ts';

const MESSAGE_TEXT = 'by @kit42_app';

export enum ShareType {
    REG_DATE = 'reg_date',
    MESSAGE_STAT = 'message_stat',
    CALL_STAT = 'call_stat'
}

export enum ActionType {
    STORY = 'story',
    POST = 'post'
}

interface IShareButtonsOptions {
    owner: TOwnerType;
    type: ShareType;
    data: IRegDateImagesOptions | IMessagesStatImagesOptions | ICallStatImagesOptions;
}

interface IModalShareOptions extends IShareButtonsOptions {
    action: ActionType;
    image: string;
}

interface IActionData {
    text: string;
    buttonText: string;
    publishButtonText: string;
    callback: (image: string) => Promise<Api.AnyRequest['__response']>;
    image: {
        height: StyleProp<React.CSSProperties['height']>;
        width: StyleProp<React.CSSProperties['width']>;
    };
}

async function getPostAccess(owner: TOwnerType) {
    const result = {
        canPostMessages: false,
        canPostStories: false
    };

    const data = await CallAPI(
        new Api.stories.CanSendStory({
            peer: owner.id
        }),
        {
            hideErrorAlert: true
        }
    );

    if (data) {
        result.canPostStories = true;
    }

    if (!owner || owner instanceof Api.User) {
        return result;
    }

    if (owner.adminRights?.postMessages === true || owner.creator === true || !owner.defaultBannedRights?.sendPhotos) {
        result.canPostMessages = true;
    }

    return result;
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

function getTitle(owner: TOwnerType): string {
    if (owner instanceof Api.User) {
        return `${owner.firstName || ''} ${owner.lastName || ''}`;
    }

    return owner.title;
}

export function openModal(options: IModalShareOptions) {
    const actionData = getActionData(options.owner, options.action);

    modals.open({
        title: getTitle(options.owner),
        children: (
            <Flex direction="column" align="center" gap={5}>
                <Text size="sm">{actionData.text}</Text>
                <Image
                    radius="md"
                    src={options.image}
                    h={actionData.image.height}
                    w={actionData.image.width}
                    fit="contain"
                />

                <Button
                    mt="xs"
                    fullWidth
                    onClick={() => {
                        actionData
                            .callback(options.image)
                            .then(() => {
                                notifySuccess({ message: t('share.success') });
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                        modals.closeAll();
                    }}
                >
                    {actionData.publishButtonText}
                </Button>
            </Flex>
        )
    });
}

function runGenerator(type: ShareType, data: IShareButtonsOptions['data']): Promise<IImagesGeneratorResponse> {
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

export function ShareButtons(options: IShareButtonsOptions) {
    const [needHide, setHide] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [canMakeMessages, setCanMakeMessages] = useState(false);
    const [canMakeStories, setCanMakeStories] = useState(false);
    const [{ storyImage, messageImage }, setImages] = useState<IImagesGeneratorResponse>({});

    useEffect(() => {
        getPostAccess(options.owner).then(({ canPostMessages, canPostStories }) => {
            if (canPostMessages || canPostStories) {
                setCanMakeMessages(canPostMessages);
                setCanMakeStories(canPostStories);

                runGenerator(options.type, {
                    ...options.data,
                    storyImage: canPostStories,
                    messageImage: canPostMessages
                }).then((images) => {
                    if (images.storyImage || images.messageImage) {
                        setImages(images);
                        setLoading(false);
                    } else {
                        setHide(true);
                    }
                });
            }
        });
    }, []);

    if ((!canMakeMessages && !canMakeStories) || needHide) {
        return null;
    }

    function ShareButton(lang: string, action: ActionType, image: string) {
        return (
            <Button
                fullWidth
                onClick={() => openModal({ ...options, action, image })}
                disabled={isLoading}
                loading={isLoading}
            >
                {lang}
            </Button>
        );
    }

    const actionData = getActionData(options.owner, ActionType.POST);

    return (
        <Flex gap={5} mt="xs" mb="xs">
            {canMakeStories && storyImage && ShareButton(t('share.stories.button'), ActionType.STORY, storyImage)}
            {canMakeMessages && messageImage && ShareButton(actionData.buttonText, ActionType.POST, messageImage)}
        </Flex>
    );
}
