import { useState } from 'react';
import { Skeleton } from '@telegram-apps/telegram-ui';
import { useAsyncEffect } from '../hooks/useAsyncEffect.ts';

interface ICountryFlag {
    code: string;
    size: number;
}

export function CountryFlag({ code, size }: ICountryFlag) {
    const [imageUrl, setImageUrl] = useState<string>('');

    const aspectRatio = 32 / 48;
    const skeletonHeight = size * aspectRatio;

    useAsyncEffect(async () => {
        setImageUrl('');

        try {
            const flag = await import(`../assets/flags/${code}.svg`);

            setImageUrl(flag.default);
        } catch (error) {
            const UNFlag = await import('../assets/flags/UN.svg');

            setImageUrl(UNFlag.default);
        }
    }, [code]);

    return (
        <Skeleton
            visible={!imageUrl}
            style={{
                height: imageUrl ? size : skeletonHeight,
                width: size
            }}
        >
            {Boolean(imageUrl) && (
                <img
                    style={{
                        height: size,
                        width: size
                    }}
                    src={imageUrl}
                    alt={code}
                />
            )}
        </Skeleton>
    );
}
