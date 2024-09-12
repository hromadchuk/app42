import { Placeholder, Spinner } from '@telegram-apps/telegram-ui';

export function SuspenseLoader() {
    return (
        <Placeholder style={{ height: 'calc(60vh)' }}>
            <Spinner size="m" />
        </Placeholder>
    );
}
