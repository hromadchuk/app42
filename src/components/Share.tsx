import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect } from 'react';
import { Api } from 'telegram';
import { IRegDateImagesOptions } from '../images_generator/RegDateImagesGenerator.ts';

export enum ShareType {
    REG_DATE = 'reg_date'
}

interface IShareOptions {
    owner: Api.User | Api.Chat | Api.Channel | null;
    type: ShareType;
    data: IRegDateImagesOptions[];
}

export function openModal() {
    setTimeout(() => {
        window.listenMAEvents?.open_share_modal(undefined);
    }, 0);
}

export function ShareModal(options: IShareOptions) {
    const [opened, { open, close }] = useDisclosure(false);

    useEffect(() => {
        if (options.owner) {
            window.listenMAEvents.open_share_modal = open;
        } else {
            delete window.listenMAEvents.open_share_modal;
        }
    }, [options.owner]);

    function getTitle() {
        if (!options.owner) {
            return '';
        }

        if (options.owner instanceof Api.User) {
            return `${options.owner.firstName} ${options.owner.lastName}`;
        }

        return options.owner.title;
    }

    return (
        <Modal opened={opened} onClose={close} title={getTitle()}>
            Modal with choose images and types for sharing
        </Modal>
    );
}

export function ShareButton(options: IShareOptions) {
    // TODO: implement игеещт
    return <>Share</>;
}
