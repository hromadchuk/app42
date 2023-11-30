import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Center, Container, Notification, Progress, Text } from '@mantine/core';
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import { Api } from 'telegram';

import { AppContext } from '../contexts/AppContext.tsx';
import { IFinishBlock, IGetDialogOption, IProgress, MethodContext, TDialogType } from '../contexts/MethodContext.tsx';
import { CallAPI, formatNumber, Server } from '../lib/helpers.ts';
import { IRouter, routes } from '../routes.tsx';
import { t, td } from '../lib/lang.ts';

// TODO need fix this, progress always null in child components
let progressSafe: IProgress | null = null;

export const AbstractMethod = () => {
    const location = useLocation();
    const { setAppLoading } = useContext(AppContext);

    const [progress, _setProgress] = useState<IProgress | null>();
    const [finishBlock, _setFinishBlock] = useState<IFinishBlock>();

    const routerInfo = routes.find((router: IRouter) => router.path === location.pathname) as IRouter;

    useEffect(() => {
        Server('method', { method: routerInfo.id });
    }, []);

    const needHideContent = (): boolean => {
        return [progress, finishBlock].some(Boolean);
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

    const getDialogs = async (options: IGetDialogOption): Promise<TDialogType[]> => {
        const { types } = options;

        const allDialogs: TDialogType[] = [];

        setProgress({ text: t('common.getting_dialogs') });

        const params = {
            offsetPeer: new Api.InputPeerEmpty(),
            limit: 100,
            offsetDate: 0
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { count, chats, users, dialogs, messages } = (await CallAPI(
                new Api.messages.GetDialogs(params)
            )) as Api.messages.DialogsSlice;

            setProgress({
                total: count || dialogs.length,
                addCount: dialogs.length
            });

            if (dialogs.length) {
                dialogs.forEach((dialog) => {
                    if (dialog.peer instanceof Api.PeerUser && types.includes(Api.User)) {
                        const findUser = users.find(
                            (user) => user.id.valueOf() === (dialog.peer as Api.PeerUser).userId.valueOf()
                        ) as Api.User;

                        allDialogs.push(findUser);
                    } else if (dialog.peer instanceof Api.PeerChat && types.includes(Api.Chat)) {
                        const findChat = chats.find(
                            (chat) => chat.id.valueOf() === (dialog.peer as Api.PeerChat).chatId.valueOf()
                        ) as Api.Chat;

                        // skip system chats
                        if (findChat.migratedTo) {
                            return;
                        }

                        allDialogs.push(findChat);
                    } else if (dialog.peer instanceof Api.PeerChannel && types.includes(Api.Channel)) {
                        const findChannel = chats.find(
                            (channel) => channel.id.valueOf() === (dialog.peer as Api.PeerChannel).channelId.valueOf()
                        ) as Api.Channel;

                        allDialogs.push(findChannel);
                    }
                });

                const lastDialog = dialogs[dialogs.length - 1];
                const dialogPeer = JSON.stringify(lastDialog.peer.toJSON());

                const lastMessage = messages.find((message) => {
                    return JSON.stringify((message as Api.Message).peerId.toJSON()) === dialogPeer;
                }) as Api.Message;

                params.offsetDate = lastMessage.date;
            } else {
                break;
            }
        }

        const filteredDialogs = allDialogs.reduce(
            (result, dialog) => {
                if (!result.ids.includes(dialog.id.valueOf())) {
                    result.list.push(dialog);
                    result.ids.push(dialog.id.valueOf());
                }

                return result;
            },
            { list: [], ids: [] } as { list: TDialogType[]; ids: number[] }
        );

        setProgress(null);

        return filteredDialogs.list;
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
                    {progress.warningText && (
                        <Notification withCloseButton={false} mb="xl" color="orange">
                            {progress.warningText}
                        </Notification>
                    )}
                    <Progress value={percent} animated />
                    <Text ta="center" size="xs">
                        {progress.text || t('common.progress')}
                        {counts.length > 0 && ` (${counts.map(formatNumber).join(' / ')})`}
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
                    <Center ta="center">{finishBlock.text}</Center>
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
                finishBlock,
                setFinishBlock,
                needHideContent,
                mt,
                md,
                t,
                td,
                getDialogs
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
