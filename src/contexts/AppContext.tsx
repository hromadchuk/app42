import { createContext } from 'react';
import { Api } from 'telegram';

export interface IInitData {
    topMethods: string[];
    storageHash: string;
}

export interface IAppContext {
    user: Api.User | null;
    setUser: (user: Api.User | null) => void;
    initData: IInitData | null;
    setInitData: (user: IInitData | null) => void;
    isAppLoading: boolean;
    setAppLoading: (state: boolean) => void;
    markOnboardingAsCompleted(): Promise<void>;
    checkIsOnboardingCompleted(): Promise<boolean>;
}

// @ts-ignore
export const AppContext = createContext<IAppContext>({});
