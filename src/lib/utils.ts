import { AES, enc } from 'crypto-js';
import { ServerMock } from './mock.ts';
import { mockTelegramEnv, parseInitData, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { ServerMethods, ServerRequests, ServerResponses } from '../interfaces/server.ts';

export const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export function isDevUser() {
    return [
        44221708, // Pavlo Hro
        5000925865, // Test env account
        1345025252, // Vova
        487641753, // Oksana
        240746628 // Ksenia
    ].includes(getUserId());
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

export function getParams() {
    return retrieveLaunchParams();
}

export function getUserData() {
    try {
        const authData = getParams().initData;
        if (authData?.user) {
            return authData.user;
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

export function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export async function wrapCallMAMethod<T>(func: Function) {
    try {
        return (await func()) as T;
    } catch (error) {
        console.log('wrapCallMAMethod error', error?.toString());
    }

    return null;
}

export async function Server<METHOD extends ServerMethods>(
    method: METHOD,
    params: ServerRequests[METHOD]
): Promise<ServerResponses[METHOD]> {
    if (isDev) {
        const mockData = ServerMock<METHOD>(method);

        console.log('skip Server', method, params);
        console.log('mockData', mockData);

        return mockData as ServerResponses[METHOD];
    }

    const authData = getParams().initDataRaw;
    if (!authData) {
        console.log('No auth data');
        return {} as ServerResponses[METHOD];
    }

    const noobBody = encodeString(JSON.stringify(params), `noobHook${getUserId()}`);
    const data = await fetch(`https://tool42.pav.la/app42/api/${method}`, {
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

    return data as ServerResponses[METHOD];
}

export function initDevEnv() {
    if (isDev) {
        const initDataRaw = new URLSearchParams([
            [
                'user',
                JSON.stringify({
                    id: 5000925865,
                    first_name: 'Local',
                    last_name: 'Dev',
                    username: 'app42dev',
                    language_code: 'en',
                    is_premium: true,
                    allows_write_to_pm: true
                })
            ],
            ['hash', '89d6079ad6762351f38c6dbbc41bb53048019256a9443988af7a48bcad16ba31'],
            ['auth_date', String(Number(new Date()))],
            ['start_param', 'debug']
        ]).toString();

        mockTelegramEnv({
            themeParams: {
                accentTextColor: '#6ab2f2',
                bgColor: '#17212b',
                buttonColor: '#5288c1',
                buttonTextColor: '#ffffff',
                destructiveTextColor: '#ec3942',
                headerBgColor: '#17212b',
                hintColor: '#708499',
                linkColor: '#6ab3f3',
                secondaryBgColor: '#232e3c',
                sectionBgColor: '#17212b',
                sectionHeaderTextColor: '#6ab3f3',
                subtitleTextColor: '#708499',
                textColor: '#f5f5f5'
            },
            initData: parseInitData(initDataRaw),
            initDataRaw,
            version: '7.2',
            platform: 'tdesktop'
        });
    }
}
