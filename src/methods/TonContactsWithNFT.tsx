import { useContext, useEffect, useState } from 'react';
import { Cell, Divider, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconAt, IconInfoCircle, IconLink, IconPhone, IconWallet } from '@tabler/icons-react';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI, classNames, formatNumberFloat, Server } from '../lib/helpers.ts';
import { TonApiCall } from '../lib/TonApi.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import commonClasses from '../styles/Common.module.css';

interface IUserRow {
    user: Api.User;
    wallets: string[];
    description: string;
    walletsAlias: Map<string, string>;
    walletsBalances: Map<string, number>;
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

export default function TonContactsWithNFT() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);
    const [users, setUsers] = useState<IUserRow[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUserRow | null>(null);

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
            const wallets = new Set<string>();
            const collectedNames: string[] = [];
            const collectedNumbers: number[] = [];
            const fragmentInfo: Map<string, Api.fragment.TypeCollectibleInfo> = new Map();

            if (user instanceof Api.User) {
                if (user.usernames) {
                    for (const username of user.usernames) {
                        const findWallet = data.usernames.find((item) => item.username === username.username);
                        if (findWallet) {
                            wallets.add(findWallet.ownerWallet);

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
                        wallets.add(findWallet.ownerWallet);

                        collectedNumbers.push(Number(user.phone));

                        const fragment = await CallAPI(
                            new Api.fragment.GetCollectibleInfo({
                                collectible: new Api.InputCollectiblePhone({ phone: user.phone })
                            })
                        );

                        fragmentInfo.set(user.phone, fragment);
                    }
                }

                if (wallets.size) {
                    const walletsAlias = new Map<string, string>();
                    const walletsBalances = new Map<string, number>();

                    for (const wallet of wallets) {
                        const alias = await TonApiCall.getNormalizedWallet(wallet);
                        walletsAlias.set(wallet, alias);

                        const info = await TonApiCall.getWallet(wallet);
                        walletsBalances.set(wallet, info.balance);
                    }

                    const description = [
                        ...collectedNames.map((name) => `@${name}`),
                        ...collectedNumbers.map((phone) => `+${phone}`)
                    ].join(', ');

                    filteredUsers.push({
                        user,
                        wallets: Array.from(wallets),
                        description,
                        walletsAlias,
                        walletsBalances,
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

    function UsersRow() {
        if (!users.length) {
            return null;
        }

        return (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                {users.map((row, key) => (
                    <OwnerRow
                        key={key}
                        owner={row.user}
                        description={row.description}
                        rightIcon={IconInfoCircle}
                        callback={() => setSelectedUser(row)}
                    />
                ))}
            </Section>
        );
    }

    return (
        <>
            {UsersRow()}

            {selectedUser && (
                <Modal
                    header={<ModalHeader />}
                    open={Boolean(selectedUser)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedUser(null);
                        }
                    }}
                >
                    <OwnerRow owner={selectedUser.user} withoutLink={true} />

                    <Divider style={{ marginTop: 10 }} />

                    {selectedUser.collectedNames.length > 0 && (
                        <Section header={mt('titles.usernames')} className={commonClasses.hideHr}>
                            {selectedUser.collectedNames.map((name, usKey) => {
                                const fragment = selectedUser.fragmentInfo.get(name);
                                if (!fragment) {
                                    return null;
                                }

                                const cryptoAmount = parseFloat((fragment.cryptoAmount.valueOf() / 1e9).toFixed(2));
                                const date = mt('bought').replace(
                                    '{date}',
                                    dayjs(fragment.purchaseDate * 1000).format('DD.MM.YYYY')
                                );
                                const sum = [
                                    '≈',
                                    formatNumberFloat(fragment.amount.valueOf() / 100),
                                    fragment.currency
                                ].join(' ');

                                return (
                                    <Cell
                                        key={usKey}
                                        before={<IconAt size={28} color="var(--tgui--link_color)" />}
                                        description={`${date}, ${formatNumberFloat(cryptoAmount)} ${fragment.cryptoCurrency}`}
                                        hint={sum}
                                    >
                                        @{name}
                                    </Cell>
                                );
                            })}
                        </Section>
                    )}

                    {selectedUser.collectedNumbers.length > 0 && (
                        <Section header={mt('titles.phones')} className={commonClasses.hideHr}>
                            {selectedUser.collectedNumbers.map((phone, numKey) => {
                                const fragment = selectedUser.fragmentInfo.get(String(phone));
                                if (!fragment) {
                                    return null;
                                }

                                const cryptoAmount = parseFloat((fragment.cryptoAmount.valueOf() / 1e9).toFixed(2));
                                const date = mt('bought').replace(
                                    '{date}',
                                    dayjs(fragment.purchaseDate * 1000).format('DD.MM.YYYY')
                                );
                                const sum = [
                                    '≈',
                                    formatNumberFloat(fragment.amount.valueOf() / 100),
                                    fragment.currency
                                ].join(' ');

                                return (
                                    <Cell
                                        key={numKey}
                                        before={<IconPhone size={28} color="var(--tgui--link_color)" />}
                                        description={`${date}, ${formatNumberFloat(cryptoAmount)} ${fragment.cryptoCurrency}`}
                                        hint={sum}
                                    >
                                        +{phone}
                                    </Cell>
                                );
                            })}
                        </Section>
                    )}

                    {selectedUser.wallets.length > 0 && (
                        <Section header={mt('titles.wallets')} className={commonClasses.hideHr}>
                            {selectedUser.wallets.map((wallet, walletKey) => {
                                const balance = parseFloat(
                                    ((selectedUser.walletsBalances.get(wallet) as number) / 1e9).toFixed(2)
                                );

                                return (
                                    <Cell
                                        key={walletKey}
                                        before={<IconWallet size={28} color="var(--tgui--link_color)" />}
                                        description={`${formatNumberFloat(balance)} TON`}
                                        Component="a"
                                        href={`https://tonviewer.com/${wallet}`}
                                        target="_blank"
                                        after={<IconLink size={18} />}
                                    >
                                        {TonApiCall.getShortAddress(selectedUser.walletsAlias.get(wallet) || wallet)}
                                    </Cell>
                                );
                            })}
                        </Section>
                    )}
                </Modal>
            )}
        </>
    );
}
