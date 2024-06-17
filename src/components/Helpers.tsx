import { ReactElement } from 'react';
import { Cell, CellProps } from '@telegram-apps/telegram-ui';
import { Link } from 'react-router-dom';

export function Padding({ children }: { children: ReactElement | ReactElement[] }) {
    return <div style={{ padding: 10 }}>{children}</div>;
}

export function WrappedCell(props: CellProps) {
    const cellProps: CellProps = { ...props };

    if (!cellProps.onClick && !cellProps.href) {
        cellProps.interactiveAnimation = 'opacity';
        cellProps.datatype = 'disabled';
    }

    if (cellProps.href) {
        return (
            <Link to={cellProps.href} target="_blank">
                <Cell name="wrapped-cell" {...cellProps}>
                    {cellProps.children}
                </Cell>
            </Link>
        );
    }

    return (
        <Cell name="wrapped-cell" {...cellProps}>
            {cellProps.children}
        </Cell>
    );
}
