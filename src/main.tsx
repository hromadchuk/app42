import { Suspense } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { SDKProvider } from '@telegram-apps/sdk-react';
import { TelegramClient } from 'telegram';
import { createRoot } from 'react-dom/client';
import { SuspenseLoader } from './components/SuspenseLoader.tsx';
import { ISnackbarOptions } from './contexts/AppContext.tsx';
import { ServerResponses } from './interfaces/server.ts';
import { getUserData, initDevEnv, isDevUser } from './lib/utils.ts';
import { MiniAppWrapper } from './MiniAppWrapper.tsx';

declare global {
    interface Window {
        TelegramClient: TelegramClient;
        listenEvents: { [key: string]: (event: object) => void };
        isProgress: boolean;
        isNeedToThrowErrorOnRequest: boolean;
        alreadyVisitedRefLink: boolean;
        showSnackbar: (options: ISnackbarOptions) => void;
        hideSnackbar: () => void;
        eruda: { init: () => void };
        initData: ServerResponses['init'];
    }
}

initDevEnv();

if (isDevUser()) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    document.body.append(script);
    script.onload = () => {
        window.eruda.init();
    };
}

import '@telegram-apps/telegram-ui/dist/styles.css';
import './App.css';

const userData = getUserData();
if (userData) {
    createRoot(document.getElementById('root') as HTMLElement).render(
        <AppRoot>
            <SDKProvider acceptCustomStyles>
                <Suspense fallback={<SuspenseLoader />}>
                    <MiniAppWrapper />
                </Suspense>
            </SDKProvider>
        </AppRoot>
    );
} else {
    window.location.href = 'https://t.me/app42/app';
}
