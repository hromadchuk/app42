import { useContext, useEffect, useState } from 'react';
import { Avatar, Group, Table, Text } from '@mantine/core';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { AccountEvent, Action, NftItem } from 'tonapi-sdk-js';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import { TonApiCall } from '../lib/TonApi.ts';

export const TonNFTAnalysis = () => {
    const { mt, needHideContent, setFinishBlock, getDialogs } = useContext(MethodContext);
    const userFriendlyAddress = useTonAddress();
    const wallet = useTonWallet();
    const [nftsList, setNftsList] = useState<NftItem[]>([]);
    const [actionsList, setActionsList] = useState<Map<string, Action[]>>(new Map([]));

    console.log({userFriendlyAddress});
    console.log(JSON.stringify(wallet, null, 2));

    useEffect(() => {
        (async () => {
            const transactions = await TonApiCall.getTransactions(userFriendlyAddress);
            console.log('transactions', transactions);
            const events = await TonApiCall.getNftsTransactions(userFriendlyAddress);
            console.log('events', events);
            const allActions = events.reduce((result, event) => {
                result.push(...event.actions);

                return result;
            }, [] as Action[]);
            console.log('allActions', allActions);
            const groupedActions = allActions.reduce((result, action) => {
                if (action.type !== 'NftItemTransfer') return result;

                if (!action.NftItemTransfer?.nft) {
                    console.log('unknown nft id', action);
                    return result;
                }

                const actions = result.get(action.NftItemTransfer.nft) || [];
                actions.push(action);
                result.set(action.NftItemTransfer.nft, actions);

                return result;
            }, new Map<string, Action[]>());
            console.log('groupedActions', groupedActions);

            setActionsList(groupedActions);

            TonApiCall.getNfts(userFriendlyAddress).then(setNftsList);
        })();
    }, []);

    if (needHideContent()) return null;

    function NftRow(item: NftItem, key: number) {
        const image = item.previews?.find((preview) => preview.resolution === '100x100')?.url;
        const actions = actionsList.get(item.address) || [];

        return (
            <Table.Tr key={key}>
                <Table.Td>
                    <Group gap="sm">
                        <Avatar size={40} src={image} radius="sm" />
                        <div>
                            <Text fz="sm" fw={500}>
                                {item.metadata.name}
                            </Text>
                            {/* <Text fz="xs" c="dimmed"> */}
                            {/*     {'item.email'} */}
                            {/* </Text> */}
                            <pre style={{ fontSize: 8 }}>{JSON.stringify(actions, null, 2)}</pre>
                        </div>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    }

    if (nftsList) {
        return (
            <Table verticalSpacing="sm">
                <Table.Tbody>{nftsList.map(NftRow)}</Table.Tbody>
            </Table>
        );
    }

    return <Text>test</Text>;
};

export default TonNFTAnalysis;
