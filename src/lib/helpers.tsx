import { notifications } from '@mantine/notifications';
import { Api } from 'telegram';
import { getAppLangCode, LangType, t, td } from './lang';

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
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function getTime(time: number): ITime {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor(((time % 86400) % 3600) / 60);
    const seconds = Math.floor(((time % 86400) % 3600) % 60);

    return {
        days,
        hours,
        minutes,
        seconds
    };
}

export function getTextTime(seconds: number): string {
    const period = getTime(seconds);
    const result: string[] = [];

    if (period.days) {
        result.push(`${period.days} ${decline(period.days, td('common.time.days'))}`);
    }

    if (period.hours) {
        result.push(`${period.hours} ${decline(period.hours, td('common.time.hours'))}`);
    }

    if (period.minutes) {
        result.push(`${period.minutes} ${decline(period.minutes, td('common.time.minutes'))}`);
    }

    if (period.seconds) {
        result.push(`${period.seconds} ${decline(period.seconds, td('common.time.seconds'))}`);
    }

    return result.join(' ');
}

function getErrorText(text: string): string {
    const parseRateLimit = text.match(/A wait of (\d+) seconds is required \(caused by [\w.]+\)/);
    if (parseRateLimit) {
        const seconds = Number(parseRateLimit[1]);

        return t('common.errors.api_rate_limit').replace('{time}', getTextTime(seconds));
    }

    return text;
}

export async function CallAPI<R extends Api.AnyRequest>(request: R): Promise<R['__response']> {
    const method = request.className;

    console.group(`API ${method}`);
    console.log('Request:', request);

    try {
        const result = await window.TelegramClient.invoke(request);

        console.log('Result:', result);
        console.groupEnd();

        return result;
    } catch (error) {
        console.error('Error:', error);
        console.groupEnd();

        notifyError({
            title: `API.${method} error`,
            // @ts-ignore
            message: getErrorText(error?.message as string)
        });

        throw error;
    }
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
