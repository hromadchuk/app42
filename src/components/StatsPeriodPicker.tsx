import { OwnerRow } from './OwnerRow.tsx';
import { Button, Center, Divider, Flex, SimpleGrid, Stack, Text } from '@mantine/core';
import { declineAndFormat, TOwnerInfo } from '../lib/helpers.ts';
import React, { useContext } from 'react';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { DatePicker } from '@mantine/dates';
import { getAppLangCode } from '../lib/lang.ts';
import { IPeriodData, TPeriodType } from '../lib/methods/messages.ts';

interface IStatsPeriodPickerProps {
    selectedPeer: TOwnerInfo;
    statsPeriod: TPeriodType;
    statsPeriods: IPeriodData[];
    setStatsPeriod: React.Dispatch<React.SetStateAction<TPeriodType>>;
    calcStatistic: () => {};
}

export function StatsPeriodPicker({
    selectedPeer,
    statsPeriod,
    statsPeriods,
    setStatsPeriod,
    calcStatistic
}: IStatsPeriodPickerProps) {
    const { mt, md } = useContext(MethodContext);

    function setDatePeriod(period: IPeriodData) {
        setStatsPeriod([new Date(period.periodDate * 1000), new Date()]);
    }

    function getButtons(list: IPeriodData[]) {
        return list.map((period, key) => (
            <Button
                size="md"
                fullWidth
                variant="default"
                key={key}
                disabled={period.disabled}
                onClick={() => setDatePeriod(period)}
            >
                <Stack gap={0} align="center">
                    <Text size="sm">{mt(`periods.${period.period}`)}</Text>
                    <Text c="dimmed" size="xs">
                        {period.circa ? '~' : ''}
                        {declineAndFormat(period.count, md('decline.stats'))}
                    </Text>
                </Stack>
            </Button>
        ));
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

                    {getButtons(statsPeriods.slice(statsPeriods.length - 1))}

                    <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs">
                        {getButtons(statsPeriods.slice(0, statsPeriods.length - 1))}
                    </SimpleGrid>
                </Flex>
            </Flex>
        </>
    );
}
