import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Center,
    Container,
    CopyButton,
    Divider,
    Flex,
    Group,
    Input,
    Stack,
    Text
} from '@mantine/core';
import { IconCheck, IconCopy, IconShieldLock } from '@tabler/icons-react';
import { useCloudStorage } from '@tma.js/sdk-react';
import dayjs from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { Constants } from '../constants.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { CallAPI, isDev, Server } from '../lib/helpers.ts';

interface IServerData {
    date: number;
    names: {
        name: string;
        count: number;
    }[];
}

export default function ContactsNames() {
    const { mt, needHideContent, setProgress } = useContext(MethodContext);

    const storage = useCloudStorage();
    const navigate = useNavigate();
    const [needShowWarning, setShowWarning] = useState<boolean>(false);
    const [serverData, setServerData] = useState<IServerData | null>(null);

    useEffect(() => {
        setProgress({});

        storage.get(Constants.ALLOW_USE_CONTACTS_NAMES_KEY).then((allowUseMethod) => {
            if (allowUseMethod !== 'allow') {
                setShowWarning(true);
                setProgress(null);
            } else {
                getContactsNames();
            }
        });
    }, []);

    async function getContactsNames() {
        setProgress({});

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;
        const initValue: { [key: number]: string } = {};
        const syncList = result.users.reduce((list, user) => {
            if (user instanceof Api.User) {
                list[user.id.valueOf()] = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            }

            return list;
        }, initValue);

        const data = await Server<IServerData>('get-my-names', { list: syncList });

        setServerData(data);
        setProgress(null);
    }

    if (needHideContent()) return null;

    if (needShowWarning) {
        return (
            <Box p="lg">
                <Center>
                    <IconShieldLock size={72} />
                </Center>
                <Center mt="md" ta="center">
                    {mt('allow_description')}
                </Center>
                <Group grow mt="md">
                    <Button
                        variant="light"
                        color="red"
                        onClick={() => {
                            navigate('/');
                        }}
                    >
                        {mt('decline_button')}
                    </Button>
                    <Button
                        variant="light"
                        color="green"
                        onClick={() => {
                            storage.set(Constants.ALLOW_USE_CONTACTS_NAMES_KEY, 'allow').then(() => {
                                setShowWarning(false);
                                getContactsNames();
                            });
                        }}
                    >
                        {mt('allow_button')}
                    </Button>
                </Group>
            </Box>
        );
    }

    function LinkRow() {
        const link = `https://t.me/${isDev ? 'kit42_bot' : 'kit42bot'}/kit42?startapp=cn`;

        return (
            <>
                <Alert variant="light" color="gray" mt="md">
                    {mt('share_description')}
                </Alert>

                <Input
                    value={link}
                    readOnly={true}
                    rightSectionPointerEvents="all"
                    rightSection={
                        <CopyButton value={link} timeout={2000}>
                            {({ copied, copy }) => (
                                <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                    {copied ? <IconCheck style={{ width: 16 }} /> : <IconCopy style={{ width: 16 }} />}
                                </ActionIcon>
                            )}
                        </CopyButton>
                    }
                />
            </>
        );
    }

    if (serverData) {
        if (serverData.names.length > 4) {
            return (
                <>
                    {serverData.names.map(({ name, count }, key) => (
                        <>
                            {key > 0 && <Divider my={3} />}
                            <Flex
                                gap="md"
                                p={5}
                                justify="flex-start"
                                align="center"
                                direction="row"
                                wrap="wrap"
                                key={key}
                            >
                                <Text size="sm" inline>
                                    {name}
                                </Text>

                                <Container p={0} mr={0}>
                                    <Text size="12px" c="dimmed">
                                        {count}
                                    </Text>
                                </Container>
                            </Flex>
                        </>
                    ))}

                    <Center>
                        <Text c="dimmed" size="sm" mt="md">
                            {mt('updated').replace('{date}', dayjs(serverData.date).format('MMM D, YYYY h:mm:ss A'))}
                        </Text>
                    </Center>

                    <LinkRow />
                </>
            );
        }

        return (
            <Stack ta="center">
                <Text c="dimmed" size="sm" mt="md" ta="center">
                    {mt('no_records')}
                </Text>
                <Text c="dimmed" size="sm" mt="md">
                    {mt('updated').replace('{date}', dayjs(serverData.date).format('MMM D, YYYY h:mm:ss A'))}
                </Text>

                <LinkRow />
            </Stack>
        );
    }

    return null;
}
