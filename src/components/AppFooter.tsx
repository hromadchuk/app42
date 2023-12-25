import { Center, Text } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { t } from '../lib/lang.ts';

export function AppFooter() {
    const location = useLocation();

    if (location.pathname === '/') {
        return null;
    }

    return (
        <Center mx="auto" pt="xs" pb="xs">
            <Text fz="sm">{t('common.footer')}</Text>
        </Center>
    );
}
