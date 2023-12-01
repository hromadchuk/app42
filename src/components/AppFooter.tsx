import { Center, Text } from '@mantine/core';
import { t } from '../lib/lang.ts';

export function AppFooter() {
    return (
        <Center mx="auto" pt="xs" pb="xs">
            <Text fz="sm">{t('common.footer')}</Text>
        </Center>
    );
}
