import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { Button, Flex, Radio } from '@mantine/core';
import { Api } from 'telegram';
import { formatNumber, notifyError, TOwnerType } from '../lib/helpers.ts';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { getDialogParticipants, kickMemberFromDialog } from '../lib/methods/dialogs.ts';
import { calculatePeriodTimestamp } from '../lib/methods/messages.ts';
import { CheckboxCard } from '../components/CheckboxCard.tsx';

interface IRemovableCheckboxProps {
    checked: boolean;
    members: Api.User[] | undefined;
    text: string;
    onChange: Dispatch<SetStateAction<boolean>>;
}

const offlineDays = [
    1, // 1 day
    3, // 3 days
    7, // 1 week
    30, // 1 month
    90, // 3 months
    180 // 6 months
];

export default function ClearDialogMembers() {
    const { mt, needHideContent, setFinishBlock, setProgress, setListAction } = useContext(MethodContext);

    const [needRemoveBots, setNeedRemoveBots] = useState(false);
    const [needRemoveClosedOnline, setNeedRemoveClosedOnline] = useState(false);
    const [needRemoveNotPremium, setNeedRemoveNotPremium] = useState(false);
    const [needRemoveNotContact, setNeedRemoveNotContact] = useState(false);
    const [needRemoveWithoutAvatar, setNeedRemoveWithoutAvatar] = useState(false);
    const [needRemoveNotBeenForLongTime, setNeedRemoveNotBeenForLongTime] = useState(false);
    const [countOfOfflineDaysToRemove, setCountOfOfflineDaysToRemove] = useState(offlineDays[0]);
    const [selectedDialog, setSelectedDialog] = useState<TDialogWithoutUser | null>(null);
    const [dialogMembers, setDialogMembers] = useState<Api.User[] | null>(null);

    async function onDialogSelect(dialog: TDialogWithoutUser) {
        setProgress({ text: mt('get_members') });

        const participants = await getDialogParticipants(dialog);

        if (participants instanceof Api.channels.ChannelParticipantsNotModified) {
            setFinishBlock({ state: 'error', text: mt('cannot_get_channel_participants') });
            return;
        }

        if (participants instanceof Api.channels.ChannelParticipants && participants.count > 200) {
            notifyError({ message: mt('many_dialog_users_error') });
        }

        const members = participants.users.filter((user) => user instanceof Api.User && !user.self) as Api.User[];

        if (members.length > 0) {
            setDialogMembers(members);
            setProgress(null);
        } else {
            setFinishBlock({ text: mt('no_members') });
        }
    }

    function checkIsUserABot(user: Api.User) {
        return user.bot;
    }

    function getBots(): Api.User[] | undefined {
        return dialogMembers?.filter((member) => checkIsUserABot(member));
    }

    function getNotContact(): Api.User[] | undefined {
        return dialogMembers?.filter((member) => !checkIsUserABot(member) && !member.contact);
    }

    function getNotBeenForLongTime(offlineDaysCount = offlineDays[0]): Api.User[] | undefined {
        return dialogMembers?.filter(
            (member) =>
                !checkIsUserABot(member) &&
                !(member.status instanceof Api.UserStatusOnline) &&
                member.status instanceof Api.UserStatusOffline &&
                (member.status as Api.UserStatusOffline).wasOnline < calculatePeriodTimestamp(offlineDaysCount)
        );
    }

    function getClosedOnline(): Api.User[] | undefined {
        return dialogMembers?.filter(
            (member) =>
                !checkIsUserABot(member) &&
                !(member.status instanceof Api.UserStatusOnline) &&
                !(member.status instanceof Api.UserStatusOffline)
        );
    }

    function getNotPremium(): Api.User[] | undefined {
        return dialogMembers?.filter((member) => !checkIsUserABot(member) && !member.premium);
    }

    function getWithoutAvatar(): Api.User[] | undefined {
        return dialogMembers?.filter((member) => member.photo === null);
    }

    function getListToRemove() {
        const result: Api.User[] = [];

        if (!dialogMembers) {
            return result;
        }

        if (needRemoveBots) {
            result.push(...(getBots() as Api.User[]));
        }

        if (needRemoveNotContact) {
            result.push(...(getNotContact() as Api.User[]));
        }

        if (needRemoveNotBeenForLongTime) {
            result.push(...(getNotBeenForLongTime(countOfOfflineDaysToRemove) as Api.User[]));
        }

        if (needRemoveClosedOnline) {
            result.push(...(getClosedOnline() as Api.User[]));
        }

        if (needRemoveNotPremium) {
            result.push(...(getNotPremium() as Api.User[]));
        }

        if (needRemoveWithoutAvatar) {
            result.push(...(getWithoutAvatar() as Api.User[]));
        }

        return result.filter((value, index, self) => self.indexOf(value) === index);
    }

    function clearDialogMembers() {
        const listToRemove = getListToRemove();

        setListAction({
            buttonText: mt('button_clear'),
            loadingText: mt('clearing_progress'),
            requestSleep: 777,
            owners: listToRemove,
            action: async (owner) => {
                await kickMemberFromDialog(owner.id.valueOf(), selectedDialog as TDialogWithoutUser);
            }
        });
    }

    function RemovableCheckbox({ checked, members, text, onChange }: IRemovableCheckboxProps) {
        return (
            <Flex mb={5}>
                <CheckboxCard
                    size="md"
                    checked={checked}
                    title={`${mt(text)} (${formatNumber(Number(members?.length))})`}
                    disabled={members?.length === 0}
                    setChecked={(isChecked) => onChange(isChecked)}
                    isHorizontal={true}
                />
            </Flex>
        );
    }

    if (needHideContent()) return null;

    if (!selectedDialog) {
        return (
            <SelectDialog
                allowTypes={[EOwnerType.chat, EOwnerType.supergroup, EOwnerType.channel]}
                isOnlyWithKickPermissions={true}
                onOwnerSelect={async (owner: TOwnerType) => {
                    if (owner instanceof Api.User) {
                        return;
                    }

                    setSelectedDialog(owner);
                    await onDialogSelect(owner);
                }}
            />
        );
    }

    if (dialogMembers) {
        return (
            <>
                <RemovableCheckbox
                    checked={needRemoveBots}
                    members={getBots()}
                    text="checkbox_bots"
                    onChange={setNeedRemoveBots}
                />

                <RemovableCheckbox
                    checked={needRemoveNotContact}
                    members={getNotContact()}
                    text="checkbox_not_contact"
                    onChange={setNeedRemoveNotContact}
                />

                <RemovableCheckbox
                    checked={needRemoveNotBeenForLongTime}
                    members={getNotBeenForLongTime()}
                    text="checkbox_not_been_for_long_time"
                    onChange={setNeedRemoveNotBeenForLongTime}
                />

                {needRemoveNotBeenForLongTime && (
                    <Radio.Group
                        value={String(countOfOfflineDaysToRemove)}
                        onChange={(value) => setCountOfOfflineDaysToRemove(Number(value))}
                        withAsterisk
                    >
                        <Flex mt="xs" direction="column" gap={10} mb={20}>
                            {offlineDays.map((period, index) => (
                                <Radio
                                    key={period}
                                    checked={index === 0}
                                    value={String(period)}
                                    disabled={getNotBeenForLongTime(period)?.length === 0}
                                    label={
                                        mt('radio_offline_for').replace('{days}', mt(`periods.${period}`)) +
                                        ` (${formatNumber(Number(getNotBeenForLongTime(period)?.length))})`
                                    }
                                />
                            ))}
                        </Flex>
                    </Radio.Group>
                )}

                <RemovableCheckbox
                    checked={needRemoveClosedOnline}
                    members={getClosedOnline()}
                    text="checkbox_closed_online"
                    onChange={setNeedRemoveClosedOnline}
                />

                <RemovableCheckbox
                    checked={needRemoveNotPremium}
                    members={getNotPremium()}
                    text="checkbox_not_premium"
                    onChange={setNeedRemoveNotPremium}
                />

                <RemovableCheckbox
                    checked={needRemoveWithoutAvatar}
                    members={getWithoutAvatar()}
                    text="checkbox_without_avatar"
                    onChange={setNeedRemoveWithoutAvatar}
                />

                <Button
                    fullWidth
                    variant="outline"
                    mt="xs"
                    disabled={
                        dialogMembers.length === 0 ||
                        (!needRemoveClosedOnline &&
                            !needRemoveBots &&
                            !needRemoveNotContact &&
                            !needRemoveNotBeenForLongTime &&
                            !needRemoveNotPremium &&
                            !needRemoveWithoutAvatar)
                    }
                    onClick={clearDialogMembers}
                >
                    {mt('button_clear_preview')}
                </Button>
            </>
        );
    }

    return null;
}
