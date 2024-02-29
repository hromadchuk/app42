import React, { useEffect, useState } from 'react';
import { Button, Flex, Image, StyleProp, Text } from '@mantine/core';
import { Api } from 'telegram';
import { IRegDateImagesOptions, RegDateImagesGenerator } from '../images_generator/RegDateImagesGenerator.ts';
import { modals } from '@mantine/modals';
import { TOwnerType } from './SelectOwner.tsx';
import { IImagesGeneratorResponse } from '../images_generator/BaseImagesGenerator.ts';
import { t } from '../lib/lang.ts';
import { SharingGenerator } from '../sharing/SharingGenerator.ts';
import { notifySuccess } from '../lib/helpers.ts';

export enum ShareType {
    REG_DATE = 'reg_date'
}

export enum ActionType {
    STORY = 'story',
    POST = 'post'
}

interface IShareButtonsOptions {
    owner: TOwnerType;
    type: ShareType;
    data: IRegDateImagesOptions;
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

function getPostAccess(owner: TOwnerType) {
    const result = {
        canMakeMessages: false,
        canMakeStories: false
    };

    if (!owner || owner instanceof Api.User) {
        return result;
    }

    if (!(owner instanceof Api.Chat) && Number(owner.level) > 0 && owner.adminRights?.postStories === true) {
        result.canMakeStories = true;
    }

    if (owner.adminRights?.postMessages === true || owner.creator === true) {
        result.canMakeMessages = true;
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
                return SharingGenerator.sendStory(base64, owner);
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
                return SharingGenerator.sendMessage(base64, owner);
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
            return SharingGenerator.sendMessage(base64, owner);
        }
    };
}

function getTitle(owner: TOwnerType): string {
    if (owner instanceof Api.User) {
        return `${owner.firstName} ${owner.lastName}`;
    }

    return owner.title;
}

export function openModal(options: IModalShareOptions) {
    const actionData = getActionData(options.owner, options.action);

    modals.openConfirmModal({
        title: getTitle(options.owner),
        centered: true,
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
            </Flex>
        ),
        labels: {
            confirm: actionData.publishButtonText,
            cancel: t('share.close_modal')
        },
        onConfirm: () => {
            actionData
                .callback(options.image)
                .then(() => {
                    notifySuccess({ message: t('share.success') });
                })
                .catch((error) => {
                    console.error(error);
                });
            modals.closeAll();
        }
    });
}

function runGenerator(type: ShareType, data: IShareButtonsOptions['data']): Promise<IImagesGeneratorResponse> {
    if (type === ShareType.REG_DATE) {
        return new RegDateImagesGenerator().generate(data);
    }

    return Promise.resolve({});
}

export function ShareButtons(options: IShareButtonsOptions) {
    const [needHide, setHide] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [{ storyImage, messageImage }, setImages] = useState<IImagesGeneratorResponse>({});

    const { canMakeMessages, canMakeStories } = getPostAccess(options.owner);

    useEffect(() => {
        if (!canMakeMessages && !canMakeStories) {
            return;
        }

        runGenerator(options.type, { ...options.data, storyImage: canMakeStories, messageImage: canMakeMessages }).then(
            (images) => {
                if (!images.storyImage && !images.messageImage) {
                    setHide(true);
                } else {
                    setImages(images);
                    setLoading(false);
                }
            }
        );
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
        <Flex gap={5}>
            {canMakeStories && storyImage && ShareButton(t('share.stories.button'), ActionType.STORY, storyImage)}
            {canMakeMessages && messageImage && ShareButton(actionData.buttonText, ActionType.POST, messageImage)}
        </Flex>
    );
}
