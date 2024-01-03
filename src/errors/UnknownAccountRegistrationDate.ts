interface IErrorOptions {
    latestKnownRegistrationDate: Date;
    customMessage: string;
}

export default class UnknownAccountRegistrationDate extends Error {
    private readonly _latestKnownRegistrationDate: Date;
    private readonly _customMessage: string;

    constructor(options: IErrorOptions) {
        super('There is no information about the registration date of this account');

        this._latestKnownRegistrationDate = options.latestKnownRegistrationDate;
        this._customMessage = options.customMessage;
    }

    get latestKnownRegistrationDate() {
        return this._latestKnownRegistrationDate;
    }

    get customMessage() {
        return this._customMessage;
    }
}
