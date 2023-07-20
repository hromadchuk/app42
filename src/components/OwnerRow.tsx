import { Center, Group, Text } from '@mantine/core';
import React from 'react';
import { Api } from 'telegram';
import { IconCheck } from '@tabler/icons-react';
import { OwnerAvatar } from './OwnerAvatar.tsx';

interface IOwnerAvatar {
    owner: null | Api.TypeUser | Api.TypeChat;
    description?: string;
}

export function OwnerRow({ owner, description }: IOwnerAvatar) {
    const name: string[] = [];

    if (owner?.className === 'User') {
        if (owner.firstName) {
            name.push(owner.firstName);
        }

        if (owner.lastName) {
            name.push(owner.lastName);
        }
    } else if (owner?.className === 'Chat' || owner?.className === 'Channel') {
        if (owner.title) {
            name.push(owner.title);
        }
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

    return (
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
        </Group>
    );
}
