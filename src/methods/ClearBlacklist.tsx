import { useContext, useEffect, useState } from 'react';
import { Button, Flex } from '@mantine/core';
import { Api } from 'telegram';
import { CallAPI, declineAndFormat } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { CheckboxCard } from '../components/CheckboxCard.tsx';
import { IconRobot, IconUser } from '@tabler/icons-react';

interface IBannedResult {
    count: number;
    bots: Api.User[];
    users: Api.User[];
}

export const ClearBlacklist = () => {
    const { mt, md, needHideContent, setFinishBlock, setProgress, setListAction } = useContext(MethodContext);

    const [needRemoveUsers, setNeedRemoveUsers] = useState(true);
    const [needRemoveBots, setNeedRemoveBots] = useState(true);
    const [blockedResult, setBlockedResult] = useState<IBannedResult | null>(null);

    useEffect(() => {
        (async () => {
            const blocked = await getBlocked();

            if (blocked.count) {
                setBlockedResult(blocked);
                setProgress(null);

                if (!blocked.bots.length) {
                    setNeedRemoveBots(false);
                }

                if (!blocked.users.length) {
                    setNeedRemoveUsers(false);
                }
            } else {
                setFinishBlock({ text: mt('blacklist_empty') });
            }
        })();
    }, []);

    async function getBlocked() {
        let offset = 0;
        const limit = 5;
        const blockedUsers: Api.User[] = [];

        setProgress({ text: mt('get_blacklist') });

        while (true) {
            const { count, users } = (await CallAPI(
                new Api.contacts.GetBlocked({
                    offset,
                    limit
                })
            )) as Api.contacts.BlockedSlice;

            offset += limit;

            setProgress({ addCount: users.length, total: count });

            if (users.length) {
                blockedUsers.push(...(users as Api.User[]));
            }

            if (offset > count) {
                break;
            }
        }

        return blockedUsers.reduce<IBannedResult>(
            (result, user) => {
                if (user.bot) {
                    result.bots.push(user);
                } else {
                    result.users.push(user);
                }

                return result;
            },
            {
                count: blockedUsers.length,
                bots: [],
                users: []
            }
        );
    }

    function getDeletedList() {
        const result: Api.User[] = [];

        if (!blockedResult) {
            return result;
        }

        if (needRemoveUsers) {
            result.push(...blockedResult.users);
        }

        if (needRemoveBots) {
            result.push(...blockedResult.bots);
        }

        return result;
    }

    function clearBlacklist() {
        const deletedList = getDeletedList();

        setListAction({
            buttonText: mt('button_clear'),
            loadingText: mt('clearing_progress'),
            requestSleep: 777,
            owners: deletedList,
            action: async (owner) => {
                await CallAPI(
                    new Api.contacts.Unblock({
                        id: owner.id
                    })
                );
            }
        });
    }

    if (needHideContent()) return null;

    if (blockedResult) {
        return (
            <>
                <Flex gap={5}>
                    <CheckboxCard
                        icon={<IconUser />}
                        title={declineAndFormat(blockedResult.users.length, md('checkbox_users'))}
                        disabled={blockedResult.users.length === 0}
                        checked={needRemoveUsers}
                        setChecked={(isChecked) => setNeedRemoveUsers(isChecked)}
                    />

                    <CheckboxCard
                        icon={<IconRobot />}
                        title={declineAndFormat(blockedResult.bots.length, md('checkbox_bots'))}
                        disabled={blockedResult.bots.length === 0}
                        checked={needRemoveBots}
                        setChecked={(isChecked) => setNeedRemoveBots(isChecked)}
                    />
                </Flex>

                <Button
                    fullWidth
                    variant="outline"
                    mt="xs"
                    disabled={blockedResult.count === 0 || (!needRemoveUsers && !needRemoveBots)}
                    onClick={clearBlacklist}
                >
                    {mt('button_clear_preview')}
                </Button>
            </>
        );
    }

    return null;
};

export default ClearBlacklist;
