import { Account } from '@tonconnect/sdk';

interface IInitRequest {
    platform: string;
}
interface IInitResponse {
    status: 'ok' | 'error';
    topMethods: string[];
    storageHash: string;
    walletHash: string;
}

interface ISetWalletRequest {
    proof: {
        timestamp: number;
        domain: {
            lengthBytes: number;
            value: string;
        };
        payload: string;
        signature: string;
    };
    account: Account;
}
interface ISetWalletResponse {
    status: 'ok';
}

interface IMethodRequest {
    method: string;
}
interface IMethodResponse {
    status: 'ok';
}

interface IGetWalletsRequest {
    usernames: string[];
    numbers: number[];
}
interface IGetWalletsResponse {
    usernames: {
        ownerWallet: string;
        username: string;
    }[];
    numbers: {
        ownerWallet: string;
        number: number;
    }[];
}

interface IGetCollectionsFloorRequest {
    addresses: string[];
}
interface IGetCollectionsFloorResponse {
    [key: string]: number;
}

interface IGetTONTransactionsCSVRequest {
    wallet: string;
    lang: string;
}
interface IGetTONTransactionsCSVResponse {
    status: 'ok';
}

interface IGetMyNamesRequest {
    list: { [p: number]: string };
    onlySync?: boolean;
}
interface IGetMyNamesResponse {
    date: number;
    names: {
        name: string;
        count: number;
    }[];
}

export type ServerRequests = {
    init: IInitRequest;
    set_wallet: ISetWalletRequest;
    method: IMethodRequest;
    get_wallets: IGetWalletsRequest;
    get_collections_floor: IGetCollectionsFloorRequest;
    get_ton_transactions_csv: IGetTONTransactionsCSVRequest;
    get_my_names: IGetMyNamesRequest;
};

export type ServerResponses = {
    init: IInitResponse;
    set_wallet: ISetWalletResponse;
    method: IMethodResponse;
    get_wallets: IGetWalletsResponse;
    get_collections_floor: IGetCollectionsFloorResponse;
    get_ton_transactions_csv: IGetTONTransactionsCSVResponse;
    get_my_names: IGetMyNamesResponse;
};

export type ServerMethods = keyof ServerRequests;
