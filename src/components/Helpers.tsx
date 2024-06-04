import { ReactElement } from 'react';

export function Padding({ children }: { children: ReactElement | ReactElement[] }) {
    return <div style={{ padding: 10 }}>{children}</div>;
}
