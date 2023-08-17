import { useContext, useEffect, useState } from 'react';
import { Button, Center, Group, RingProgress, Text } from '@mantine/core';
import { useCounter } from '@mantine/hooks';
import { IconUsersGroup } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI, formatNumber, getPercent, sleep } from '../lib/helpers.tsx';

import { MethodContext } from '../components/MethodContext.tsx';

export const ClearBlacklist = () => {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [isLoading, setIsLoading] = useState(false);
    const [blockedCount, setBlockedCount] = useState(0);
    const [offset, handlers] = useCounter(0);

    useEffect(() => {
        setProgress({});

        (async () => {
            const owners = await getBlocked();

            if (owners.count) {
                setBlockedCount(owners.count);
                setProgress(null);
            } else {
                setFinishBlock({ text: mt('blacklist_empty') });
            }
        })();
    }, []);

    async function getBlocked() {
        return (await CallAPI(
            new Api.contacts.GetBlocked({
                offset: 0,
                limit: 100
            })
        )) as Api.contacts.BlockedSlice;
    }

    async function clearBlacklist() {
        setIsLoading(true);

        while (offset < blockedCount) {
            const owners = await getBlocked();

            if (!owners.blocked) {
                break;
            }

            for (const owner of owners.blocked) {
                await sleep(1000);

                await CallAPI(
                    new Api.contacts.Unblock({
                        id: owner.peerId
                    })
                );

                handlers.increment();
            }
        }

        setFinishBlock({ text: mt('blacklist_empty') });
    }

    if (needHideContent()) return null;

    if (blockedCount) {
        return (
            <Group>
                <RingProgress
                    size={80}
                    roundCaps
                    thickness={8}
                    sections={[{ value: getPercent(blockedCount - offset, blockedCount), color: 'yellow' }]}
                    label={
                        <Center>
                            <IconUsersGroup size="1.4rem" stroke={1.5} />
                        </Center>
                    }
                />

                <div>
                    <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                        {mt('title')}
                    </Text>
                    <Text weight={700} size="xl">
                        {formatNumber(blockedCount - offset)}
                    </Text>
                </div>

                <Button fullWidth variant="outline" mt="xs" loading={isLoading} onClick={clearBlacklist}>
                    {mt('button_clear')}
                </Button>
            </Group>
        );
    }

    return null;
};

export default ClearBlacklist;
