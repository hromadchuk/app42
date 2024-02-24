export class CantGetImageError extends Error {
    constructor(message = 'Can not get share image') {
        super(message);
        this.name = 'CantGetImageError';
    }
}
