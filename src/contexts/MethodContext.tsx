import { createContext } from 'react';
import { Api } from 'telegram';

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

export type TDialogType = Api.Chat | Api.Channel | Api.User;

export interface IGetDialogOption {
    types: (typeof Api.Chat | typeof Api.Channel | typeof Api.User)[];
}

export interface ISetListAction {
    buttonText: string;
    loadingText: string;
    requestSleep: number;
    owners: TDialogType[];
    action: (owner: TDialogType) => Promise<void>;
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
    getDialogs: (options: IGetDialogOption) => Promise<TDialogType[]>;
}

// @ts-ignore
export const MethodContext = createContext<IMethodContext>({});
