import { Headline, Subheadline } from '@telegram-apps/telegram-ui';

import classes from '../styles/PageHeader.module.css';

interface IPageHeaderProps {
    header: string;
    subheader?: string;
    color: string;
}

export function PageHeader(props: IPageHeaderProps) {
    const { header, subheader, color } = props;

    return (
        <div
            id="method_header"
            className={classes.block}
            style={{
                backgroundColor: color
            }}
        >
            <Headline weight="1">{header}</Headline>

            {subheader && (
                <Subheadline level="2" weight="2" className={classes.description}>
                    {subheader}
                </Subheadline>
            )}
        </div>
    );
}
