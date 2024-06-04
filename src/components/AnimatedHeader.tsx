import Lottie from 'lottie-react';
import { Text, Title } from '@telegram-apps/telegram-ui';

import classes from '../styles/AnimatedHeader.module.css';

interface IProps {
    animationData?: unknown;
    title: string;
    subtitle?: string | JSX.Element;
}

export function AnimatedHeader(props: IProps) {
    const { animationData, title, subtitle } = props;

    return (
        <div className={classes.box}>
            {Boolean(animationData) && <Lottie animationData={animationData} className={classes.animation} />}
            <Title level="1" weight="1">
                {title}
            </Title>
            {subtitle && (
                <Text weight="3" className={classes.text}>
                    {subtitle}
                </Text>
            )}
        </div>
    );
}
