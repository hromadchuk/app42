import { JSX } from 'react';
import { Center, Container, Flex, Group, Text, UnstyledButton } from '@mantine/core';
import { Api } from 'telegram';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { classNames } from '../lib/helpers.tsx';
import { OwnerAvatar } from './OwnerAvatar.tsx';

// @ts-ignore
import classes from '../styles/OwnerRow.module.css';

interface IOwnerRow {
    owner: null | Api.TypeUser | Api.TypeChat;
    description?: string;
    withoutLink?: boolean;
    disabled?: boolean;
    callback?: () => void;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component?: 'a' | 'button';
}

export function OwnerRow({ owner, description, withoutLink, callback, disabled }: IOwnerRow) {
    const name: string[] = [];
    const linkProps: ILinkProps = {};
    const isUser = owner instanceof Api.User;
    const isChat = owner instanceof Api.Chat;
    const isChannel = owner instanceof Api.Channel;

    if (!withoutLink && !disabled) {
        if (callback) {
            linkProps.onClick = () => callback();
            linkProps.component = 'a';
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

    function getBadge(): null | JSX.Element {
        if ((isUser || isChannel) && owner.verified) {
            return (
                <Center inline ml={5}>
                    <IconCheck size={14} color="#1c93e3" />
                </Center>
            );
        }

        return null;
    }

    const Row = (
        <Flex
            gap="md"
            p={5}
            justify="flex-start"
            align="center"
            direction="row"
            wrap="nowrap"
            opacity={disabled ? 0.5 : 1}
            className={classNames({ [classes.row]: linkProps.component })}
        >
            <OwnerAvatar owner={owner} />

            <div>
                <Group gap={0}>
                    <Text size="sm" inline>
                        {name.join(' ')}
                    </Text>
                    {getBadge()}
                </Group>
                <Text c="dimmed" fz="xs">
                    {description}
                </Text>
            </div>

            <Container p={0} mr={0}>
                {linkProps.component && <IconChevronRight size="0.9rem" stroke={1.5} />}
            </Container>
        </Flex>
    );

    return (
        <Container p={0}>
            {!linkProps.component ? (
                Row
            ) : (
                <UnstyledButton {...linkProps} disabled={true}>
                    {Row}
                </UnstyledButton>
            )}
        </Container>
    );
}
