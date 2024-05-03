import {
    Account,
    AccountEvent,
    AccountEvents,
    Error,
    HttpResponse,
    JettonHolders,
    JettonsBalances,
    NftCollection,
    NftItem,
    NftItems
} from 'tonapi-sdk-js';
import { MD5 } from 'crypto-js';
import { getCache, setCache } from './cache.ts';
import { sleep, TonApi } from './helpers.ts';

export class TonApiCall {
    static manifestUrl = 'https://gromadchuk.github.io/kit-42/tonconnect-manifest.json';

    static getShortAddress(address: string) {
        const slicePart = address.slice(5, -5);

        return address.replace(slicePart, '...');
    }

    static async getWallet(wallet: string) {
        return await TonApiCall.request<Account>('getWallet', TonApi.accounts.getAccount, wallet);
    }

    static async getNormalizedWallet(wallet: string) {
        return await TonApiCall.request<{
            non_bounceable: {
                b64url: string;
            };
        }>('getNormalizedWallet', TonApi.accounts.addressParse, wallet);
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

    static async getEvents(wallet: string) {
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
                'getNftsTransactions',
                TonApi.accounts.getAccountEvents,
                wallet,
                params
            );

            beforeLt = data.next_from;
            list.push(...data.events);
            work = Boolean(data.next_from);
        }

        return list;
    }

    static async getCollectionFloor(address: string): Promise<number> {
        const collection = await TonApiCall.request<NftCollection>(
            'getNftCollection',
            TonApi.nft.getNftCollection,
            address
        );

        if (collection.next_item_index > 20_000) {
            return -1;
        }

        let minPrice = Number.MAX_SAFE_INTEGER;
        let offset = 0;
        const limit = 1000;

        while (offset < collection.next_item_index) {
            const { nft_items: list } = await TonApiCall.request<NftItems>(
                'getItemsFromCollection',
                TonApi.nft.getItemsFromCollection,
                address,
                { limit, offset }
            );

            for (const { sale } of list) {
                if (!sale) {
                    continue;
                }

                const price = Number(sale.price.value) / 1_000_000_000;
                if (price < minPrice) {
                    minPrice = price;
                }
            }

            offset += limit;
        }

        if (minPrice === Number.MAX_SAFE_INTEGER) {
            return -2;
        }

        return minPrice;
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

            if (['rate limit: limit for ip', 'rate limit: limit for tier'].includes(errorMessage)) {
                await sleep(1000);

                return await TonApiCall.request<T>(method, func, ...params);
            }

            return null as T;
        }
    }
}
