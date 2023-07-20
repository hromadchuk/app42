import { Constants } from '../constants.tsx';

type CacheDataType = null | number | string | Object;

const getPrefix = (key: string): string => {
    return `${Constants.CACHE_PREFIX}:${window.userId}:${key}`;
};

const getCurrentTimestamp = (): number => {
    const millis = Date.now();

    return Math.floor(millis / 1000);
};

export const removeCache = (key: string): void => {
    localStorage.removeItem(getPrefix(key));
};

export const setCache = (key: string, data: CacheDataType, minutes: number): void => {
    const timestamp = getCurrentTimestamp();

    try {
        const verify = JSON.parse(JSON.stringify(data));

        if (Object.keys(verify).length !== 0) {
            const seconds = minutes * 60;
            const endTime = seconds + timestamp;

            localStorage.setItem(
                getPrefix(key),
                JSON.stringify({
                    timestamp: endTime,
                    data
                })
            );
        }
    } catch (error) {
        console.error('Cache — error', error);
    }
};

export const getCache = (key: string): CacheDataType => {
    const cache = localStorage.getItem(getPrefix(key));

    console.debug('Cache — getOnlyCache', key, Boolean(cache));

    if (cache) {
        try {
            const json = JSON.parse(cache);

            if (json.timestamp > getCurrentTimestamp()) {
                console.debug('Cache.ok — data', key);

                return json.data;
            }
        } catch (error) {
            console.debug('Cache — error', error);
        }
    }

    return null;
};

export const getCacheWithCallback = async (
    key: string,
    callback: () => CacheDataType,
    minutes: number
): Promise<CacheDataType> => {
    const cache = getCache(key);

    if (cache) {
        return cache;
    }

    const data = await callback();

    setCache(key, data, minutes);

    return data;
};

export const clearOldCache = (): void => {
    Object.keys(localStorage).forEach((key: string) => {
        if (!key.startsWith(Constants.CACHE_PREFIX)) {
            return;
        }

        const cacheData = localStorage.getItem(key);
        if (!cacheData) {
            return;
        }

        try {
            const json = JSON.parse(cacheData);

            if (json.timestamp < getCurrentTimestamp()) {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Cache — error', error);
        }
    });
};
