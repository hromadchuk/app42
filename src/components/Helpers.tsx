import { ReactElement, useContext } from 'react';
import { Cell, CellProps } from '@telegram-apps/telegram-ui';
import { Link } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext.tsx';
import { t } from '../lib/lang.ts';

import commonClasses from '../styles/Common.module.css';

export function Padding({ children }: { children: ReactElement | ReactElement[] }) {
    return <div style={{ padding: 10 }}>{children}</div>;
}

export function WrappedCell(props: CellProps & { onlyPremium?: boolean }) {
    const { isPremium, setPremiumModalOpen } = useContext(AppContext);

    const { onlyPremium, ...origProps } = props;
    const cellProps: CellProps = { ...origProps };

    if (onlyPremium && !isPremium) {
        delete cellProps.href;

        cellProps.onClick = () => {
            setPremiumModalOpen(true);
        };
        cellProps.className = commonClasses.onlyPremium;

        if (typeof cellProps.children === 'string') {
            cellProps.children = t('premium_modal.only_premium');
        }
    }

    if (!cellProps.onClick && !cellProps.href) {
        cellProps.interactiveAnimation = 'opacity';
        cellProps.datatype = 'disabled';
    }

    function Block() {
        return (
            <Cell name="wrapped-cell" {...cellProps}>
                {cellProps.children}
            </Cell>
        );
    }

    return cellProps.href ? (
        <Link to={cellProps.href} target="_blank">
            <Block />
        </Link>
    ) : (
        <Block />
    );
}
