import { createContext } from 'react';
import { Api } from 'telegram';
import { IShareOptions } from '../modals/ShareModal.tsx';
import { IMethod, MethodCategory } from '../routes.tsx';

export interface ISnackbarOptions {
    title?: string;
    message: string;
    icon: JSX.Element;
    duration: number;
    type: 'success' | 'error' | 'loading';
}

export interface IAppContext {
    user: Api.User | null;
    setUser: (user: Api.User | null) => void;
    isUserChecked: boolean;
    openMethod: (method: IMethod, categoryId?: MethodCategory) => void;
    setAccountsModalOpen: (state: boolean) => void;
    showShareModal: (options: IShareOptions) => void;
    markOnboardingAsCompleted(): Promise<void>;
    checkIsOnboardingCompleted(): Promise<boolean>;
}

// @ts-ignore
export const AppContext = createContext<IAppContext>({});
