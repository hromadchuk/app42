import { useState } from 'react';
import { IconButton } from '@telegram-apps/telegram-ui';
import { IconCheck, IconShare2, IconX } from '@tabler/icons-react';
import { generateShareLink } from '../lib/helpers.ts';
import { useTelegramLink } from '../lib/linksHelper.ts';

interface IShareButtonProps {
    url: string;
    text: string;
}

export function ShareIcon({ url, text }: IShareButtonProps) {
    const [isShared, setShared] = useState(false);
    const [isError, setError] = useState(false);
    const { openTelegramLink } = useTelegramLink();

    function setState(func: (value: boolean) => void) {
        func(true);

        setTimeout(() => {
            func(false);
        }, 3000);
    }

    function Icon() {
        if (isShared) {
            return <IconCheck size={24} color="var(--tgui--green)" />;
        }

        if (isError) {
            return <IconX size={24} color="var(--tgui--destructive_text_color)" />;
        }

        return <IconShare2 size={24} />;
    }

    return (
        <IconButton
            mode="plain"
            size="s"
            onClick={() => {
                if (isShared || isError) {
                    return;
                }

                const shareLink = generateShareLink(url, text);

                try {
                    openTelegramLink(shareLink);
                    setState(setShared);
                } catch (error) {
                    console.error('Failed to open share link:', error);
                    setState(setError);
                }
            }}
        >
            <Icon />
        </IconButton>
    );
}
