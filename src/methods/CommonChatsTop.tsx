import { JSX, useContext, useEffect, useState } from 'react';
import { Container, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Api } from 'telegram';

import { CallAPI } from '../lib/helpers.tsx';
import { MethodContext } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

interface ICommonChats {
    chats: Api.TypeChat[];
    count: Api.int;
}

interface IUserData {
    user: Api.User;
    common_chats: ICommonChats;
}

export const CommonChatsTop = (): JSX.Element | null => {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [isModalOpened, { open, close }] = useDisclosure(false);
    const [modalChats, setModalChats] = useState<Api.TypeChat[]>([]);

    const [usersData, setUsersData] = useState<IUserData[]>([]);

    useEffect(() => {
        getContacts();
    }, []);

    async function getContacts(): Promise<void> {
        setProgress({});

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

        if (!result.users?.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts') });
            return;
        }

        const users: Api.User[] = (result.users as Api.User[]).filter((user) => !user.self);

        const usersWithCommonChats: IUserData[] = [];

        for (const user of users) {
            setProgress({ count: users.indexOf(user), total: result.users.length });

            const commonChats: Api.TypeChat[] = (await getContactCommonChats(user)) as Api.TypeChat[];
            usersWithCommonChats.push({
                user,
                common_chats: {
                    chats: commonChats,
                    count: commonChats.length
                }
            });
        }

        usersWithCommonChats.sort(
            (userDataA, userDataB) => userDataB.common_chats.count - userDataA.common_chats.count
        );

        setUsersData(usersWithCommonChats);
        setProgress(null);
    }

    async function getContactCommonChats(user: Api.User): Promise<Api.TypeChat[]> {
        const result = (await CallAPI(
            new Api.messages.GetCommonChats({
                userId: user.id
            })
        )) as Api.messages.Chats;

        return result.chats;
    }

    function openModal(chats: Api.TypeChat[]): void {
        setModalChats(chats);
        open();
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
                        callback={owner.common_chats.count > 0 ? () => openModal(owner.common_chats.chats) : undefined}
                        owner={owner.user}
                        description={`${mt('chats_count')}: ${owner.common_chats.count}`}
                    />
                ))}
            </Container>
        );
    }

    if (needHideContent()) return null;

    return (
        <>
            <Modal opened={isModalOpened} onClose={close} title={mt('chats_count')}>
                {modalChats.map((chat, key) => (
                    <OwnerRow
                        key={key}
                        owner={chat}
                        description={`${mt('members_count')}: ${
                            chat instanceof Api.Channel || chat instanceof Api.Chat ? chat.participantsCount : 0
                        }`}
                    />
                ))}
            </Modal>

            <SectionBlock />
        </>
    );
};

export default CommonChatsTop;
