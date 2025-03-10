import { useContext, useEffect, useState } from 'react';
import { Divider, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconAt, IconInfoCircle, IconPhone } from '@tabler/icons-react';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { WrappedCell } from '../components/Helpers.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI, classNames, formatNumberFloat } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import commonClasses from '../styles/Common.module.css';

interface IUserRow {
    user: Api.User;
    wallets: string[];
    description: string;
    collectedNames: string[];
    collectedNumbers: number[];
    fragmentInfo: Map<string, Api.fragment.TypeCollectibleInfo>;
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

        const filteredUsers: IUserRow[] = [];

        for (const user of result.users) {
            const wallets = new Set<string>();
            const collectedNames: string[] = [];
            const collectedNumbers: number[] = [];
            const fragmentInfo: Map<string, Api.fragment.TypeCollectibleInfo> = new Map();

            if (user instanceof Api.User) {
                if (user.usernames) {
                    for (const username of user.usernames) {
                        collectedNames.push(username.username);

                        const fragment = await CallAPI(
                            new Api.fragment.GetCollectibleInfo({
                                collectible: new Api.InputCollectibleUsername({ username: username.username })
                            })
                        );

                        fragmentInfo.set(username.username, fragment);
                    }
                }

                if (user.phone?.startsWith('888')) {
                    collectedNumbers.push(Number(user.phone));

                    const fragment = await CallAPI(
                        new Api.fragment.GetCollectibleInfo({
                            collectible: new Api.InputCollectiblePhone({ phone: user.phone })
                        })
                    );

                    fragmentInfo.set(user.phone, fragment);
                }

                const description = [
                    ...collectedNames.map((name) => `@${name}`),
                    ...collectedNumbers.map((phone) => `+${phone}`)
                ].join(', ');

                if (description.length) {
                    filteredUsers.push({
                        user,
                        wallets: Array.from(wallets),
                        description,
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
                                    <WrappedCell
                                        key={usKey}
                                        before={<IconAt size={28} color="var(--tgui--link_color)" />}
                                        description={`${date}, ${formatNumberFloat(cryptoAmount)} ${fragment.cryptoCurrency}`}
                                        hint={sum}
                                    >
                                        @{name}
                                    </WrappedCell>
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
                                    <WrappedCell
                                        key={numKey}
                                        before={<IconPhone size={28} color="var(--tgui--link_color)" />}
                                        description={`${date}, ${formatNumberFloat(cryptoAmount)} ${fragment.cryptoCurrency}`}
                                        hint={sum}
                                    >
                                        +{phone}
                                    </WrappedCell>
                                );
                            })}
                        </Section>
                    )}
                </Modal>
            )}
        </>
    );
}
