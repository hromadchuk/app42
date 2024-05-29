import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Center, Container, Notification, Progress, Text } from '@mantine/core';
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import { ListAction } from '../components/ListAction.tsx';
import { Api } from 'telegram';

import { AppContext } from '../contexts/AppContext.tsx';
import {
    IFinishBlock,
    IGetDialogOption,
    IProgress,
    ISetListAction,
    MethodContext
} from '../contexts/MethodContext.tsx';
import { CallAPI, formatNumber, Server, sleep, TOwnerType } from '../lib/helpers.ts';
import { IRouter, routes } from '../routes.tsx';
import { t, td } from '../lib/lang.ts';

// TODO need fix this, progress always null in child components
let progressSafe: IProgress | null = null;

export default function AbstractMethod() {
    const location = useLocation();
    const { setAppLoading } = useContext(AppContext);

    const [progress, _setProgress] = useState<IProgress | null>();
    const [finishBlock, _setFinishBlock] = useState<IFinishBlock>();
    const [listAction, _setListAction] = useState<ISetListAction | null>(null);

    const routerInfo = routes.find((router: IRouter) => router.path === location.pathname) as IRouter;

    const needHideContent = (): boolean => {
        return [progress, finishBlock, listAction].some(Boolean);
    };

    const setProgress = (data: IProgress | null): void => {
        window.isProgress = Boolean(data);

        if (data) {
            const current = progressSafe || {};

            if (data.addCount) {
                data.count = (current.count || 0) + data.addCount;
            }

            progressSafe = {
                ...current,
                ...data
            };
        } else {
            progressSafe = data;
        }

        setAppLoading(Boolean(progressSafe));

        _setProgress(progressSafe);
    };

    useEffect(() => {
        Server('method', { method: routerInfo.methodId });

        return () => setProgress(null);
    }, []);

    const setFinishBlock = ({ text, state }: IFinishBlock): void => {
        setProgress(null);

        _setFinishBlock({
            text: text || t('common.done'),
            state: state || 'done'
        });
    };

    const mt = (key: string): string => {
        return t(`methods.${routerInfo.methodId}.${key}`);
    };

    const md = (key: string): string[] => {
        return td(`methods.${routerInfo.methodId}.${key}`);
    };

    const setListAction = ({ buttonText, loadingText, owners, requestSleep, action }: ISetListAction) => {
        _setListAction({
            buttonText,
            loadingText,
            owners,
            requestSleep,
            action
        });
    };

    const HelperBlock = () => {
        if (finishBlock) {
            return (
                <Box p="lg">
                    <Center>
                        {finishBlock.state === 'error' && <IconExclamationCircle size={50} color="#E03131" />}
                        {finishBlock.state === 'done' && <IconCircleCheck size={50} color="#2F9E44" />}
                    </Center>
                    <Center ta="center">{finishBlock.text}</Center>
                </Box>
            );
        }

        if (listAction) {
            return <ListAction setProgress={setProgress} setFinishBlock={setFinishBlock} {...listAction} />;
        }

        return null;
    };

    return (
        <MethodContext.Provider
            value={{
                progress,
                progressSafe,
                setProgress,
                finishBlock,
                setFinishBlock,
                needHideContent,
                mt,
                md,
                t,
                td,
                getDialogs,
                setListAction
            }}
        >
            <Container mt="xs" p="xs">
                {HelperBlock()}
                {routerInfo.childElement}
            </Container>
        </MethodContext.Provider>
    );
}
