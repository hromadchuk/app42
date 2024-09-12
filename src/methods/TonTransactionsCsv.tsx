import { useContext, useState } from 'react';
import { Button, Input, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { toUserFriendlyAddress } from '@tonconnect/sdk';
import { useMiniApp, useUtils } from '@telegram-apps/sdk-react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Padding } from '../components/Helpers.tsx';
import { getAppLangCode } from '../lib/lang.ts';
import { TonApiCall } from '../lib/TonApi.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { Server } from '../lib/utils.ts';

import commonClasses from '../styles/Common.module.css';

export default function TonTransactionsCsv() {
    const { mt, needHideContent } = useContext(MethodContext);

    const utils = useUtils();
    const miniApp = useMiniApp();

    const [selectedWallet, setSelectedWallet] = useState<string>('');
    const [isSent, setSent] = useState<boolean>(false);

    const [wallet] = useTonConnectUI();
    const userWallet = wallet.account?.address as string;

    function getTransactions() {
        Server('get_ton_transactions_csv', {
            wallet: selectedWallet,
            lang: getAppLangCode()
        });

        setSent(true);
    }

    if (needHideContent()) return null;

    if (isSent) {
        return (
            <Section className={commonClasses.sectionBox}>
                <Placeholder>{mt('sent_description')}</Placeholder>

                <Padding padding={20} paddingTop={1}>
                    <Button
                        stretched
                        disabled={!selectedWallet}
                        onClick={() => {
                            utils.openTelegramLink('https://t.me/app42');
                            miniApp.close(true);
                        }}
                    >
                        {mt('button_chat')}
                    </Button>
                </Padding>
            </Section>
        );
    }

    return (
        <Section className={commonClasses.sectionBox}>
            {Boolean(userWallet) && (
                <Padding padding={20} paddingBottom={1}>
                    <Button
                        mode="gray"
                        stretched
                        onClick={() => {
                            setSelectedWallet(toUserFriendlyAddress(userWallet));
                        }}
                    >
                        {TonApiCall.getShortAddress(toUserFriendlyAddress(userWallet))}
                    </Button>
                </Padding>
            )}

            <div className={commonClasses.fixSearchBackground}>
                <Input
                    placeholder={mt('input_placeholder')}
                    value={selectedWallet}
                    onChange={(event) => setSelectedWallet(event.target.value)}
                />
            </div>

            <Padding padding={20} paddingTop={1}>
                <Button stretched disabled={!selectedWallet} onClick={getTransactions}>
                    {mt('button_get')}
                </Button>
            </Padding>
        </Section>
    );
}
