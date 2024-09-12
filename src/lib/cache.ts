import { App42Database, CacheDataType, ICacheData } from './database.ts';
import { Constants } from '../constants.ts';
import { getUserId } from './utils.ts';

const db = new App42Database();

function getPrefix(key: string): string {
    if ([Constants.AUTH_STATE_NUMBER_KEY, Constants.AUTH_STATE_METHOD_KEY].includes(key)) {
        return key;
    }

    return `${getUserId()}:${key}`;
}

function getCurrentTimestamp(): number {
    const millis = Date.now();

    return Math.floor(millis / 1000);
}

export async function removeCache(key: string): Promise<void> {
    await db.cache.delete(getPrefix(key));
}

export async function setCache(key: string, data: CacheDataType, minutes: number): Promise<void> {
    const timestamp = getCurrentTimestamp();

    try {
        const verify = JSON.parse(JSON.stringify(data));

        if (Object.keys(verify).length !== 0) {
            const seconds = minutes * 60;
            const endTime = seconds + timestamp;

            const content: ICacheData = {
                key: getPrefix(key),
                timestamp: endTime,
                data
            };

            await db.cache.put(content);
        }
    } catch (error) {
        console.error('Cache — error', error);
    }
}

export async function getCache(key: string): Promise<CacheDataType> {
    const cache = await db.cache.get(getPrefix(key));

    if (cache) {
        try {
            if (cache.timestamp > getCurrentTimestamp()) {
                console.debug('Cache.ok — data', key);

                return cache.data;
            }
        } catch (error) {
            console.debug('Cache — error', error);
        }
    }

    return null;
}

export async function getCacheWithCallback(
    key: string,
    callback: () => Promise<CacheDataType>,
    minutes: number
): Promise<CacheDataType> {
    const cache = await getCache(key);

    if (cache) {
        return cache;
    }

    const data = await callback();

    await setCache(key, data, minutes);

    return data;
}

export async function clearOldCache(): Promise<void> {
    const rows = await db.cache.toArray();

    for (const row of rows) {
        if (row.timestamp < getCurrentTimestamp()) {
            await db.cache.delete(row.key);
        }
    }
}
