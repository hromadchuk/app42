import { useContext, useEffect, useState } from 'react';
import { Avatar, Group, Table, Text } from '@mantine/core';
import { useTonAddress } from '@tonconnect/ui-react';
import { NftItem } from 'tonapi-sdk-js';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import { TonApiCall } from '../lib/TonApi.ts';

export const TonWallet = () => {
    const { mt, needHideContent, setFinishBlock, getDialogs } = useContext(MethodContext);
    const userFriendlyAddress = useTonAddress();
    const [nftsList, setNftsList] = useState<NftItem[]>([]);

    console.log({userFriendlyAddress});

    useEffect(() => {
        TonApiCall.getNfts(userFriendlyAddress).then(setNftsList);
        TonApiCall.getNftsTransactions(userFriendlyAddress).then(console.log);
    }, []);

    if (needHideContent()) return null;

    function NftRow(item: NftItem, key: number) {
        const image = item.previews?.find((preview) => preview.resolution === '100x100')?.url;

        return (
            <Table.Tr key={key}>
                <Table.Td>
                    <Group gap="sm">
                        <Avatar size={40} src={image} radius="sm" />
                        <div>
                            <Text fz="sm" fw={500}>
                                {item.metadata.name}
                            </Text>
                            <Text fz="xs" c="dimmed">
                                {'item.email'}
                            </Text>
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

export default TonWallet;
