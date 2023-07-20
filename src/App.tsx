import { useEffect, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { AppContext } from './components/AppContext.tsx';
import { clearOldCache } from './lib/cache.tsx';
import { IRouter, routers } from './routes.tsx';

import { AppHeader } from './components/AppHeader.tsx';
import { AppFooter } from './components/AppFooter.tsx';

import './App.css';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        userId: number;
    }
}

const App = () => {
    const [user, setUser] = useState<null | Api.User>(null);

    useEffect(() => {
        clearOldCache();
    }, []);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    return (
        <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: useColorScheme() }}>
            <AppContext.Provider value={{ user, setUser }}>
                <HashRouter>
                    <AppHeader user={user} />
                    <Routes>{routers.map(GetRouter)}</Routes>
                    <AppFooter />
                </HashRouter>
            </AppContext.Provider>
        </MantineProvider>
    );
};

export default App;
