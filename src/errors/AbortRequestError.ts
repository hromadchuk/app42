export class AbortRequestError extends Error {
    constructor(message = 'Request were aborted') {
        super(message);
        this.name = 'AbortRequestError';
    }
}
