import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Api } from 'telegram';
import { IRouter, routes } from './routes.tsx';

import { AppContext, IInitData } from './contexts/AppContext.tsx';

export function App() {
    const [user, setUser] = useState<null | Api.User>(null);

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    useEffect(() => {
        const MALib = getComputedStyle(document.querySelector('#root > div') as Element);
        const body = document.body.style;

        const backgroundColor = MALib.getPropertyValue('--tgui--secondary_bg_color');
        const textColor = MALib.getPropertyValue('--tgui--text_color');

        body.setProperty('--app-background-color', backgroundColor);
        body.setProperty('--app-text-color', textColor);
    }, []);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                // initData,
                // setInitData,
                // isAppLoading,
                // setAppLoading,
                // markOnboardingAsCompleted,
                // checkIsOnboardingCompleted
            }}
        >
            <Routes>{routes.map(GetRouter)}</Routes>
        </AppContext.Provider>
    );
}
