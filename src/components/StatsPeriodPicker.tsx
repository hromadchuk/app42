import { OwnerRow } from './OwnerRow.tsx';
import { Button, Center, Divider, Flex, Text } from '@mantine/core';
import { IconCalendarTime } from '@tabler/icons-react';
import { declineAndFormat, TOwnerInfo } from '../lib/helpers.ts';
import React, { useContext } from 'react';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { DatePicker } from '@mantine/dates';
import { getAppLangCode } from '../lib/lang.ts';
import { IPeriodData, TPeriodType } from '../lib/methods/messages.ts';

export function StatsPeriodPicker({
    selectedPeer,
    statsPeriod,
    statsPeriods,
    setStatsPeriod,
    calcStatistic
}: {
    selectedPeer: TOwnerInfo;
    statsPeriod: TPeriodType;
    statsPeriods: IPeriodData[];
    setStatsPeriod: React.Dispatch<React.SetStateAction<TPeriodType>>;
    calcStatistic: () => {};
}) {
    const { mt, md } = useContext(MethodContext);

    function setDatePeriod(period: IPeriodData) {
        setStatsPeriod([new Date(period.periodDate * 1000), new Date()]);
    }

    return (
        <>
            <OwnerRow owner={selectedPeer} withoutLink={true} />

            <Divider my="xs" label={mt('headers.period')} labelPosition="center" mb={0} />
            <Flex direction="column" gap="xl">
                <Center>
                    <DatePicker type="range" value={statsPeriod} onChange={setStatsPeriod} locale={getAppLangCode()} />
                </Center>

                <Flex direction="column" gap="xs">
                    <Button
                        size="md"
                        fullWidth
                        component="button"
                        disabled={!statsPeriod.filter((period) => period !== null).length}
                        onClick={() => calcStatistic()}
                    >
                        {mt('get_stats')}
                    </Button>
                    {statsPeriods.map((period, key) => (
                        <Button
                            leftSection={<IconCalendarTime />}
                            size="md"
                            fullWidth
                            variant="default"
                            justify="space-between"
                            component="button"
                            key={key}
                            disabled={period.disabled}
                            onClick={() => setDatePeriod(period)}
                        >
                            <Flex gap="xs">
                                <Text lineClamp={1} span fz="sm" fw={500}>
                                    {mt(`periods.${period.period}`)}
                                </Text>
                                <Text c="dimmed" fz="xs">
                                    {period.circa ? '~' : ''}({declineAndFormat(period.count, md('decline.stats'))})
                                </Text>
                            </Flex>
                        </Button>
                    ))}
                </Flex>
            </Flex>
        </>
    );
}
