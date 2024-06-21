import { Buffer } from 'buffer';
import { AES, enc } from 'crypto-js';
import { createElement } from 'react';
import { HttpClient, Api as TonApiSDK } from 'tonapi-sdk-js';
import { Api } from 'telegram';
import { Spinner } from '@telegram-apps/telegram-ui';
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import { FloodWaitError } from 'telegram/errors';
import { AbortRequestError } from '../errors/AbortRequestError.ts';
import { getCache, setCache } from './cache.ts';
import { getAppLangCode, LangType, t, td } from './lang';
import { ServerMock } from './mock.ts';
import { ISnackbarOptions } from '../contexts/AppContext.tsx';

export type TOwnerInfo = null | Api.TypeUser | Api.TypeChat;
type TDocumentThumb = Api.TypeDocument | Api.TypePhoto | Api.UserProfilePhoto | Api.ChatPhoto | undefined;

export const TonApi = new TonApiSDK(
    new HttpClient({
        baseUrl: 'https://tonapi.io/',
        baseApiParams: {
            headers: {
                Authorization: 'Bearer AGGHQSHTE46RAWAAAAAKDQJHVP3ZWTD7VWS2TQK72GTO6DBKO42J2BGIQYDRAZBK2BYLTMI',
                'Content-type': 'application/json'
            }
        }
    })
);

interface IUser {
    added_to_attachment_menu: boolean;
    allows_write_to_pm: boolean;
    first_name: string;
    id: number;
    language_code: string;
    last_name: string;
    photo_url: string;
    username: string;
}

export type TOwnerType = Api.User | Api.Chat | Api.Channel;

export function getParams() {
    return new URLSearchParams(location.hash.slice(1));
}

export function getUserData() {
    try {
        const authData = getParams().get('tgWebAppData');
        if (authData) {
            const params = new URLSearchParams(authData);

            return JSON.parse(params.get('user') as string) as IUser;
        }
    } catch (error) {
        console.error('getUserData error', error);
    }

    return null;
}

export function getUserId() {
    try {
        const user = getUserData();

        if (user) {
            return user.id;
        }
    } catch (error) {
        console.error('getUserId error', error);
    }

    return 0;
}

export const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const isDevUser = [
    44221708, // Pavlo Hro
    5000925865, // Test env account
    1345025252 // Vova
].includes(getUserId());

export function formatNumber(number: number): string {
    return `${number}`.replace(/(\d)(?=(\d{3})+$)/g, '$1\u00a0');
}

export function formatNumberFloat(number: number): string {
    const [int, float] = `${number}`.split('.');
    const slicedFloat = float?.slice(0, 2);
    const suffix = !Number(slicedFloat) ? '' : `.${slicedFloat}`;

    return formatNumber(parseInt(int)) + suffix;
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

export function getDocumentThumb(document: TDocumentThumb) {
    let data;

    if (document instanceof Api.Document && document?.thumbs) {
        data = getThumbStrippedSize(document.thumbs)?.bytes;
    } else if (document instanceof Api.Photo && document.fileReference) {
        data = getThumbStrippedSize(document.sizes)?.bytes;
    } else if (document instanceof Api.UserProfilePhoto || document instanceof Api.ChatPhoto) {
        data = document.strippedThumb;
    }

    if (!data) {
        return undefined;
    }

    const header = Buffer.from(
        // eslint-disable-next-line max-len
        'ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e19282321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a0aadaad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2d2d3c353c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc00011080000000003012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00',
        'hex'
    );
    const footer = Buffer.from('\xff\xd9', 'ascii');

    header[164] = data[1];
    header[166] = data[2];
    const thumbImage = Buffer.concat([header.subarray(0, header.length - 1), data.subarray(2), footer]);

    const imageCode = Buffer.from(thumbImage).toString('base64');
    if (imageCode) {
        return `data:image/jpeg;base64,${imageCode}`;
    }

    return undefined;
}

function getThumbStrippedSize(thumbs: Api.TypePhotoSize[]): Api.PhotoStrippedSize | undefined {
    return thumbs.find((thumb) => thumb instanceof Api.PhotoStrippedSize) as Api.PhotoStrippedSize | undefined;
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
    const months = Math.floor((time % 31557600) / 2629800);
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

export function getShortTextTime(time: number, size: number): string {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor(((time % 86400) % 3600) / 60);
    const seconds = Math.floor(((time % 86400) % 3600) % 60);
    const result: string[] = [];

    if (days) {
        result.push(`${days}${t('common.time_short.days')}`);
    }

    if (hours && result.length < size) {
        result.push(`${hours}${t('common.time_short.hours')}`);
    }

    if (minutes && result.length < size) {
        result.push(`${minutes}${t('common.time_short.minutes')}`);
    }

    if (seconds && result.length < size) {
        result.push(`${seconds}${t('common.time_short.seconds')}`);
    }

    return result.join(' ');
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

    const methodsWithoutWait = ['help.GetNearestDc', 'help.GetCountriesList', 'users.GetUsers'];
    if (!methodsWithoutWait.includes(method)) {
        await sleep(100);
    }

    if (!window.TelegramClient.connected) {
        await window.TelegramClient.connect();
    }

    try {
        if (window.isNeedToThrowErrorOnRequest) {
            window.isNeedToThrowErrorOnRequest = false;

            throw new AbortRequestError();
        }

        const result = await window.TelegramClient.invoke(request);

        console.group(`API.${method}`);
        console.log('Request:', request);
        console.log('Result:', result);
        console.groupEnd();

        return result;
    } catch (error: unknown) {
        console.group(`API.${method}`);
        console.log('Request:', request);
        console.error('Error:', error);
        console.groupEnd();

        if (error instanceof FloodWaitError && error.seconds < 60) {
            return await handleFloodWaitError(error, request, options);
        }

        if (!options?.hideErrorAlert && !(error instanceof AbortRequestError)) {
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

    const snackbarParams: ISnackbarOptions = {
        title: t('common.errors.api_error'),
        message: getFloodWaitErrorMessage(totalWaitSeconds),
        icon: createElement(Spinner, { size: 's' }),
        type: 'loading',
        duration: 1e9
    };

    window.showSnackbar(snackbarParams);

    let secondsToRetry = totalWaitSeconds;
    const updatedInterval = setInterval(() => {
        secondsToRetry -= 1;
        if (secondsToRetry <= 0) {
            window.hideSnackbar();
            clearInterval(updatedInterval);
        } else {
            window.showSnackbar({
                ...snackbarParams,
                message: getFloodWaitErrorMessage(secondsToRetry)
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

export function notifySuccess({ title, message }: { title: string; message: string }) {
    window.showSnackbar({
        title,
        message,
        type: 'success',
        icon: createElement(IconCircleCheck, { size: 24, stroke: 1.2, color: 'var(--tgui--green)' }),
        duration: 3000
    });
}

export function notifyError({ title, message }: { title?: string; message: string }) {
    window.showSnackbar({
        title,
        message,
        type: 'error',
        icon: createElement(IconExclamationCircle, {
            size: 24,
            stroke: 1.2,
            color: 'var(--tg-theme-destructive-text-color)'
        }),
        duration: 30000
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

const apiEndpoint = location.hostname === 'app42.app' ? 'https://app42.app' : `http://${location.hostname}`;

export async function Server<T>(method: string, params: object = {}): Promise<T> {
    if (isDev) {
        console.log('skip Server', method, params);
        return ServerMock<T>(method);
    }

    const authData = getParams().get('tgWebAppData');
    if (!authData) {
        console.log('No auth data');
        return {} as T;
    }

    const noobBody = encodeString(JSON.stringify(params), `noobHook${getUserId()}`);
    const data = await fetch(`${apiEndpoint}/api/${method}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authData
        },
        body: JSON.stringify({ nb: noobBody })
    }).then((response) => response.json());

    console.group(`SERVER /${method}`);
    console.log('Request:', params);
    console.log('Result:', data);
    console.groupEnd();

    return data as T;
}

export async function getAvatar(owner: Api.User | Api.Channel | Api.Chat): Promise<string | null> {
    const userPhoto = owner.photo as Api.UserProfilePhoto;
    const cacheKey = `owner-avatar-${userPhoto?.photoId}`;
    const cache = await getCache(cacheKey);
    if (cache) {
        return cache as string;
    }

    const buffer = await window.TelegramClient.downloadProfilePhoto(owner.id);

    return await getImageStringFromBuffer(buffer, cacheKey);
}

export async function getAvatars(owners: (Api.User | Api.Channel | Api.Chat)[]) {
    const result = new Map<number, string | null>();

    const avatars = await Promise.all(
        owners.map(async (owner) => ({
            id: owner.id.valueOf(),
            avatar: await getAvatar(owner)
        }))
    );

    for (const { id, avatar } of avatars) {
        result.set(id, avatar);
    }

    return result;
}

export async function getMediaPhoto(photo: Api.TypePhoto): Promise<string | null> {
    const cacheKey = `media-photo-${photo.id}`;
    const cache = await getCache(cacheKey);
    if (cache) {
        return cache as string;
    }

    const buffer = await window.TelegramClient.downloadMedia(photo as unknown as Api.TypeMessageMedia);

    return await getImageStringFromBuffer(buffer, cacheKey);
}

export async function getMediaVideoPreview(video: Api.Document): Promise<string | null> {
    const cacheKey = `media-video-preview-${video.id}`;
    const cache = await getCache(cacheKey);
    if (cache) {
        return cache as string;
    }

    const videoThumbsLength = video.thumbs?.length || 0;
    if (videoThumbsLength <= 0) {
        return null;
    }

    const buffer = await window.TelegramClient.downloadMedia(video as unknown as Api.TypeMessageMedia, {
        thumb: videoThumbsLength - 1
    });

    return await getImageStringFromBuffer(buffer, cacheKey);
}

async function getImageStringFromBuffer(
    buffer: string | ArrayBuffer | undefined,
    cacheKey: string
): Promise<null | string> {
    // @ts-ignore
    const imageCode = Buffer.from(buffer).toString('base64');
    if (imageCode) {
        const imageBase64 = `data:image/jpeg;base64,${imageCode}`;

        await setCache(cacheKey, imageBase64, 30);

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

export function getPeerId(peer: Api.TypePeer) {
    if (peer instanceof Api.PeerUser) {
        return peer.userId.valueOf();
    } else if (peer instanceof Api.PeerChat) {
        return peer.chatId.valueOf();
    }

    return peer.channelId.valueOf();
}

export async function getCurrentUser(): Promise<Api.User | null> {
    try {
        const [user] = (await CallAPI(
            new Api.users.GetUsers({
                id: [new Api.InputUserSelf()]
            }),
            { hideErrorAlert: true }
        )) as Api.User[];

        return user;
    } catch (error) {
        console.error('getCurrentUser error', error?.toString());
    }

    return null;
}

export function encodeString(string: string, key: string) {
    return AES.encrypt(string, key).toString();
}

export function decodeString(encodedString: string, key: string) {
    try {
        return AES.decrypt(encodedString, key).toString(enc.Utf8);
    } catch (error) {
        console.error('decodeString error', error);
    }

    return '';
}

export async function wrapCallMAMethod<T>(func: Function) {
    try {
        return (await func()) as T;
    } catch (error) {
        console.log('wrapCallMAMethod error', error?.toString());
    }

    return null;
}

export function rgbToHex(nr: number, ng: number, nb: number): string {
    return '#' + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
}

export function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateColorGradation(hex: string, steps: number): string[] {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const gradation: string[] = [];

    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const newR = Math.round(r + (255 - r) * ratio);
        const newG = Math.round(g + (255 - g) * ratio);
        const newB = Math.round(b + (255 - b) * ratio);

        gradation.unshift(rgbToHex(newR, newG, newB));
    }

    return gradation;
}

export function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}
