export class CantGetDataError extends Error {
    constructor(message = 'Can not get share data') {
        super(message);
        this.name = 'CantGetDataError';
    }
}
