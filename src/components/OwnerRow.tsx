import { Center, Group, Text, UnstyledButton } from '@mantine/core';
import React from 'react';
import { Api } from 'telegram';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { OwnerAvatar } from './OwnerAvatar.tsx';

interface IOwnerAvatar {
    owner: null | Api.TypeUser | Api.TypeChat;
    description?: string;
    withoutLink?: boolean;
    callback?: () => void;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component?: 'a' | 'button';
}

export function OwnerRow({ owner, description, withoutLink, callback }: IOwnerAvatar) {
    const name: string[] = [];
    const linkProps: ILinkProps = {};
    const isUser = owner?.className === 'User';
    const isChat = owner?.className === 'Chat';
    const isChannel = owner?.className === 'Channel';

    if (!withoutLink) {
        if (callback) {
            linkProps.onClick = () => callback();
            linkProps.component = 'button';
        } else if ((isUser || isChannel) && (owner.username || owner.usernames)) {
            const username = (owner.usernames ? owner.usernames[0].username : owner.username) as string;

            linkProps.href = `https://t.me/${username}`;
        } else if (owner?.id && (isChannel || isChat)) {
            linkProps.href = `https://t.me/c/${owner.id}/999999999`;
        }

        if (linkProps.href) {
            linkProps.target = '_blank';
            linkProps.component = 'a';
        }
    }

    if (isUser) {
        if (owner.firstName) {
            name.push(owner.firstName);
        }

        if (owner.lastName) {
            name.push(owner.lastName);
        }
    } else if (isChat || isChannel) {
        if (owner.title) {
            name.push(owner.title);
        }
    }

    if (!name.length) {
        name.push('Unknown name');
    }

    function getVerification(): null | React.JSX.Element {
        if ((owner instanceof Api.User || owner instanceof Api.Channel) && owner.verified) {
            return (
                <Center inline ml={5}>
                    <IconCheck size={14} color="#1c93e3" />
                </Center>
            );
        }

        return null;
    }

    const Row = (
        <Group spacing="sm" py={3}>
            <OwnerAvatar owner={owner} />

            <div>
                <Text lineClamp={1} span fz="sm" fw={500}>
                    {name.join(' ')}
                    {getVerification()}
                </Text>
                <Text c="dimmed" fz="xs">
                    {description}
                </Text>
            </div>

            {linkProps.component && <IconChevronRight size="0.9rem" stroke={1.5} />}
        </Group>
    );

    return !linkProps.component ? Row : <UnstyledButton {...linkProps}>{Row}</UnstyledButton>;
}
