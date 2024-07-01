import { useUtils } from '@tma.js/sdk-react';

export function useTelegramLink() {
    const utils = useUtils();

    const openTelegramLink = (link: string) => {
        utils.openTelegramLink(link);
    };

    return { openTelegramLink };
}
