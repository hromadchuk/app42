import { createElement, CSSProperties, JSX } from 'react';
import { Center, Checkbox, Container, Flex, Group, Text, UnstyledButton } from '@mantine/core';
import { Api } from 'telegram';
import { IconCheck, IconChevronRight, TablerIconsProps } from '@tabler/icons-react';
import { classNames, TOwnerInfo } from '../lib/helpers.ts';
import { OwnerAvatar } from './OwnerAvatar.tsx';

import classes from '../styles/OwnerRow.module.css';

interface IOwnerRow {
    owner: TOwnerInfo;
    description?: string;
    rightIcon?: (props: TablerIconsProps) => JSX.Element;
    withoutLink?: boolean;
    disabled?: boolean;
    callback?: () => void;
    ml?: string | number;
    mr?: string | number;
    styles?: object;
    checked?: boolean;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component?: 'a' | 'button';
}

export function OwnerRow({
    owner,
    description,
    rightIcon,
    withoutLink,
    callback,
    disabled,
    ml,
    mr,
    styles,
    checked
}: IOwnerRow) {
    const name: string[] = [];
    const linkProps: ILinkProps = {};
    const isUser = owner instanceof Api.User;
    const isChat = owner instanceof Api.Chat;
    const isChannel = owner instanceof Api.Channel;
    const isCheckbox = checked !== undefined;

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

    const style: CSSProperties = {};

    if (disabled) {
        style.opacity = 0.5;
    }

    if (isCheckbox && !checked) {
        style.opacity = 0.5;
        style.filter = 'grayscale(1)';
    }

    const Row = (
        <Flex
            gap="md"
            p={5}
            justify="flex-start"
            align="center"
            direction="row"
            wrap="nowrap"
            style={style}
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
                {isCheckbox && <Checkbox checked={checked} readOnly />}
                {linkProps.component &&
                    !isCheckbox &&
                    createElement(rightIcon || IconChevronRight, { size: 14, stroke: 1.5 })}
            </Container>
        </Flex>
    );

    return (
        <Container p={0} ml={ml ?? 'auto'} mr={mr ?? 'auto'} styles={styles ?? {}}>
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