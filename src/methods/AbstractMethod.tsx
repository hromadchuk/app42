import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Center, Container, Progress, Text } from '@mantine/core';

import { IFinishBlock, IProgress, MethodContext } from '../components/MethodContext.tsx';
import { IRouter, routers } from '../routes.tsx';
import { t, td } from '../lib/lang.tsx';

export const AbstractMethod = () => {
    const location = useLocation();

    const [progress, setProgress] = useState<IProgress | null>();
    const [finishBlock, _setFinishBlock] = useState<IFinishBlock>();

    const routerInfo = routers.find((router: IRouter) => router.path === location.pathname) as IRouter;

    const needHideContent = (): boolean => {
        return [progress, finishBlock].some(Boolean);
    };

    const setFinishBlock = ({ text, state }: IFinishBlock): void => {
        _setFinishBlock({
            text: text || t('common.done'),
            state: state || 'done'
        });
    };

    const mt = (key: string): string => {
        return t(`methods.${routerInfo.id}.${key}`);
    };

    const HelperBlock = () => {
        if (progress) {
            let percent = 100;
            const counts: number[] = [];

            if (progress.count !== undefined) {
                counts.push(progress.count);
            }

            if (progress.count !== undefined && progress.total !== undefined) {
                counts.push(progress.total);
                percent = Math.floor((progress.count / progress.total) * 100);
            }

            return (
                <>
                    <Progress value={percent} animate />
                    <Text align="center" size="xs">
                        {progress.text || t('common.progress')}
                        {counts.length > 0 && `(${counts.join(' / ')})`}
                    </Text>
                </>
            );
        }

        if (finishBlock) {
            return (
                <Box p="lg">
                    <Center>{finishBlock.text}</Center>
                </Box>
            );
        }

        return null;
    };

    return (
        <MethodContext.Provider
            value={{
                progress,
                setProgress,
                finishBlock,
                setFinishBlock,
                needHideContent,
                mt,
                t,
                td
            }}
        >
            <Container mt="xs">
                {HelperBlock()}
                {routerInfo.childElement}
            </Container>
        </MethodContext.Provider>
    );
};

export default AbstractMethod;
