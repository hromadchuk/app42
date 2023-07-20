import { createContext } from 'react';

export interface IProgress {
    count?: number;
    total?: number;
    text?: string;
}

export interface IFinishBlock {
    state?: 'done' | 'error';
    text?: string;
}

export interface IMethodContext {
    progress?: IProgress | null;
    setProgress: (progress: IProgress | null) => void;
    finishBlock?: IFinishBlock;
    setFinishBlock: (finishBlock: IFinishBlock) => void;
    needHideContent: () => boolean;
    t: (key: string) => string;
    td: (key: string) => string[];
    mt: (key: string) => string;
}

// @ts-ignore
export const MethodContext = createContext<IMethodContext>({});
