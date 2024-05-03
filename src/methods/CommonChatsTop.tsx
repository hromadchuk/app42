import { JSX, useContext, useEffect, useState } from 'react';
import { Divider, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Api } from 'telegram';

import { CallAPI, declineAndFormat } from '../lib/helpers.ts';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

interface ICommonChats {
    chats: Api.TypeChat[];
    count: Api.int;
}

interface IUserData {
    user: Api.User;
    commonChats: ICommonChats;
}

export default function CommonChatsTop(): JSX.Element | null {
    const { mt, md, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [isModalOpened, { open, close }] = useDisclosure(false);
    const [modalChats, setModalChats] = useState<Api.TypeChat[]>([]);
    const [modalContact, setModalContact] = useState<Api.User | null>(null);
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
            if (commonChats.length) {
                usersWithCommonChats.push({
                    user,
                    commonChats: {
                        chats: commonChats,
                        count: commonChats.length
                    }
                });
            }
        }

        if (!usersWithCommonChats.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_common_chats') });
            return;
        }

        usersWithCommonChats.sort((userDataA, userDataB) => userDataB.commonChats.count - userDataA.commonChats.count);

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

    function openModal(owner: IUserData): void {
        setModalContact(owner.user);
        setModalChats(owner.commonChats.chats);
        open();
    }

    function SectionBlock() {
        return usersData.map((owner, key) => (
            <OwnerRow
                key={key}
                callback={() => openModal(owner)}
                owner={owner.user}
                description={declineAndFormat(owner.commonChats.count, md('decline.chats'))}
            />
        ));
    }

    if (needHideContent()) return null;

    return (
        <>
            <Modal opened={isModalOpened} onClose={close} title={mt('modal_title')}>
                <OwnerRow owner={modalContact} />
                <Divider my="sm" />

                {modalChats.map((chat, key) => {
                    const membersCount = Number(
                        (chat instanceof Api.Channel || chat instanceof Api.Chat) && chat.participantsCount
                    );

                    return (
                        <OwnerRow
                            key={key}
                            owner={chat}
                            description={declineAndFormat(membersCount, md('decline.members'))}
                        />
                    );
                })}
            </Modal>

            <SectionBlock />
        </>
    );
}
