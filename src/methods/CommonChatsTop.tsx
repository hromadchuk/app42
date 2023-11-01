import { JSX, useContext, useEffect, useState } from 'react';
import { Container } from '@mantine/core';
import { Api } from 'telegram';
import { CallAPI } from '../lib/helpers.tsx';

import { MethodContext } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

interface IUserData {
    user: Api.User;
    common_chats_count: Api.int;
}

export const CommonChatsTop = () => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [usersData, setUsersData] = useState<IUserData[]>([]);

    useEffect(() => {
        getContacts();
    }, []);

    async function getContacts() {
        setProgress({});

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

        if (!result.users?.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts') });
            return;
        }

        const users = (result.users as Api.User[]).filter((user) => !user.self);

        const usersWithCommonChatsCount = [];

        for (const user of users) {
            setProgress({ count: users.indexOf(user), total: result.users.length });

            const commonChatsCount = await getContactCommonChatsCount(user);
            usersWithCommonChatsCount.push({ user, common_chats_count: commonChatsCount });
        }

        usersWithCommonChatsCount.sort(
            (userDataA, userDataB) => userDataB.common_chats_count - userDataA.common_chats_count
        );

        setUsersData(usersWithCommonChatsCount);
        setProgress(null);
    }

    async function getContactCommonChatsCount(user: Api.User): Promise<Api.int> {
        const result = (await CallAPI(
            new Api.messages.GetCommonChats({
                userId: user.id
            })
        )) as Api.messages.Chats;

        return result.chats.length;
    }

    function SectionBlock(): JSX.Element | null {
        if (!usersData.length) {
            return null;
        }

        return (
            <Container px={0}>
                {usersData.map((owner, key) => (
                    <OwnerRow
                        key={key}
                        owner={owner.user}
                        description={`${mt('chats_count')}: ${owner.common_chats_count}`}
                    />
                ))}
            </Container>
        );
    }

    if (needHideContent()) return null;

    return <SectionBlock />;
};

export default CommonChatsTop;
