import { useContext, useEffect, useState } from 'react';
import { Avatar, Cell, Modal } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconLogout } from '@tabler/icons-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useCloudStorage, usePopup } from '@tma.js/sdk-react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { Constants } from '../constants.ts';
import { removeCache } from '../lib/cache.ts';
import { CallAPI, isDev } from '../lib/helpers.ts';
import { OwnerAvatar } from '../components/OwnerAvatar.tsx';
import { AppContext } from '../contexts/AppContext.tsx';
import { t } from '../lib/lang.ts';
import { TonApiCall } from '../lib/TonApi.ts';
import TonLogo from '../assets/ton_logo.svg';

interface IAccountsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountsModal({ isOpen, onOpenChange }: IAccountsModalProps) {
    const { user, setUser } = useContext(AppContext);

    const storage = useCloudStorage();
    const navigate = useNavigate();
    const popup = usePopup();
    const userFriendlyAddress = useTonAddress();
    const [wallet] = useTonConnectUI();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        if (!userFriendlyAddress) {
            setWalletAddress(null);
            return;
        }

        TonApiCall.getWallet(userFriendlyAddress).then((accountInfo) => {
            setWalletAddress(accountInfo.name || TonApiCall.getShortAddress(userFriendlyAddress));
        });
    }, [userFriendlyAddress]);

    function getUserData() {
        if (!user) {
            return null;
        }

        const result = {
            name: `${user.firstName || ''} ${user.lastName || ''}`,
            username: ''
        };

        if (user.username) {
            result.username = `@${user.username}`;
        } else if (user.usernames?.[0]) {
            result.username = `@${user.usernames[0].username}`;
        }

        return result;
    }

    if (!isOpen) {
        return null;
    }

    return (
        <Modal header={<ModalHeader />} open={isOpen} onOpenChange={onOpenChange}>
            <div style={{ paddingBottom: 16 }}>
                {Boolean(user) && (
                    <Cell
                        before={<OwnerAvatar owner={user} size={40} />}
                        description={getUserData()?.username}
                        after={<IconLogout size={24} stroke={1.2} />}
                        onClick={() => {
                            const action = async () => {
                                await CallAPI(new Api.auth.LogOut());

                                if (isDev) {
                                    await removeCache(Constants.SESSION_KEY);
                                } else {
                                    await storage.delete(Constants.SESSION_KEY);
                                }

                                setUser(null);
                                navigate('/');

                                localStorage.clear();
                                // markOnboardingAsCompleted();
                                location.reload();
                            };

                            if (isDev) {
                                action();
                            } else {
                                popup
                                    .open({
                                        message: t('menu.account_disconnect'),
                                        buttons: [
                                            { id: 'exit', type: 'ok' },
                                            { id: 'cancel', type: 'cancel' }
                                        ]
                                    })
                                    .then((result) => {
                                        if (result === 'exit') {
                                            action();
                                        }
                                    });
                            }
                        }}
                    >
                        {getUserData()?.name}
                    </Cell>
                )}
                {Boolean(userFriendlyAddress) && (
                    <Cell
                        before={<Avatar src={TonLogo} />}
                        after={<IconLogout size={24} stroke={1.2} />}
                        description={walletAddress}
                        onClick={() => {
                            const action = () => {
                                wallet.disconnect();
                                onOpenChange(false);
                            };

                            if (isDev) {
                                action();
                            } else {
                                popup
                                    .open({
                                        message: t('accounts_modal.wallet_disconnect'),
                                        buttons: [
                                            { id: 'exit', type: 'ok' },
                                            { id: 'cancel', type: 'cancel' }
                                        ]
                                    })
                                    .then((result) => {
                                        if (result === 'exit') {
                                            action();
                                        }
                                    });
                            }
                        }}
                    >
                        TON Wallet
                    </Cell>
                )}
            </div>
        </Modal>
    );
}
