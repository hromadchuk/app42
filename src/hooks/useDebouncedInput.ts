import { ChangeEvent, useEffect, useState } from 'react';

export function useDebouncedInput(initialValue: string, delay: number) {
    const [value, setValue] = useState<string>(initialValue);
    const [debouncedValue, setDebouncedValue] = useState<string>(initialValue);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue, handleChange, value] as const;
}
