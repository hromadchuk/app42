import { useContext, useRef, useState } from 'react';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { Button, Grid, Group, NumberInput, Text } from '@mantine/core';
import { getRegistrationDate } from '../lib/methods/accounts.ts';
import UnknownAccountRegistrationDate from '../errors/UnknownAccountRegistrationDate.ts';
import { notifyError } from '../lib/helpers.ts';

export const AccountRegistrationDate = () => {
    const { needHideContent, mt } = useContext(MethodContext);
    const userIdInputRef = useRef<HTMLInputElement>(null);
    const [registrationDateText, setRegistrationDateText] = useState<string | null>(null);

    if (needHideContent()) return null;

    function setCurrentUserId() {
        if (!userIdInputRef.current) {
            return;
        }

        userIdInputRef.current.value = String(window.userId);
    }

    function calculateAccountRegistrationDate() {
        if (!userIdInputRef.current) {
            return;
        }

        const userIdInputValue = Number(userIdInputRef.current.value);

        if (!userIdInputValue) {
            notifyError({ message: mt('empty_user_id') });

            return;
        }

        try {
            const registrationDate = getRegistrationDate(userIdInputValue);

            setRegistrationDateText(
                mt('estimated_registration_date').replace('{date}', registrationDate.toLocaleDateString())
            );
        } catch (unknownDateError) {
            if (!(unknownDateError instanceof UnknownAccountRegistrationDate)) {
                throw unknownDateError;
            }

            setRegistrationDateText(
                mt(unknownDateError.customMessage).replace(
                    '{date}',
                    unknownDateError.latestKnownRegistrationDate.toLocaleDateString()
                )
            );
        }
    }

    return (
        <>
            <Grid pb={10}>
                <Grid.Col pb={0}>
                    <Text>{mt('write_user_id')}</Text>

                    <Group grow preventGrowOverflow={true} wrap="nowrap" gap={1}>
                        <Button onClick={setCurrentUserId}>{mt('my_id')}</Button>

                        <NumberInput ref={userIdInputRef} hideControls placeholder={mt('user_id')} />
                    </Group>
                </Grid.Col>
                <Grid.Col>
                    <Button fullWidth onClick={calculateAccountRegistrationDate}>
                        {mt('calculate_date')}
                    </Button>
                </Grid.Col>
            </Grid>

            <Text>{registrationDateText}</Text>
        </>
    );
};

export default AccountRegistrationDate;
