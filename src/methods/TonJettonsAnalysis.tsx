import { Avatar, Badge, Center, Divider, Group, Stack, Text } from '@mantine/core';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useContext, useEffect, useState } from 'react';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { formatNumberFloat } from '../lib/helpers.ts';
import { getAppLangCode, LangType } from '../lib/lang.ts';
import { TonApiCall } from '../lib/TonApi.ts';

interface IJetton {
    name: string;
    image: string;
    formattedBalance: string;
    symbol: string;
    decimals: number;
    holderPosition: number;
    amounts: string[];
}

export const TonJettonsAnalysis = () => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [jettonsList, setJettonsList] = useState<IJetton[]>([]);

    const [wallet] = useTonConnectUI();
    const userWallet = wallet.account?.address as string;

    useEffect(() => {
        (async () => {
            setProgress({});

            const currencies = getAppLangCode() === LangType.RU ? ['ton', 'usd', 'rub'] : ['ton', 'usd'];
            const { balances } = await TonApiCall.getJettons(userWallet, currencies);
            const filteredBalances = balances.filter((balance) => Number(balance.balance) > 0);

            if (!filteredBalances.length) {
                setProgress(null);
                setFinishBlock({ state: 'error', text: mt('no_jettons') });
                return;
            }

            const jettons: IJetton[] = [];

            setProgress({ total: filteredBalances.length, text: mt('get_jettons_info') });

            for (const { jetton, balance, price } of filteredBalances) {
                const point = '1' + new Array(jetton.decimals).fill(0).join('');
                const formattedBalance = (Number(balance) / Number(point)).toFixed(jetton.decimals);

                const holders = await TonApiCall.getJettonHolders(jetton.address);
                const holderPosition = holders.addresses.findIndex((holder) => holder.owner.address === userWallet);

                const amounts: string[] = [];
                const priceKeys = Object.keys(price?.prices || {});

                for (const key of priceKeys) {
                    const amount = formatNumberFloat(getPrice(formattedBalance, Number(price?.prices?.[key])));
                    amounts.push(`${amount} ${key}`);
                }

                setProgress({ addCount: 1 });

                jettons.push({
                    name: jetton.name,
                    image: jetton.image,
                    formattedBalance,
                    symbol: jetton.symbol,
                    decimals: jetton.decimals,
                    holderPosition,
                    amounts
                });
            }

            setJettonsList(jettons);
            setProgress(null);
        })();
    }, []);

    function getPrice(formattedBalance: string, price: number) {
        const amount = parseFloat(formattedBalance) * price;

        return parseFloat(amount.toFixed(2));
    }

    if (needHideContent()) return null;

    if (jettonsList.length) {
        return jettonsList.map((jetton, key) => {
            return (
                <Stack gap={0} key={key}>
                    <Group justify="space-between">
                        <Group>
                            <Avatar src={jetton.image} radius="sm" />

                            <div>
                                <Text fw={500}>{jetton.name}</Text>
                                <Text fz="xs" c="dimmed">
                                    {jetton.formattedBalance} {jetton.symbol}
                                </Text>
                            </div>
                        </Group>

                        <Stack gap={0} align="end">
                            {jetton.amounts.map((amount, amountKey) => (
                                <Badge variant="transparent" color="blue" size="sm" key={amountKey}>
                                    {amount}
                                </Badge>
                            ))}
                        </Stack>
                    </Group>

                    {jetton.holderPosition > -1 && (
                        <Center>
                            <Badge variant="light" color="indigo" mt="xs">
                                {mt('top_holders').replace('{position}', String(jetton.holderPosition + 1))}
                            </Badge>
                        </Center>
                    )}

                    {key < jettonsList.length - 1 && <Divider my="md" />}
                </Stack>
            );
        });
    }

    return null;
};

export default TonJettonsAnalysis;
