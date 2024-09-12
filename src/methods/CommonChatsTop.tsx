import { useContext, useEffect, useState } from 'react';
import { Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { Api } from 'telegram';
import { CallAPI, classNames, declineAndFormat } from '../lib/helpers.ts';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface ICommonChats {
    chats: Api.TypeChat[];
    count: Api.int;
}

interface IUserData {
    user: Api.User;
    commonChats: ICommonChats;
}

export default function CommonChatsTop() {
    const { mt, md, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [usersData, setUsersData] = useState<IUserData[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUserData | null>(null);

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

    function SectionBlock() {
        return usersData.map((owner, key) => (
            <OwnerRow
                key={key}
                callback={() => setSelectedUser(owner)}
                owner={owner.user}
                description={declineAndFormat(owner.commonChats.count, md('decline.chats'))}
            />
        ));
    }

    if (needHideContent()) return null;

    return (
        <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)}>
            <SectionBlock />

            {usersData && (
                <Modal
                    header={<ModalHeader />}
                    open={Boolean(selectedUser)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedUser(null);
                        }
                    }}
                >
                    {selectedUser?.commonChats.chats.map((chat, key) => {
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
            )}
        </Section>
    );
}
