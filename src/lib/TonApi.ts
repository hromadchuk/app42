import {
    Account,
    AccountEvent,
    AccountEvents,
    Error,
    Event,
    HttpResponse,
    JettonHolders,
    JettonsBalances,
    NftItem,
    NftItems
} from 'tonapi-sdk-js';
import { MD5 } from 'crypto-js';
import { IProgress } from '../contexts/MethodContext.tsx';
import { getCache, setCache } from './cache.ts';
import { sleep, TonApi } from './helpers.ts';

export class TonApiCall {
    static getShortAddress(address: string) {
        const slicePart = address.slice(5, -5);

        return address.replace(slicePart, '...');
    }

    static async getWallet(wallet: string) {
        return await TonApiCall.request<Account>('getWallet', TonApi.accounts.getAccount, wallet);
    }

    static async getNormalizedWallet(wallet: string) {
        const data = await TonApiCall.request<{
            non_bounceable: {
                b64url: string;
            };
        }>('getNormalizedWallet', TonApi.accounts.addressParse, wallet);

        return data.non_bounceable.b64url;
    }

    static async getJettons(wallet: string, currencies?: string[]) {
        return await TonApiCall.request<JettonsBalances>(
            'getJettons',
            TonApi.accounts.getAccountJettonsBalances,
            wallet,
            { currencies: (currencies || []).join(',') }
        );
    }

    static async getJettonHolders(wallet: string) {
        return await TonApiCall.request<JettonHolders>('getJettonHolders', TonApi.jettons.getJettonHolders, wallet, {
            limit: 1000,
            offset: 0
        });
    }

    static async getNfts(wallet: string) {
        let offset = 0;
        let work = true;
        const limit = 1000;
        const list: NftItem[] = [];

        while (work) {
            const data = await TonApiCall.request<NftItems>('getNfts', TonApi.accounts.getAccountNftItems, wallet, {
                limit,
                offset,
                indirect_ownership: true
            });

            list.push(...data.nft_items);

            if (data.nft_items.length === limit) {
                offset += limit;
            } else {
                work = false;
            }
        }

        return list;
    }

    static async getEvents(wallet: string, setProgress?: (progress: IProgress | null) => void) {
        let beforeLt = 0;
        let work = true;
        const limit = 100;
        const list: AccountEvent[] = [];

        while (work) {
            const params: { limit: number; before_lt?: number } = { limit };
            if (beforeLt) {
                params.before_lt = beforeLt;
            }

            const data = await TonApiCall.request<AccountEvents>(
                'getEvents',
                TonApi.accounts.getAccountEvents,
                wallet,
                params
            );

            if (setProgress) {
                setProgress({ addCount: data.events.length });
            }

            beforeLt = data.next_from;
            list.push(...data.events);
            work = Boolean(data.next_from);
        }

        return list;
    }

    static async getEvent(eventId: string) {
        return await TonApiCall.request<Event>('getEvent', TonApi.events.getEvent, eventId);
    }

    static async getNftHistory(nftId: string) {
        return await TonApiCall.request<AccountEvents>('getNftHistory', TonApi.nft.getNftHistoryById, nftId, {
            limit: 50
        });
    }

    static async getRate() {
        const result = await TonApiCall.request<{
            rates: { TON: { prices: { USD: number } } };
        }>('getRate', TonApi.rates.getRates, {
            tokens: ['ton'],
            currencies: ['usd']
        });

        if (result?.rates?.TON?.prices?.USD) {
            return result.rates.TON.prices.USD;
        }

        return 0;
    }

    static async getRateForDate(date: number) {
        const { points } = await TonApiCall.request<{
            points: number[][];
        }>('getRateForDate', TonApi.rates.getChartRates, {
            token: 'ton',
            currency: 'usd',
            start_date: date,
            end_date: date + 86400,
            points_count: 1
        });

        if (points?.length) {
            return points[0][1];
        }

        return 0;
    }

    private static async request<T>(method: string, func: Function, ...params: unknown[]): Promise<T> {
        try {
            const cacheKey = `TON.${method}:${MD5(JSON.stringify(params))}`;
            const cache = await getCache(cacheKey);
            if (cache) {
                return cache as T;
            }

            const data = await func(...params);

            console.group(`TON API /${method}`);
            console.log('Request:', params);
            console.log('Result:', data);
            console.groupEnd();

            await setCache(cacheKey, data, 5);

            return data as T;
        } catch (error) {
            const {
                error: { error: errorMessage }
            } = error as HttpResponse<T, Error>;

            console.error('TonApiCall.request error', error);

            if (
                ['rate limit: limit for ip', 'rate limit: limit for tier'].includes(errorMessage) ||
                errorMessage.includes('parent tx for') ||
                errorMessage.includes('inMessage not found')
            ) {
                await sleep(1000);

                return await TonApiCall.request<T>(method, func, ...params);
            }

            return null as T;
        }
    }
}
