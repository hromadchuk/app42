import { MutableRefObject, useEffect, useRef, useState } from 'react';

interface IntersectionOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
}

export function useIntersection(
    options: IntersectionOptions = {}
): [MutableRefObject<null | HTMLElement>, IntersectionObserverEntry | null] {
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<null | HTMLElement>(null);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(([newEntry]) => setEntry(newEntry), options);

        const { current: currentObserver } = observerRef;
        const { current: currentElement } = elementRef;

        if (currentElement) {
            currentObserver.observe(currentElement);
        }

        return () => {
            if (currentObserver) {
                currentObserver.disconnect();
            }
        };
    }, [options]);

    return [elementRef, entry];
}
