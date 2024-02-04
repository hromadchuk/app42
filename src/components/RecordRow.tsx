import { Container, Flex, Group, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Api } from 'telegram';
import { classNames } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { TCorrectMessage } from '../lib/methods/messages.ts';
import { InfoRow } from './InfoRow.tsx';
import { RecordPhoto } from './RecordPhoto.tsx';

import classes from '../styles/OwnerRow.module.css';

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
    } else if (record.peerId instanceof Api.PeerChannel && record.peerId?.channelId.valueOf()) {
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
                <InfoRow
                    title={record.message || t('record_row.record')}
                    titleLineClamp={2}
                    description={description}
                />
            </Group>

            <Container p={0} mr={0}>
                <IconChevronRight size={14} stroke={1.5} />
            </Container>
        </Flex>
    );

    return (
        <UnstyledButton {...linkProps}>
            <Container p={0}>{Row}</Container>
        </UnstyledButton>
    );
}
