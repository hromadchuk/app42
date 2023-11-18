import Dexie from 'dexie';

export type CacheDataType = null | number | string | Object;

export interface ICacheData {
    key: string;
    timestamp: number;
    data: CacheDataType;
}

export class Kit42Database extends Dexie {
    cache!: Dexie.Table<ICacheData, string>;

    constructor() {
        super('Kit42Database');

        this.version(1).stores({
            cache: 'key'
        });
    }
}
