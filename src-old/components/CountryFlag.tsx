import { useEffect, useState } from 'react';
import { Image, Skeleton } from '@mantine/core';

interface ICountryFlag {
    code: string;
    size: number;
}

export function CountryFlag({ code, size }: ICountryFlag) {
    const [imageUrl, setImageUrl] = useState<string>('');

    const defaultSize = 48;
    const defaultMargin = 8;
    const margin = Math.round((size * defaultMargin) / defaultSize);

    useEffect(() => {
        setImageUrl('');

        (async () => {
            try {
                const flag = await import(`../assets/flags/${code}.svg`);

                setImageUrl(flag.default);
            } catch (error) {
                // @ts-ignore
                const UNFlag = await import('../assets/flags/UN.svg');

                setImageUrl(UNFlag.default);
            }
        })();
    }, [code]);

    if (!imageUrl) {
        return <Skeleton h={size - margin * 2} w={size} mt={margin} mb={margin} radius={0} />;
    }

    return <Image src={imageUrl} alt={code} h={size} w="auto" radius={0} />;
}
