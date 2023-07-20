import React, { useContext, useEffect, useState } from 'react';
import { Badge, Button, Card, Divider, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Api } from 'telegram';
import * as dayjs from 'dayjs';

import { MethodContext } from '../components/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

enum EFilerType {
    PREMIUM = 'premium',
    MUTUAL = 'mutual',
    NON_MUTUAL = 'nonMutual',
    WITHOUT_PHOTO = 'withoutPhoto',
    VERIFIED = 'verified',
    WITHOUT_PHONE = 'withoutPhone',
    WITHOUT_USERNAME = 'withoutUsername',
    DELETED = 'deleted',
    LONG_TIME_ONLINE = 'longTimeOnline',
    RECENT_ONLINE = 'recentOnline',
    FEW_USERNAMES = 'fewUsernames',
    HIDE_ONLINE = 'hideOnline',
    OLD = 'old'
}

export const ContactsAnalysis = () => {
    const { needHideContent, setProgress, setFinishBlock, mt } = useContext(MethodContext);

    const [opened, { open, close }] = useDisclosure(false);

    const [premiumUsersData, setPremiumUsers] = useState<Api.User[]>([]);
    const [mutualUsersData, setMutualUsers] = useState<Api.User[]>([]);
    const [nonMutualUsersData, setNonMutualUsers] = useState<Api.User[]>([]);
    const [withoutPhotoUsersData, setWithoutPhotoUsers] = useState<Api.User[]>([]);
    const [verifiedUsersData, setVerifiedUsers] = useState<Api.User[]>([]);
    const [withoutPhoneUsersData, setWithoutPhoneUsers] = useState<Api.User[]>([]);
    const [withoutUsernameUsersData, setWithoutUsernameUsers] = useState<Api.User[]>([]);
    const [deletedUsersData, setDeletedUsers] = useState<Api.User[]>([]);
    const [fewUsernamesUsersData, setFewUsernamesUsers] = useState<Api.User[]>([]);
    const [longTimeOnlineUsersData, setLongTimeOnlineUsers] = useState<Api.User[]>([]);
    const [hideOnlineUsersData, setHideOnlineUsers] = useState<Api.User[]>([]);
    const [recentOnlineUsersData, serRecentOnlineUsers] = useState<Api.User[]>([]);
    const [oldUsersData, setOldUsers] = useState<Api.User[]>([]);
    const [modalName, setModalName] = useState<string>('');
    const [modalUsers, setModalUsers] = useState<Api.User[]>([]);
    const [modalDescriptionType, setModalDescriptionType] = useState<EFilerType>(EFilerType.OLD);

    useEffect(() => {
        getContacts();
    }, []);

    async function getContacts() {
        setProgress({});

        const result = (await window.TelegramClient.invoke(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

        if (!result.users) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts') });
            return;
        }

        const users = (result.users as Api.User[]).filter(({ self }) => !self);

        const premiumUsers = users.filter(({ premium }) => premium);
        const mutualUsers = users.filter(({ mutualContact }) => mutualContact);
        const nonMutualUsers = users.filter(({ mutualContact }) => !mutualContact);
        const withoutPhotoUsers = users.filter(({ photo }) => !photo);
        const verifiedUsers = users.filter(({ verified }) => verified);
        const withoutPhoneUsers = users.filter(({ phone }) => !phone);
        const withoutUsernameUsers = users.filter(({ username, usernames }) => !username && !usernames);
        const deletedUsers = users.filter(({ deleted }) => deleted);
        const fewUsernamesUsers = users.filter(({ usernames }) => usernames);
        const longTimeOnlineUsers = users.filter(({ status }) => !status);
        const hideOnlineUsers = users.filter(({ status }) => status?.className === 'UserStatusRecently');

        const recentOnlineUsers = users
            .filter(({ status }) => status?.className === 'UserStatusOffline')
            .filter(({ status }) => {
                const userStatus = status as Api.UserStatusOffline;

                return dayjs().diff(userStatus.wasOnline * 1000, 'seconds') < 60 * 60 * 24 * 3 * 1000;
            })
            .sort((userA, userB) => {
                const statusA = userA.status as Api.UserStatusOffline;
                const statusB = userB.status as Api.UserStatusOffline;

                return statusB.wasOnline - statusA.wasOnline;
            });

        const oldUsers = users
            .filter(({ id }) => id.valueOf() < 100_000_000)
            .sort((a, b) => a.id.valueOf() - b.id.valueOf());

        setPremiumUsers(premiumUsers);
        setMutualUsers(mutualUsers);
        setNonMutualUsers(nonMutualUsers);
        setWithoutPhotoUsers(withoutPhotoUsers);
        setVerifiedUsers(verifiedUsers);
        setWithoutPhoneUsers(withoutPhoneUsers);
        setWithoutUsernameUsers(withoutUsernameUsers);
        setDeletedUsers(deletedUsers);
        setFewUsernamesUsers(fewUsernamesUsers);
        setLongTimeOnlineUsers(longTimeOnlineUsers);
        setHideOnlineUsers(hideOnlineUsers);
        serRecentOnlineUsers(recentOnlineUsers);
        setOldUsers(oldUsers);

        setProgress(null);
    }

    function openModal(name: string, users: Api.User[], descriptionType: EFilerType) {
        setModalName(name);
        setModalUsers(users);
        setModalDescriptionType(descriptionType);
        open();
    }

    function getDescription(type: EFilerType, user: Api.User): string | undefined {
        if (type === EFilerType.OLD) {
            return user.id.valueOf().toLocaleString().replace(/,/g, ' ');
        }

        if (type === EFilerType.FEW_USERNAMES && user.usernames) {
            return user.usernames.map(({ username }) => `@${username}`).join(', ');
        }

        if (type === EFilerType.RECENT_ONLINE) {
            const userStatus = user.status as Api.UserStatusOffline;

            return dayjs().to(dayjs(userStatus.wasOnline * 1000));
        }

        return undefined;
    }

    function SectionBlock(type: EFilerType, users: Api.User[], lang: string): React.JSX.Element | null {
        if (!users.length) {
            return null;
        }

        return (
            <>
                <Card.Section mt="md">
                    <Group position="apart">
                        <Text fz="md">{mt(`headers.${lang}`)}</Text>
                        <Badge size="sm">{users.length}</Badge>
                    </Group>

                    {users.slice(0, 3).map((owner, key) => (
                        <div key={key}>{OwnerRow({ owner, description: getDescription(type, owner) })}</div>
                    ))}
                </Card.Section>

                {users.length > 3 && (
                    <Group mt="xs">
                        <Button
                            variant="subtle"
                            fullWidth
                            onClick={() => openModal(mt(`headers.${lang}`), users, type)}
                        >
                            {mt('show_all_users')}
                        </Button>
                    </Group>
                )}

                <Divider my="sm" />
            </>
        );
    }

    if (needHideContent()) return null;

    return (
        <>
            <Modal opened={opened} onClose={close} title={modalName}>
                {modalUsers.map((owner, key) => (
                    <div key={key}>{OwnerRow({ owner, description: getDescription(modalDescriptionType, owner) })}</div>
                ))}
            </Modal>

            {SectionBlock(EFilerType.PREMIUM, premiumUsersData, 'premium')}
            {SectionBlock(EFilerType.MUTUAL, mutualUsersData, 'mutual')}
            {SectionBlock(EFilerType.NON_MUTUAL, nonMutualUsersData, 'non_mutual')}
            {SectionBlock(EFilerType.WITHOUT_PHOTO, withoutPhotoUsersData, 'without_photo')}
            {SectionBlock(EFilerType.VERIFIED, verifiedUsersData, 'verified')}
            {SectionBlock(EFilerType.WITHOUT_PHONE, withoutPhoneUsersData, 'without_phone')}
            {SectionBlock(EFilerType.WITHOUT_USERNAME, withoutUsernameUsersData, 'without_username')}
            {SectionBlock(EFilerType.DELETED, deletedUsersData, 'deleted')}
            {SectionBlock(EFilerType.LONG_TIME_ONLINE, longTimeOnlineUsersData, 'long_time_online')}
            {SectionBlock(EFilerType.RECENT_ONLINE, recentOnlineUsersData, 'recent_online')}
            {SectionBlock(EFilerType.FEW_USERNAMES, fewUsernamesUsersData, 'few_usernames')}
            {SectionBlock(EFilerType.HIDE_ONLINE, hideOnlineUsersData, 'hide_online')}
            {SectionBlock(EFilerType.OLD, oldUsersData, 'old')}
        </>
    );
};

export default ContactsAnalysis;
