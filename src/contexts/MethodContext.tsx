import { createContext } from 'react';
import { Api } from 'telegram';
import { TOwnerType } from '../lib/helpers.ts';

export interface IProgress {
    count?: number;
    addCount?: number;
    total?: number;
    text?: string;
    warningText?: string;
}

export interface IFinishBlock {
    state?: 'done' | 'error';
    text?: string;
}

export type TDialogWithoutUser = Exclude<TOwnerType, Api.User>;

export interface ISetListAction {
    buttonText: string;
    loadingText: string;
    requestSleep: number;
    owners: TOwnerType[];
    action: (owner: TOwnerType) => Promise<void>;
}

export interface IMethodContext {
    progress?: IProgress | null;
    progressSafe?: IProgress | null;
    setProgress: (progress: IProgress | null) => void;
    finishBlock?: IFinishBlock;
    setFinishBlock: (finishBlock: IFinishBlock) => void;
    setListAction: (options: ISetListAction) => void;
    needHideContent: () => boolean;
    t: (key: string) => string;
    td: (key: string) => string[];
    mt: (key: string) => string;
    md: (key: string) => string[];
}

// @ts-ignore
export const MethodContext = createContext<IMethodContext>({});
