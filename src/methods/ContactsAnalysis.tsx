import { useContext, useEffect, useState } from 'react';
import { ButtonCell, Caption, Divider, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { Api } from 'telegram';
import dayjs from 'dayjs';
import { CallAPI, classNames } from '../lib/helpers.ts';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

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
    const [modalUsers, setModalUsers] = useState<Api.User[] | null>(null);
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

    function SectionBlock({ type, users, lang }: { type: EFilerType; users: Api.User[]; lang: string }) {
        if (!users.length) {
            return null;
        }

        return (
            <Section
                header={
                    <Section.Header>
                        {mt(`headers.${lang}`)}
                        <Caption
                            level="1"
                            weight="3"
                            style={{ marginLeft: 5, color: 'var(--tgui--secondary_hint_color)' }}
                        >
                            {users.length}
                        </Caption>
                    </Section.Header>
                }
                className={classNames(commonClasses.sectionBox, commonClasses.hideHr)}
            >
                {users.slice(0, 3).map((owner, key) => (
                    <>
                        <OwnerRow key={key} owner={owner} description={getDescription(type, owner)} />
                        <Divider
                            style={{
                                display: key === users.slice(0, 3).length - 1 && users.length <= 3 ? 'none' : 'block'
                            }}
                        />
                    </>
                ))}

                {users.length > 3 && (
                    <ButtonCell
                        onClick={() => {
                            setModalUsers(users);
                            setModalDescriptionType(type);
                            setModalName(mt(`headers.${lang}`));
                        }}
                    >
                        {mt('show_all_users')}
                    </ButtonCell>
                )}
            </Section>
        );
    }

    if (needHideContent()) return null;

    return (
        <>
            <SectionBlock type={EFilerType.NON_MUTUAL} users={nonMutualUsersData} lang="non_mutual" />
            <SectionBlock type={EFilerType.MUTUAL} users={mutualUsersData} lang="mutual" />
            <SectionBlock type={EFilerType.PREMIUM} users={premiumUsersData} lang="premium" />
            <SectionBlock type={EFilerType.WITHOUT_PHOTO} users={withoutPhotoUsersData} lang="without_photo" />
            <SectionBlock type={EFilerType.VERIFIED} users={verifiedUsersData} lang="verified" />
            <SectionBlock type={EFilerType.WITHOUT_PHONE} users={withoutPhoneUsersData} lang="without_phone" />
            <SectionBlock type={EFilerType.WITHOUT_USERNAME} users={withoutUsernameUsersData} lang="without_username" />
            <SectionBlock type={EFilerType.DELETED} users={deletedUsersData} lang="deleted" />
            <SectionBlock type={EFilerType.LONG_TIME_ONLINE} users={longTimeOnlineUsersData} lang="long_time_online" />
            <SectionBlock type={EFilerType.RECENT_ONLINE} users={recentOnlineUsersData} lang="recent_online" />
            <SectionBlock type={EFilerType.FEW_USERNAMES} users={fewUsernamesUsersData} lang="few_usernames" />
            <SectionBlock type={EFilerType.HIDE_ONLINE} users={hideOnlineUsersData} lang="hide_online" />
            <SectionBlock type={EFilerType.OLD} users={oldUsersData} lang="old" />

            {modalUsers && (
                <Modal
                    header={<ModalHeader />}
                    open={Boolean(modalUsers)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setModalUsers(null);
                        }
                    }}
                >
                    <Section header={modalName}>
                        {modalUsers.map((owner, key) => (
                            <OwnerRow
                                key={key}
                                owner={owner}
                                description={getDescription(modalDescriptionType, owner)}
                            />
                        ))}
                    </Section>
                </Modal>
            )}
        </>
    );
}
