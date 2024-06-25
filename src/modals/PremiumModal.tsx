import { useContext, useState } from 'react';
import { Button, Modal } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { useInvoice } from '@tma.js/sdk-react';
import { AnimatedHeader } from '../components/AnimatedHeader.tsx';
import { Padding } from '../components/Helpers.tsx';
import { AppContext } from '../contexts/AppContext.tsx';
import { Server } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

import commonClasses from '../styles/Common.module.css';

import AnimatedDuckPremium from '../assets/animated_stickers/duck_premium.json';

interface IPremiumModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ isOpen, onOpenChange }: IPremiumModalProps) {
    const { setPremium } = useContext(AppContext);

    const invoice = useInvoice();

    const [isLoading, setLoading] = useState(false);
    const [invoiceError, setInvoiceError] = useState('');

    const buttons = [
        {
            name: t('premium_modal.buttons.week'),
            stars: 50
        },
        {
            name: t('premium_modal.buttons.month'),
            stars: 100
        }
    ];

    async function openInvoice(stars: number) {
        setLoading(true);
        setInvoiceError('');

        const { link } = await Server<{ link: string }>('get-invoice', { invoice: stars });

        invoice
            .open(link, 'url')
            .then((status) => {
                if (status === 'paid') {
                    setPremium(true);
                    onOpenChange(false);
                }
            })
            .catch((error) => {
                setInvoiceError(error.toString());
            });

        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }

    function Buttons() {
        return buttons.map((button, key) => (
            <Button
                stretched
                key={key}
                loading={isLoading}
                disabled={isLoading}
                onClick={() => openInvoice(button.stars)}
                style={{ marginTop: 10 }}
            >
                <div style={{ marginBottom: -5 }}>{button.name}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {button.stars} {t('premium_modal.buttons.stars')}
                </div>
            </Button>
        ));
    }

    function Error() {
        if (!invoiceError) {
            return null;
        }

        return (
            <div style={{ color: 'var(--tg-theme-destructive-text-color)' }} className={commonClasses.center}>
                {invoiceError}
            </div>
        );
    }

    return (
        <Modal header={<ModalHeader />} open={isOpen} onOpenChange={onOpenChange}>
            <Padding>
                <AnimatedHeader
                    animationData={AnimatedDuckPremium}
                    title={t('premium_modal.title')}
                    subtitle={t('premium_modal.description')}
                />

                <Buttons />
                <Error />
            </Padding>
        </Modal>
    );
}
