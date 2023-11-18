import { Container, Flex, Group, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { classNames } from '../lib/helpers.ts';

// @ts-ignore
import classes from '../styles/OwnerRow.module.css';
import { TCorrectMessage } from '../lib/methods/messages.ts';
import { InfoRow } from './InfoRow.tsx';
import { Api } from 'telegram';
import PeerChannel = Api.PeerChannel;
import { RecordPhoto } from './RecordPhoto.tsx';

interface IRecordRow {
    record: TCorrectMessage;
    description?: string;
    callback?: () => void;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component: 'a';
}

export function RecordRow({ record, description, callback }: IRecordRow) {
    const linkProps: ILinkProps = {
        component: 'a'
    };

    if (callback) {
        linkProps.onClick = () => callback();
    } else if (record.peerId instanceof PeerChannel && record.peerId?.channelId.valueOf()) {
        linkProps.href = `https://t.me/c/${record.peerId.channelId.valueOf()}/${record.id}`;
        linkProps.target = '_blank';
    }

    const Row = (
        <Flex
            gap="md"
            p={5}
            justify="flex-start"
            align="center"
            direction="row"
            wrap="nowrap"
            className={classNames({ [classes.row]: 'a' })}
        >
            <Group wrap="nowrap">
                <RecordPhoto photo={record.photo} />
                <InfoRow title={record.message || ''} titleLineClamp={2} description={description} />
            </Group>

            <Container p={0} mr={0}>
                <IconChevronRight size="0.9rem" stroke={1.5} />
            </Container>
        </Flex>
    );

    return (
        <UnstyledButton {...linkProps}>
            <Container p={0}>{Row}</Container>
        </UnstyledButton>
    );
}
