import { createContext } from 'react';
import { Api } from 'telegram';

export interface IAppContext {
    user: null | Api.User;
    setUser: (user: null | Api.User) => void;
}

// @ts-ignore
export const AppContext = createContext<IAppContext>({});
