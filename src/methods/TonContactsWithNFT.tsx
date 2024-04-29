import { useContext, useEffect, useState } from 'react';
import { Badge, Card, Group, Text } from '@mantine/core';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI, Server } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

interface IUserRow {
    user: Api.User;
    wallets: string[];
    collectedNames: string[];
    collectedNumbers: number[];
    fragmentInfo: Map<string, Api.fragment.TypeCollectibleInfo>;
}

interface IGetWalletsResponse {
    usernames: {
        ownerWallet: string;
        username: string;
    }[];
    numbers: {
        ownerWallet: string;
        number: number;
    }[];
}

export const TonContactsWithNFT = () => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);
    const [users, setUsers] = useState<IUserRow[]>([]);

    useEffect(() => {
        getContacts();
    }, []);

    async function getContacts() {
        setProgress({});

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

        if (!result.users?.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts') });
            return;
        }

        setProgress({ text: mt('get_users_info'), total: result.users.length });

        const usernames: string[] = [];
        const numbers: number[] = [];

        for (const user of result.users) {
            if (user instanceof Api.User) {
                if (user.usernames) {
                    for (const username of user.usernames) {
                        usernames.push(username.username);
                    }
                }

                if (user.phone?.startsWith('888')) {
                    numbers.push(Number(user.phone));
                }
            }
        }

        if (!usernames.length && !numbers.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts_with_nft') });
            return;
        }

        const data = await Server<IGetWalletsResponse>('get-wallets', { usernames, numbers });
        const filteredUsers: IUserRow[] = [];

        for (const user of result.users) {
            const wallets: string[] = [];
            const collectedNames: string[] = [];
            const collectedNumbers: number[] = [];
            const fragmentInfo: Map<string, Api.fragment.TypeCollectibleInfo> = new Map();

            if (user instanceof Api.User) {
                if (user.usernames) {
                    for (const username of user.usernames) {
                        const findWallet = data.usernames.find((item) => item.username === username.username);
                        if (findWallet) {
                            if (!wallets.includes(findWallet.ownerWallet)) {
                                wallets.push(findWallet.ownerWallet);
                            }

                            collectedNames.push(username.username);

                            const fragment = await CallAPI(
                                new Api.fragment.GetCollectibleInfo({
                                    collectible: new Api.InputCollectibleUsername({ username: username.username })
                                })
                            );

                            fragmentInfo.set(username.username, fragment);
                        }
                    }
                }

                if (user.phone?.startsWith('888')) {
                    const findWallet = data.numbers.find((item) => item.number === Number(user.phone));
                    if (findWallet) {
                        if (!wallets.includes(findWallet.ownerWallet)) {
                            wallets.push(findWallet.ownerWallet);
                        }

                        collectedNumbers.push(Number(user.phone));

                        const fragment = await CallAPI(
                            new Api.fragment.GetCollectibleInfo({
                                collectible: new Api.InputCollectiblePhone({ phone: user.phone })
                            })
                        );

                        fragmentInfo.set(user.phone, fragment);
                    }
                }

                if (wallets.length) {
                    filteredUsers.push({
                        user,
                        wallets,
                        collectedNames,
                        collectedNumbers,
                        fragmentInfo
                    });
                }
            }

            setProgress({ addCount: 1 });
        }

        if (!filteredUsers.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts_with_nft') });
            return;
        }

        setUsers(filteredUsers);
        setProgress(null);
    }

    if (needHideContent()) return null;

    if (users.length) {
        return users.map((row, key) => (
            <Card shadow="sm" mb="xs" withBorder key={key} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                <Card.Section p="xs">
                    <OwnerRow key={key} owner={row.user} />
                </Card.Section>

                {row.collectedNames.map((name, usKey) => {
                    const fragment = row.fragmentInfo.get(name);
                    if (!fragment) {
                        return null;
                    }

                    const amount = `${fragment.amount.valueOf() / 100} ${fragment.currency}`;
                    const date = mt('bought').replace(
                        '{date}',
                        dayjs(fragment.purchaseDate * 1000).format('DD.MM.YYYY')
                    );

                    return (
                        <Group justify="space-between" key={usKey}>
                            <div>
                                <Text fw={500}>@{name}</Text>
                                <Text fz="xs" c="dimmed">
                                    {date}
                                </Text>
                            </div>
                            <Badge variant="light">~{amount}</Badge>
                        </Group>
                    );
                })}

                {row.collectedNumbers.map((phone, numKey) => {
                    const fragment = row.fragmentInfo.get(String(phone));
                    if (!fragment) {
                        return null;
                    }

                    const amount = `${fragment.amount.valueOf() / 100} ${fragment.currency}`;
                    const date = mt('bought').replace(
                        '{date}',
                        dayjs(fragment.purchaseDate * 1000).format('DD.MM.YYYY')
                    );

                    return (
                        <Group justify="space-between" key={numKey}>
                            <div>
                                <Text fw={500}>+{phone}</Text>
                                <Text fz="xs" c="dimmed">
                                    {date}
                                </Text>
                            </div>
                            <Badge variant="light">~{amount}</Badge>
                        </Group>
                    );
                })}
            </Card>
        ));
    }

    return null;
};

export default TonContactsWithNFT;
