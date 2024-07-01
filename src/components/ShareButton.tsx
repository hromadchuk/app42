import { Button } from '@telegram-apps/telegram-ui';
import { IconShare2 } from '@tabler/icons-react';
import { useTelegramLink } from '../lib/linksHelper.ts';
import { generateShareLink } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

interface ShareButtonProps {
    url?: string;
    buttonText?: string;
    shareText?: string;
}

export function ShareButton({ url, buttonText, shareText }: ShareButtonProps) {
    const { openTelegramLink } = useTelegramLink();

    const handleShare = () => {
        const shareLink = generateShareLink(url ?? 'https://t.me/app42/app', shareText ?? '');
        openTelegramLink(shareLink);
    };

    return (
        <Button stretched={true} mode="filled" size="l" before={<IconShare2 size={24} />} onClick={handleShare}>
            {buttonText ?? t('common.share')}
        </Button>
    );
}
