import { PropsWithChildren } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { SDKProvider, useSDKContext } from '@tma.js/sdk-react';
import { AppRoot, Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import { MemoryRouter } from 'react-router-dom';
import { TonApiCall } from './lib/TonApi.ts';
import { App } from './App.tsx';

function MiniAppLoader({ children }: PropsWithChildren) {
    const { loading, initResult, error } = useSDKContext();

    if (!loading && !error && !initResult) {
        return <Placeholder description={'SDK init function is not yet called.'} />;
    }

    if (error) {
        return <Placeholder description={error instanceof Error ? error.message : JSON.stringify(error)} />;
    }

    if (loading) {
        return (
            <Placeholder>
                <Spinner size="m" />
            </Placeholder>
        );
    }

    return <>{children}</>;
}

export function MiniAppWrapper() {
    return (
        <SDKProvider options={{ acceptCustomStyles: true, cssVars: true, complete: true }}>
            <TonConnectUIProvider manifestUrl={TonApiCall.manifestUrl}>
                <AppRoot>
                    <MiniAppLoader>
                        <MemoryRouter>
                            <App />
                        </MemoryRouter>
                    </MiniAppLoader>
                </AppRoot>
            </TonConnectUIProvider>
        </SDKProvider>
    );
}
