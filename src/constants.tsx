interface IConstants {
    API_ID: number;
    API_HASH: string;
    KIT_42_CACHE_VERSION: string;
    CACHE_PREFIX: string;
    SESSION_KEY: string;
}

const cacheVersion = 'V2';

export const Constants: IConstants = {
    API_ID: 21504958,
    API_HASH: 'd4384e436536198944078fafd63aa051',
    KIT_42_CACHE_VERSION: cacheVersion,
    CACHE_PREFIX: 'kit42Cache' + cacheVersion,
    SESSION_KEY: 'kit42Session' + cacheVersion
};
