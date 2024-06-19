import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IFinishBlock, IProgress, ISetListAction, MethodContext } from '../contexts/MethodContext.tsx';
import { Server } from '../lib/helpers.ts';
import { t, td } from '../lib/lang.ts';
import { getMethodById, MethodCategory } from '../routes.tsx';
import { ListAction } from '../components/ListAction.tsx';
import { MethodLoader } from '../components/MethodLoader.tsx';
import { MethodPlaceholder } from '../components/MethodPlaceholder.tsx';

// TODO need fix this, progress always null in child components
let progressSafe: IProgress | null = null;

export default function AbstractMethod() {
    const categoryId = useParams().categoryId as MethodCategory;
    const methodId = useParams().methodId as string;
    const method = getMethodById(methodId);

    const [progress, _setProgress] = useState<IProgress | null>();
    const [finishBlock, _setFinishBlock] = useState<IFinishBlock>();
    const [listAction, setListAction] = useState<ISetListAction | null>(null);

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

        _setProgress(progressSafe);
    };

    useEffect(() => {
        Server('method', { method: method.id });

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
        return t(`methods.${method.id}.${key}`);
    };

    const md = (key: string): string[] => {
        return td(`methods.${method.id}.${key}`);
    };

    function HelpersBlock() {
        if (progress) {
            return <MethodLoader {...progress} />;
        }

        if (finishBlock) {
            return <MethodPlaceholder {...finishBlock} />;
        }

        if (listAction) {
            return <ListAction setProgress={setProgress} setFinishBlock={setFinishBlock} {...listAction} />;
        }

        return null;
    }

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
                setListAction
            }}
        >
            <HelpersBlock />
            {method.element || (
                <>
                    <div>Method not found</div>
                    <div>categoryId: {categoryId}</div>
                    <div>methodId: {methodId}</div>
                </>
            )}
        </MethodContext.Provider>
    );
}
