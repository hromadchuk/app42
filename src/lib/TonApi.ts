import { Account, AccountEvent, AccountEvents, NftItem, NftItems } from 'tonapi-sdk-js';
import { sleep, TonApi } from './helpers.ts';

export class TonApiCall {
    static async getWallet(wallet: string) {
        return await TonApiCall.request<Account>('getWallet', TonApi.accounts.getAccount, wallet);
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

    static async getNftsTransactions(wallet: string) {
        let beforeLt = 0;
        let work = true;
        const limit = 10;
        const list: AccountEvent[] = [];

        while (work) {
            const data = await TonApiCall.request<AccountEvents>(
                'getNftsTransactions',
                TonApi.nft.getNftHistoryById,
                wallet,
                { limit }
            );

            list.push(...data.events);

            // if (data.events.length === limit) {
            //     beforeLt = data.next_from;
            // } else {
                work = false;
            // }
        }

        return list;
    }

    private static async request<T>(method: string, func: Function, ...params: unknown[]) {
        await sleep(100);

        try {
            const data = await func(...params);

            console.group(`TON API /${method}`);
            console.log('Request:', params);
            console.log('Result:', data);
            console.groupEnd();

            return data as T;
        } catch (error) {
            console.error('TonApiCall.request error', error);
            return null as T;
        }
    }
}
