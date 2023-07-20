import { Center, Footer, Text } from '@mantine/core';
import { t } from '../lib/lang.tsx';

export function AppFooter() {
    return (
        <Footer height={28} withBorder={false} mt="xs">
            <Center mx="auto">
                <Text fz="sm">{t('common.footer')}</Text>
            </Center>
        </Footer>
    );
}
