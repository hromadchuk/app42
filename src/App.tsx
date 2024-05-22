import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useBackButton, useLaunchParams, useMiniApp } from '@tma.js/sdk-react';
import { Api } from 'telegram';
import { wrapCall } from './lib/helpers.ts';
import { IRouter, routes } from './routes.tsx';

import { AppContext } from './contexts/AppContext.tsx';

export function App() {
    const [user, setUser] = useState<null | Api.User>(null);

    const miniApp = useMiniApp();
    const backButton = useBackButton();
    const navigate = useNavigate();
    const currentLocation = useLocation();
    const launchParams = useLaunchParams();

    const GetRouter = ({ path, element }: IRouter) => <Route key={path} path={path} element={element} />;

    useEffect(() => {
        const MALib = getComputedStyle(document.querySelector('#root > div') as Element);
        const body = document.body.style;

        const backgroundColor = MALib.getPropertyValue('--tgui--secondary_bg_color');
        const textColor = MALib.getPropertyValue('--tgui--text_color');

        body.setProperty('--app-background-color', backgroundColor);
        body.setProperty('--app-text-color', textColor);

        backButton.on('click', () => {
            navigate('/');
        });
    }, []);

    useEffect(() => {
        if (['/'].includes(currentLocation.pathname)) {
            wrapCall(() => backButton.hide());
            wrapCall(() => {
                miniApp.setHeaderColor(launchParams.themeParams.headerBackgroundColor as `#${string}`);
            });
        } else {
            wrapCall(() => backButton.show());
        }
    }, [currentLocation]);

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
