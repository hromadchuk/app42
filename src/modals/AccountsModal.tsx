import { useEffect, useState } from 'react';
import { Avatar, Button, Cell, Divider, Input, List, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconLogout, IconSearch, IconTrash, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { usePopup } from '@tma.js/sdk-react';
import { t } from '../../src-old/lib/lang.ts';
import TonLogo from "../assets/ton_logo.svg";
import { Constants } from '../constants.ts';
import { getCache } from '../lib/cache.ts';
import { TonApiCall } from '../lib/TonApi.ts';

interface IAccountsModalProps {
    isOpen: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AccountsModal({ isOpen, onOpenChange }: IAccountsModalProps) {
    const popup = usePopup();
    const userFriendlyAddress = useTonAddress();
    const [wallet, setOptions] = useTonConnectUI();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        if (!userFriendlyAddress) {
            setWalletAddress(null);
            return;
        }

        console.log({userFriendlyAddress});

        TonApiCall.getWallet(userFriendlyAddress).then((accountInfo) => {
            setWalletAddress(accountInfo.name || TonApiCall.getShortAddress(userFriendlyAddress));
        });
    }, [userFriendlyAddress]);

    if (!isOpen) {
        return null;
    }

    return (
        <Modal header={<ModalHeader />} open={isOpen} onOpenChange={onOpenChange}>
            <div style={{ paddingBottom: 16 }}>
                <Cell
                    before={
                        <Avatar src="https://unsplash.com/photos/v2aKnjMbP_k/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzE1ODE1NDc2fA&force=true&w=640" />
                    }
                    description="@meowmeow"
                    after={<IconLogout size={28} stroke={1.2} />}
                >
                    Andrea Harinson
                </Cell>
                <Cell
                    before={
                        <Avatar>
                            <IconUser size={20} />
                        </Avatar>
                    }
                    description="Press to log in"
                    onClick={() => {}}
                >
                    Add new account
                </Cell>
                <Cell
                    before={<Avatar src={TonLogo} />}
                    after={<IconLogout size={24} stroke={1.2} />}
                    description={walletAddress}
                    onClick={() => {
                        popup
                            .open({
                                message: t('menu.wallet_disconnect'),
                                buttons: [
                                    { id: 'exit', type: 'ok' },
                                    { id: 'cancel', type: 'cancel' }
                                ]
                            })
                            .then((result) => {
                                if (result === 'exit') {
                                    wallet.disconnect();
                                    onOpenChange?.(false);
                                }
                            });
                    }}
                >
                    TON Wallet
                </Cell>
            </div>
        </Modal>
    );
}
