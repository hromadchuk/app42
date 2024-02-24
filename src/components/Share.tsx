import { Button, Flex, Image, StyleProp, Text } from '@mantine/core';
import { Api } from 'telegram';
import { IRegDateImagesOptions, RegDateImagesGenerator } from '../images_generator/RegDateImagesGenerator.ts';
import { modals } from '@mantine/modals';
import { TOwnerType } from './SelectOwner.tsx';
import React, { useState } from 'react';
import { IImagesGeneratorOptions, IImagesGeneratorResponse } from '../images_generator/BaseImagesGenerator.ts';
import { t } from '../lib/lang.ts';
import { CantGetDataError } from '../errors/Share/CantGetDataError.ts';
import { CantGetImageError } from '../errors/Share/CantGetImageError.ts';
import { SharingGenerator } from '../sharing/SharingGenerator.ts';
import { notifySuccess } from '../lib/helpers.ts';

export enum ShareType {
    REG_DATE = 'reg_date'
}

export enum ActionType {
    STORY = 'story',
    POST = 'post'
}

interface IShareOptions {
    owner: TOwnerType | null;
    type: ShareType;
    data: IImagesGeneratorOptions;
}

interface IModalShareOptions extends IShareOptions {
    action: ActionType;
}

interface IShareButtonOptions extends IModalShareOptions {
    children: string;
}

interface IActionData {
    text: string;
    publishButtonText: string;
    callback: (image: string, owner: TOwnerType) => Promise<Api.AnyRequest['__response']>;
    image: {
        height: StyleProp<React.CSSProperties['height']>;
        width: StyleProp<React.CSSProperties['width']>;
        url: string;
    };
}

export async function openModal(options: IModalShareOptions) {
    const owner = options.owner;

    if (!checkIsShareAvailable(owner, options.action)) {
        return;
    }

    let actionData = {} as IActionData;
    let image = {} as IImagesGeneratorResponse;
    try {
        image = await getImage(options);
        actionData = getActionData(image, options.action);
    } catch (e) {
        console.error(e);
        return;
    }

    modals.openConfirmModal({
        title: getTitle(owner as Api.Channel | Api.User),
        centered: true,
        children: (
            <Flex direction="column" align="center" gap={5}>
                <Text size="sm">{actionData.text}</Text>
                <Image
                    radius="md"
                    src={actionData.image.url}
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
                .callback(actionData.image.url, owner as Api.Channel | Api.User)
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

function getActionData(image: IImagesGeneratorResponse, action: ActionType): IActionData {
    switch (action) {
        case ActionType.STORY:
            if (!image.storyImage) {
                throw new CantGetImageError();
            }

            return {
                text: t('share.stories.publish_header'),
                image: {
                    height: 350,
                    width: '70%',
                    url: image.storyImage
                },
                publishButtonText: t('share.stories.publish_button'),
                callback: (base64: string, owner: TOwnerType) => {
                    return SharingGenerator.sendStory(base64, owner);
                }
            };
        case ActionType.POST:
            if (!image.messageImage) {
                throw new CantGetImageError();
            }

            return {
                text: t('share.posts.publish_header'),
                image: {
                    height: 'auto',
                    width: '100%',
                    url: image.messageImage
                },
                publishButtonText: t('share.posts.publish_button'),
                callback: (base64: string, owner: TOwnerType) => {
                    return SharingGenerator.sendMessage(base64, owner);
                }
            };
        default:
            throw new CantGetDataError();
    }
}

function getTitle(owner: Api.User | Api.Channel) {
    if (owner instanceof Api.User) {
        return `${owner.firstName} ${owner.lastName}`;
    }

    return owner.title;
}

async function getImage(options: IShareOptions): Promise<IImagesGeneratorResponse> {
    switch (options.type) {
        case ShareType.REG_DATE:
            if (isRegDateOptions(options.data)) {
                const imagesGenerator = new RegDateImagesGenerator();

                return await imagesGenerator.generate(options.data);
            }

            throw new CantGetDataError('Invalid data for REG_DATE type');
        default:
            throw new CantGetDataError();
    }
}

function isRegDateOptions(data: IImagesGeneratorOptions): data is IRegDateImagesOptions {
    if (typeof data === 'object' && data !== null && typeof data.data === 'object' && data.data !== null) {
        return (
            'bottomDateText' in data.data &&
            'title' in data.data &&
            'subTitle' in data.data &&
            'description' in data.data &&
            'bottomDateText' in data.data &&
            'avatar' in data.data
        );
    }
    return false;
}

export function ShareButton(options: IShareButtonOptions) {
    const [isLoading, setLoading] = useState(false);

    if (!checkIsShareAvailable(options.owner, options.action)) {
        return <></>;
    }

    return (
        <>
            <Button
                fullWidth
                onClick={async () => {
                    setLoading(true);
                    await openModal(options);
                    setLoading(false);
                }}
                disabled={isLoading}
                loading={isLoading}
            >
                {options.children}
            </Button>
        </>
    );
}

export function ShareButtons(options: IShareOptions) {
    return (
        <Flex gap={5}>
            <ShareButton {...{ action: ActionType.STORY, ...options }}>{t('share.stories.button')}</ShareButton>

            <ShareButton {...{ action: ActionType.POST, ...options }}>{t('share.posts.button')}</ShareButton>
        </Flex>
    );
}

function checkIsShareAvailable(owner: TOwnerType | null, action: ActionType): boolean {
    if (!owner || owner instanceof Api.User) {
        return false;
    }

    switch (action) {
        case ActionType.STORY:
            return !(owner instanceof Api.Chat) && Number(owner.level) > 0 && owner.adminRights?.postStories === true;
        case ActionType.POST:
            return owner.adminRights?.postMessages === true || owner.creator === true;
        default:
            return false;
    }
}
