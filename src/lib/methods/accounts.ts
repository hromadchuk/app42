import accountsRegistrationDates from './accounts-registration-dates.json';
import UnknownAccountRegistrationDate from '../../errors/UnknownAccountRegistrationDate.ts';

const accountsIdsWithKnownRegistrationDate = Object.keys(accountsRegistrationDates);
const minAccountIdWithKnownRegistrationDate = accountsIdsWithKnownRegistrationDate[0];
const maxAccountIdWithKnownRegistrationDate = accountsIdsWithKnownRegistrationDate.slice(-1)[0];

function getDateFromJsonByUserId(userId: string): number {
    return accountsRegistrationDates[String(userId) as keyof typeof accountsRegistrationDates] as number;
}

// https://github.com/wjclub/telegram-bot-getids/blob/master/idage.js#L9
export function getRegistrationDate(userId: number): Date {
    if (userId < Number(minAccountIdWithKnownRegistrationDate)) {
        throw new UnknownAccountRegistrationDate({
            latestKnownRegistrationDate: new Date(getDateFromJsonByUserId(minAccountIdWithKnownRegistrationDate)),
            customMessage: 'user_older_than_available_information'
        });
    }

    if (userId > Number(maxAccountIdWithKnownRegistrationDate)) {
        throw new UnknownAccountRegistrationDate({
            latestKnownRegistrationDate: new Date(getDateFromJsonByUserId(maxAccountIdWithKnownRegistrationDate)),
            customMessage: 'user_younger_than_available_information'
        });
    }

    let lowerAccountId = Number(minAccountIdWithKnownRegistrationDate);
    let upperAccountId: number | undefined;

    for (const accountIdFromJson in accountsRegistrationDates) {
        if (userId <= Number(accountIdFromJson)) {
            upperAccountId = Number(accountIdFromJson);

            break;
        }

        lowerAccountId = Number(accountIdFromJson);
    }

    if (upperAccountId === undefined) {
        throw new UnknownAccountRegistrationDate({
            latestKnownRegistrationDate: new Date(getDateFromJsonByUserId(String(lowerAccountId))),
            customMessage: 'user_younger_than_available_information'
        });
    }

    const idRatio = (userId - lowerAccountId) / Math.abs(upperAccountId - lowerAccountId);

    return new Date(
        Math.floor(
            idRatio *
                Math.abs(
                    getDateFromJsonByUserId(String(lowerAccountId)) - getDateFromJsonByUserId(String(upperAccountId))
                ) +
                getDateFromJsonByUserId(String(lowerAccountId))
        )
    );
}
