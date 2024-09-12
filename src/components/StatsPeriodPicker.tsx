import { Dispatch, SetStateAction, useContext } from 'react';
import { Button, InlineButtons, Section } from '@telegram-apps/telegram-ui';
import { SectionHeader } from '@telegram-apps/telegram-ui/dist/components/Blocks/Section/components/SectionHeader/SectionHeader';
import { InlineButtonsItem } from '@telegram-apps/telegram-ui/dist/components/Blocks/InlineButtons/components/InlineButtonsItem/InlineButtonsItem';
import { formatNumber } from '../lib/helpers.ts';
import { IPeriodData, TPeriodType } from '../lib/methods/messages.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import commonClasses from '../styles/Common.module.css';
import { DateSelector } from './DateSelector.tsx';

interface IStatsPeriodPickerProps {
    statsPeriod: TPeriodType;
    statsPeriods: IPeriodData[];
    setStatsPeriod: Dispatch<SetStateAction<TPeriodType>>;
    calcStatistic: () => {};
}

export function StatsPeriodPicker({
    statsPeriod,
    statsPeriods,
    setStatsPeriod,
    calcStatistic
}: IStatsPeriodPickerProps) {
    const { mt } = useContext(MethodContext);

    function setDatePeriod(period: IPeriodData) {
        setStatsPeriod([new Date(period.periodDate * 1000), new Date()]);
    }

    function getButtons(list: IPeriodData[]) {
        return list.map((period, key) => (
            <InlineButtonsItem
                key={key}
                mode="bezeled"
                text={`${period.circa ? '~' : ''}${formatNumber(period.count)}`}
                disabled={period.count === 0}
                onClick={() => setDatePeriod(period)}
                style={{
                    flex: '1 0 100px'
                }}
            >
                {mt(`periods.${period.period}`)}
            </InlineButtonsItem>
        ));
    }

    return (
        <Section className={commonClasses.sectionBox}>
            <SectionHeader style={{ paddingLeft: 10 }}>{mt('headers.period')}</SectionHeader>

            <DateSelector dates={statsPeriod} onChange={setStatsPeriod} />

            <Button
                mode="filled"
                size="m"
                stretched
                disabled={!statsPeriod.filter((period) => period !== null).length}
                onClick={() => calcStatistic()}
                style={{
                    margin: '10px 0'
                }}
            >
                {mt('get_stats')}
            </Button>

            <InlineButtons
                style={{
                    display: 'flex',
                    gap: 12,
                    width: 'fit-content',
                    flexWrap: 'wrap',
                    marginBottom: 10
                }}
            >
                {getButtons(statsPeriods)}
            </InlineButtons>
        </Section>
    );
}
