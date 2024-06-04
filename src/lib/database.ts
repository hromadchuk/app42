import Dexie from 'dexie';

export type CacheDataType = null | number | string | Object;

export interface ICacheData {
    key: string;
    timestamp: number;
    data: CacheDataType;
}

export class App42Database extends Dexie {
    cache!: Dexie.Table<ICacheData, string>;

    constructor() {
        super('App42Database');

        this.version(1).stores({
            cache: 'key'
        });
    }
}
