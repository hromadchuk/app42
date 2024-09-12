import { Caption } from '@telegram-apps/telegram-ui';
import { IconHeart } from '@tabler/icons-react';
import { t } from '../lib/lang.ts';
import { Padding } from './Helpers.tsx';

import commonClasses from '../styles/Common.module.css';

export function AppFooter() {
    return (
        <Caption className={commonClasses.footerCount}>
            <Padding>
                <>
                    {t('common.footer')} <IconHeart size={12} style={{ marginBottom: -2 }} />
                </>
            </Padding>
        </Caption>
    );
}
