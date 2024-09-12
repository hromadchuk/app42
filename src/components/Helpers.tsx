import { CSSProperties, ReactElement } from 'react';
import { Cell, CellProps } from '@telegram-apps/telegram-ui';
import { initUtils } from '@telegram-apps/sdk-react';
import { Link } from 'react-router-dom';
import { isDev } from '../lib/utils.ts';

export function Padding({
    children,
    padding,
    paddingTop,
    paddingBottom
}: {
    children: ReactElement | ReactElement[];
    padding?: number;
    paddingTop?: number;
    paddingBottom?: number;
}) {
    const cssProps: CSSProperties = {
        padding: padding || 10
    };

    if (paddingTop) {
        cssProps.paddingTop = paddingTop;
    }

    if (paddingBottom) {
        cssProps.paddingBottom = paddingBottom;
    }

    return <div style={cssProps}>{children}</div>;
}

export function WrappedCell(props: CellProps) {
    const utils = initUtils();

    const { ...origProps } = props;
    const cellProps: CellProps = { ...origProps };

    if (cellProps.href?.includes('t.me/')) {
        const link = String(cellProps.href);

        cellProps.onClick = () => {
            if (isDev) {
                window.open(link);
            } else {
                utils.openTelegramLink(link);
            }
        };

        delete cellProps.href;
    }

    if (!cellProps.onClick && !cellProps.href) {
        cellProps.interactiveAnimation = 'opacity';
        cellProps.datatype = 'disabled';
    }

    return cellProps.href ? (
        <Link to={cellProps.href} target="_blank">
            <Cell name="wrapped-cell" {...cellProps}>
                {cellProps.children}
            </Cell>
        </Link>
    ) : (
        <Cell name="wrapped-cell" {...cellProps}>
            {cellProps.children}
        </Cell>
    );
}
