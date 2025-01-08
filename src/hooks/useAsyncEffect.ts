import { DependencyList, useEffect } from 'react';

export function useAsyncEffect(effect: () => Promise<void>, dependencies?: DependencyList) {
    useEffect(() => {
        const asyncEffect = async () => {
            try {
                await effect();
            } catch (error) {
                console.error('useAsyncEffect error:', error);
            }
        };

        asyncEffect();
    }, dependencies || []);
}
