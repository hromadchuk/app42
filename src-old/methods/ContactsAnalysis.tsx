import { JSX, useContext, useEffect, useState } from 'react';
import { Badge, Box, Button, Container, Divider, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { CallAPI } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
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

export default function ContactsAnalysis() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

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

        const result = (await CallAPI(new Api.contacts.GetContacts({}))) as Api.contacts.Contacts;

        if (!result.users?.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_contacts') });
            return;
        }

        const users = (result.users as Api.User[]).reduce(
            (filtered, user) => {
                if (user.id.valueOf() < 100_000_000) {
                    filtered.oldUsers.push(user);
                }

                if (user.self) {
                    return filtered;
                }

                if (user.premium) {
                    filtered.premiumUsers.push(user);
                }

                if (user.mutualContact) {
                    filtered.mutualUsers.push(user);
                }

                if (!user.mutualContact) {
                    filtered.nonMutualUsers.push(user);
                }

                if (!user.photo) {
                    filtered.withoutPhotoUsers.push(user);
                }

                if (user.verified) {
                    filtered.verifiedUsers.push(user);
                }

                if (!user.phone) {
                    filtered.withoutPhoneUsers.push(user);
                }

                if (!user.username && !user.usernames) {
                    filtered.withoutUsernameUsers.push(user);
                }

                if (user.deleted) {
                    filtered.deletedUsers.push(user);
                }

                if (user.usernames && user.usernames.length > 1) {
                    filtered.fewUsernamesUsers.push(user);
                }

                if (!user.status) {
                    filtered.longTimeOnlineUsers.push(user);
                }

                if (user.status?.className === 'UserStatusOffline') {
                    filtered.recentOnlineUsers.push(user);
                }

                return filtered;
            },
            {
                premiumUsers: [] as Api.User[],
                mutualUsers: [] as Api.User[],
                nonMutualUsers: [] as Api.User[],
                withoutPhotoUsers: [] as Api.User[],
                verifiedUsers: [] as Api.User[],
                withoutPhoneUsers: [] as Api.User[],
                withoutUsernameUsers: [] as Api.User[],
                deletedUsers: [] as Api.User[],
                fewUsernamesUsers: [] as Api.User[],
                longTimeOnlineUsers: [] as Api.User[],
                hideOnlineUsers: [] as Api.User[],
                recentOnlineUsers: [] as Api.User[],
                oldUsers: [] as Api.User[]
            }
        );

        users.recentOnlineUsers.sort((userA, userB) => {
            const statusA = userA.status as Api.UserStatusOffline;
            const statusB = userB.status as Api.UserStatusOffline;

            return statusA.wasOnline - statusB.wasOnline;
        });

        users.oldUsers.sort((a, b) => a.id.valueOf() - b.id.valueOf());

        setPremiumUsers(users.premiumUsers);
        setMutualUsers(users.mutualUsers);
        setNonMutualUsers(users.nonMutualUsers);
        setWithoutPhotoUsers(users.withoutPhotoUsers);
        setVerifiedUsers(users.verifiedUsers);
        setWithoutPhoneUsers(users.withoutPhoneUsers);
        setWithoutUsernameUsers(users.withoutUsernameUsers);
        setDeletedUsers(users.deletedUsers);
        setFewUsernamesUsers(users.fewUsernamesUsers);
        setLongTimeOnlineUsers(users.longTimeOnlineUsers);
        setHideOnlineUsers(users.hideOnlineUsers);
        serRecentOnlineUsers(users.recentOnlineUsers);
        setOldUsers(users.oldUsers);

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

    function SectionBlock(type: EFilerType, users: Api.User[], lang: string): JSX.Element | null {
        if (!users.length) {
            return null;
        }

        return (
            <>
                <Container px={0}>
                    <Divider
                        my="xs"
                        label={
                            <>
                                <Box fz={13} mr={5}>
                                    {mt(`headers.${lang}`)}
                                </Box>
                                <Badge size="xs" display="-webkit-box">
                                    {users.length}
                                </Badge>
                            </>
                        }
                        labelPosition="center"
                    />

                    {users.slice(0, 3).map((owner, key) => (
                        <div key={key}>{OwnerRow({ owner, description: getDescription(type, owner) })}</div>
                    ))}
                </Container>

                {users.length > 3 && (
                    <Group mt="xs">
                        <Button
                            variant="light"
                            color="gray"
                            fullWidth
                            onClick={() => openModal(mt(`headers.${lang}`), users, type)}
                        >
                            {mt('show_all_users')}
                        </Button>
                    </Group>
                )}
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
}