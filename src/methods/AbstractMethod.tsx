import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Center, Container, Progress, Text } from '@mantine/core';
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';

import { IFinishBlock, IProgress, MethodContext } from '../components/MethodContext.tsx';
import { IRouter, routers } from '../routes.tsx';
import { t, td } from '../lib/lang.tsx';

// TODO need fix this, progress always null in child components
let progressSafe: IProgress | null = null;

export const AbstractMethod = () => {
    const location = useLocation();

    const [progress, _setProgress] = useState<IProgress | null>();
    const [finishBlock, _setFinishBlock] = useState<IFinishBlock>();

    const routerInfo = routers.find((router: IRouter) => router.path === location.pathname) as IRouter;

    const needHideContent = (): boolean => {
        return [progress, finishBlock].some(Boolean);
    };

    const setProgress = (data: IProgress | null): void => {
        progressSafe = data;

        _setProgress(data);
    };

    const getProgress = (): IProgress => {
        return progressSafe as IProgress;
    };

    const setFinishBlock = ({ text, state }: IFinishBlock): void => {
        setProgress(null);

        _setFinishBlock({
            text: text || t('common.done'),
            state: state || 'done'
        });
    };

    const mt = (key: string): string => {
        return t(`methods.${routerInfo.id}.${key}`);
    };

    const md = (key: string): string[] => {
        return td(`methods.${routerInfo.id}.${key}`);
    };

    const HelperBlock = () => {
        if (progress) {
            let percent = 100;
            const counts: number[] = [];

            if (progress.count !== undefined) {
                counts.push(progress.count);
            }

            if (progress.total !== undefined) {
                if (progress.count === undefined) {
                    progress.count = 0;
                    counts.push(progress.count);
                }

                counts.push(progress.total);
                percent = Math.floor((progress.count / progress.total) * 100);
            }

            return (
                <>
                    <Progress value={percent} animate />
                    <Text align="center" size="xs">
                        {progress.text || t('common.progress')}
                        {counts.length > 0 && ` (${counts.join(' / ')})`}
                    </Text>
                </>
            );
        }

        if (finishBlock) {
            return (
                <Box p="lg">
                    <Center>
                        {finishBlock.state === 'error' && <IconExclamationCircle size={50} color="#E03131" />}
                        {finishBlock.state === 'done' && <IconCircleCheck size={50} color="#2F9E44" />}
                    </Center>
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
                progressSafe,
                setProgress,
                getProgress,
                finishBlock,
                setFinishBlock,
                needHideContent,
                mt,
                md,
                t,
                td
            }}
        >
            <Container mt="xs" p="xs">
                {HelperBlock()}
                {routerInfo.childElement}
            </Container>
        </MethodContext.Provider>
    );
};

export default AbstractMethod;
