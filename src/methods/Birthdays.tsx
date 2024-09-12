import { Section } from '@telegram-apps/telegram-ui';
import { useContext, useEffect, useState } from 'react';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { CallAPI, classNames, sleep } from '../lib/helpers.ts';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface IUserItem {
    user: Api.TypeUser;
    birthday: Api.Birthday;
}

export default function Birthdays() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [usersList, setUsersList] = useState<IUserItem[]>([]);

    useEffect(() => {
        (async () => {
            setProgress({});

            const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

            if (!result.users?.length) {
                setProgress(null);
                setFinishBlock({ state: 'error', text: mt('no_contacts') });
                return;
            }

            const usersBirthdays = new Map<number, Api.Birthday>();

            setProgress({ text: mt('get_users_info'), total: result.users.length });

            for (const user of result.users) {
                await sleep(666);
                const { fullUser } = await CallAPI(new Api.users.GetFullUser({ id: user.id }));
                if (fullUser.birthday) {
                    usersBirthdays.set(user.id.valueOf(), fullUser.birthday);
                }

                setProgress({ addCount: 1 });
            }

            const list: IUserItem[] = result.users
                .filter((user) => usersBirthdays.has(user.id.valueOf()))
                .map((user) => ({ user, birthday: usersBirthdays.get(user.id.valueOf()) as Api.Birthday }))
                .sort((a, b) => a.birthday.month - b.birthday.month || a.birthday.day - b.birthday.day);

            if (!list.length) {
                setProgress(null);
                setFinishBlock({ state: 'error', text: mt('no_birthdays') });
                return;
            }

            setUsersList(list);
            setProgress(null);
        })();
    }, []);

    if (needHideContent()) return null;

    if (usersList.length) {
        return (
            <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
                {usersList.map(({ user, birthday }, key) => {
                    const date = dayjs()
                        .date(birthday.day)
                        .month(birthday.month - 1);

                    return <OwnerRow key={key} owner={user} description={date.format('DD MMMM')} />;
                })}
            </Section>
        );
    }
}
