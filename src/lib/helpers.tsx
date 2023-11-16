import { Buffer } from 'buffer';
import { notifications } from '@mantine/notifications';
import { Api } from 'telegram';
import { getCache, setCache } from './cache.tsx';
import { getHideUser, isHideMode } from './hide.tsx';
import { getAppLangCode, LangType, t, td } from './lang';
import { FloodWaitError } from 'telegram/errors';

export const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export function formatNumber(number: number): string {
    return `${number}`.replace(/(\d)(?=(\d{3})+$)/g, '$1\u00a0');
}

export function decline(number: number, titles: string[]): string {
    const langCode = getAppLangCode();

    if (langCode === LangType.EN) {
        if (number === 1) {
            return titles[0];
        }

        return titles[1];
    }

    // for cyrillic
    const cases = [2, 0, 1, 1, 1, 2];

    let titleIndex = 2;
    if (number % 100 > 4 && number % 100 < 20) {
        titleIndex = 2;
    } else if (number % 10 < 5) {
        titleIndex = cases[number % 10];
    }

    return titles[titleIndex];
}

export function declineAndFormat(number: number, titles: string[]): string {
    return `${formatNumber(number)} ${decline(number, titles)}`;
}

export function getPercent(count: number, total: number): number {
    if (count >= total) {
        return 100;
    }

    return Math.floor((100 * count) / total);
}

export async function sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export interface ITime {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function getTime(time: number): ITime {
    const years = Math.floor(time / 31557600); // 365.25 days per year
    const months = Math.floor((time % 31557600) / 2629800); // Average month length in seconds
    const days = Math.floor((time % 2629800) / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor(((time % 86400) % 3600) / 60);
    const seconds = Math.floor(((time % 86400) % 3600) % 60);

    return {
        years,
        months,
        days,
        hours,
        minutes,
        seconds
    };
}

export function getTextTime(seconds: number, isStrong?: boolean): string {
    return getStringsTimeArray(seconds, isStrong).join(' ');
}

export function getStringsTimeArray(seconds: number, isStrong?: boolean): string[] {
    const period = getTime(seconds);
    const result: string[] = [];

    if (period.years) {
        result.push(`${period.years} ${decline(period.years, td('common.time.years'))}`);
    }

    if (period.months) {
        result.push(`${period.months} ${decline(period.months, td('common.time.months'))}`);
    }

    if (period.days) {
        result.push(`${period.days} ${decline(period.days, td('common.time.days'))}`);
    }

    if (!isStrong) {
        if (period.hours) {
            result.push(`${period.hours} ${decline(period.hours, td('common.time.hours'))}`);
        }

        if (period.minutes) {
            result.push(`${period.minutes} ${decline(period.minutes, td('common.time.minutes'))}`);
        }

        if (period.seconds) {
            result.push(`${period.seconds} ${decline(period.seconds, td('common.time.seconds'))}`);
        }
    }

    return result;
}

function getErrorMessage(error: Error): string {
    if (error instanceof FloodWaitError) {
        return getFloodWaitErrorMessage(error.seconds);
    }

    return error?.message;
}

interface ICallApiOptions {
    hideErrorAlert?: boolean;
}

export async function CallAPI<R extends Api.AnyRequest>(
    request: R,
    options?: ICallApiOptions
): Promise<R['__response']> {
    const method = request.className;

    await sleep(100);

    try {
        const result = await window.TelegramClient.invoke(request);

        console.group(`API.${method}`);
        console.log('Request:', request);
        console.log('Result:', result);
        console.groupEnd();

        if (isHideMode && Object.prototype.hasOwnProperty.call(result, 'users')) {
            // @ts-ignore super cringe code
            for (const user of result.users) {
                if (user instanceof Api.User) {
                    const hideUser = await getHideUser(user.id.valueOf());

                    const [firstName, lastName] = (hideUser.name as string).split(' ');

                    user.firstName = firstName;
                    user.lastName = lastName || '';
                }
            }
        }

        return result;
    } catch (error: unknown) {
        console.group(`API.${method}`);
        console.log('Request:', request);
        console.error('Error:', error);
        console.groupEnd();

        if (error instanceof FloodWaitError && error.seconds < 60) {
            return await handleFloodWaitError(error, request, options);
        }

        if (!options?.hideErrorAlert) {
            notifyError({
                title: `API.${method} error`,
                message: getErrorMessage(error as Error)
            });
        }

        throw error;
    }
}

function getFloodWaitErrorMessage(seconds: number): string {
    return t('common.errors.api_rate_limit').replace('{time}', getTextTime(seconds));
}

async function handleFloodWaitError(error: FloodWaitError, request: Api.AnyRequest, options?: ICallApiOptions) {
    const totalWaitSeconds = error.seconds + 1; // +1 for safety

    const id = notifications.show({
        loading: true,
        message: getFloodWaitErrorMessage(totalWaitSeconds),
        autoClose: false,
        withCloseButton: false
    });

    let secondsToRetry = totalWaitSeconds;
    const updatedInterval = setInterval(() => {
        secondsToRetry -= 1;
        if (secondsToRetry <= 0) {
            notifications.hide(id);
            clearInterval(updatedInterval);
        } else {
            notifications.update({
                id,
                message: getFloodWaitErrorMessage(secondsToRetry),
                loading: true
            });
        }
    }, 1000);

    await sleep(secondsToRetry * 1000);

    return CallAPI(request, options);
}

export function classNames(...classes: (string | object)[]): string {
    const list: string[] = [];

    for (const name of classes) {
        if (typeof name === 'string') {
            list.push(name);
        } else {
            for (const [key, value] of Object.entries(name)) {
                if (value) {
                    list.push(key);
                }
            }
        }
    }

    return list.join(' ');
}

export function notifyError({ title, message }: { title?: string; message?: string } = {}) {
    notifications.show({
        color: 'red',
        title,
        message,
        autoClose: false
    });
}

export function getDocLink(path: string): string {
    return `https://wiki.kit42.app/v/${getAppLangCode()}/${path}`;
}

export async function parallelLimit(limit: number, tasks: Function[]): Promise<void> {
    const copyTasks = tasks.slice(0);

    const runTask = async () => {
        if (!copyTasks.length) {
            return;
        }

        const task = copyTasks.shift() as Function;

        await task();
        await runTask();
    };

    const promises = [];

    for (let i = 0; i < limit; i++) {
        promises.push(runTask());
    }

    await Promise.all(promises);
}

const apiEndpoint =
    location.hostname === 'gromadchuk.github.io' ? 'https://kit42.gromadchuk.com' : `http://${location.hostname}`;

export async function Server(method: string, params: object = {}): Promise<object> {
    console.group(`SERVER /${method}`);
    console.log('Request:', params);

    if (!window.authData) {
        console.log('No auth data');
    }

    if (isDev) {
        console.log('Dev mode, skip request');
        console.groupEnd();
    } else {
        const data = await fetch(`${apiEndpoint}/api/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authData: window.authData
            },
            body: JSON.stringify(params)
        }).then((response) => response.json());

        console.log('Result:', data);
        console.groupEnd();

        return data as object;
    }

    return {};
}

export async function getAvatar(owner: Api.User | Api.Channel | Api.Chat): Promise<string | null> {
    if (isHideMode) {
        const hideUser = await getHideUser(owner.id.valueOf());
        if (hideUser.photo) {
            return hideUser.photo;
        }
    }

    const userPhoto = owner.photo as Api.UserProfilePhoto;
    const cacheKey = `owner-avatar-${userPhoto?.photoId}`;
    const cache = getCache(cacheKey);
    if (cache) {
        return cache as string;
    }

    const buffer = await window.TelegramClient.downloadProfilePhoto(owner.id);
    // @ts-ignore
    const imageCode = Buffer.from(buffer).toString('base64');
    if (imageCode) {
        const imageBase64 = `data:image/jpeg;base64,${imageCode}`;

        setCache(cacheKey, imageBase64, 30);

        return imageBase64;
    }

    return null;
}

export function dataUrlToFile(dataUrl: string, fileName: string) {
    const [mimePart, base64Data] = dataUrl.split(',');
    const mime = (mimePart.match(/:(.*?);/) as string[])[1];

    const binaryString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return new File([uint8Array], fileName, { type: mime });
}
