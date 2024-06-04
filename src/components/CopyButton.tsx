import { useState } from 'react';
import { IconButton } from '@telegram-apps/telegram-ui';
import { IconCheck, IconCopy, IconX } from '@tabler/icons-react';

interface ICopyButtonProps {
    value: string;
}

export function CopyButton({ value }: ICopyButtonProps) {
    const [isCopied, setCopied] = useState(false);
    const [isError, setError] = useState(false);

    function setState(func: (value: boolean) => void) {
        func(true);

        setTimeout(() => {
            func(false);
        }, 3000);
    }

    function Icon() {
        if (isCopied) {
            return <IconCheck size={24} color="var(--tgui--green)" />;
        }

        if (isError) {
            return <IconX size={24} color="var(--tgui--destructive_text_color)" />;
        }

        return <IconCopy size={24} />;
    }

    return (
        <IconButton
            mode="plain"
            size="s"
            onClick={() => {
                if (isCopied || isError) {
                    return;
                }

                navigator.clipboard
                    .writeText(value)
                    .then(() => {
                        setState(setCopied);
                    })
                    .catch((error) => {
                        console.error('Failed to copy text:', error);

                        setState(setError);
                    });
            }}
        >
            <Icon />
        </IconButton>
    );
}
