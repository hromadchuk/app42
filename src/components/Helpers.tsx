import { Cell, CellProps } from '@telegram-apps/telegram-ui';
import { ReactElement } from 'react';

export function Padding({ children }: { children: ReactElement | ReactElement[] }) {
    return <div style={{ padding: 10 }}>{children}</div>;
}

export function WrappedCell(props: CellProps) {
    return (
        <Cell name="wrapped-cell" {...props}>
            {props.children}
        </Cell>
    );
}
