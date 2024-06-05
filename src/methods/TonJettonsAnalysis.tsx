import { Avatar, Blockquote, Caption, Section } from '@telegram-apps/telegram-ui';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useContext, useEffect, useState } from 'react';
import { WrappedCell } from '../components/Helpers.tsx';
import { classNames, formatNumberFloat } from '../lib/helpers.ts';
import { getAppLangCode, LangType } from '../lib/lang.ts';
import { TonApiCall } from '../lib/TonApi.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface IJetton {
    name: string;
    image: string;
    formattedBalance: string;
    symbol: string;
    decimals: number;
    holderPosition: number;
    amountTON: number;
    amounts: string[];
}

export default function TonJettonsAnalysis() {
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
                let amountTON = 0;
                const point = '1' + new Array(jetton.decimals).fill(0).join('');
                const formattedBalance = formatNumberFloat(Number((Number(balance) / Number(point)).toFixed(2)));

                const holders = await TonApiCall.getJettonHolders(jetton.address);
                const holderPosition = holders.addresses.findIndex((holder) => holder.owner.address === userWallet);

                const amounts: string[] = [];
                const priceKeys = Object.keys(price?.prices || {});

                for (const key of priceKeys) {
                    const amount = (Number(balance) / Number(point)) * Number(price?.prices?.[key]);

                    if (key === 'TON') {
                        amountTON = amount;
                    }

                    amounts.push(`${formatNumberFloat(amount)} ${key}`);
                }

                setProgress({ addCount: 1 });

                jettons.push({
                    name: jetton.name,
                    image: jetton.image,
                    formattedBalance,
                    symbol: jetton.symbol,
                    decimals: jetton.decimals,
                    holderPosition,
                    amounts,
                    amountTON
                });
            }

            jettons.sort((a, b) => b.amountTON - a.amountTON);

            setJettonsList(jettons);
            setProgress(null);
        })();
    }, []);

    if (needHideContent()) return null;

    if (jettonsList.length) {
        return jettonsList.map((jetton, key) => (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)} key={key}>
                <WrappedCell
                    className={commonClasses.disabledCell}
                    interactiveAnimation="opacity"
                    before={<Avatar size={48} src={jetton.image} />}
                    description={`${jetton.formattedBalance} ${jetton.symbol}`}
                    style={{ borderLeft: jetton.holderPosition > -1 ? '3px solid var(--tgui--link_color)' : '' }}
                    after={
                        <div style={{ display: 'block', opacity: 0.5 }}>
                            {jetton.amounts.map((amount, amountKey) => (
                                <h6 key={amountKey} style={{ margin: 3, textAlign: 'right' }}>
                                    ~{amount}
                                </h6>
                            ))}
                        </div>
                    }
                >
                    {jetton.name}
                </WrappedCell>

                {jetton.holderPosition > -1 && (
                    <Blockquote
                        style={{
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            textAlign: 'center',
                            padding: 3
                        }}
                        topRightIcon={null}
                    >
                        <Caption>{mt('top_holders').replace('{position}', String(jetton.holderPosition + 1))}</Caption>
                    </Blockquote>
                )}
            </Section>
        ));
    }
}
