import { Center, Text } from '@mantine/core';
import { t } from '../lib/lang.ts';

export function AppFooter() {
    return (
        <Center mx="auto" mt="xs" mb="xs">
            <Text fz="sm">{t('common.footer')}</Text>
        </Center>
    );
}
