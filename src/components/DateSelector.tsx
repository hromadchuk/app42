import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Caption } from '@telegram-apps/telegram-ui';
import { Locale } from 'react-date-object';
import { Calendar, DateObject } from 'react-multi-date-picker';
import dayjs from 'dayjs';
import weekends from 'react-multi-date-picker/plugins/highlight_weekends';
import { getAppLangCode, LangType, t, to } from '../lib/lang.ts';
import { TPeriodType } from '../lib/methods/messages.ts';

import commonClasses from '../styles/Common.module.css';
import '../styles/DateSelector.css';

interface IDateRangeSelectorProps {
    dates: TPeriodType;
    onChange: Dispatch<SetStateAction<TPeriodType>>;
}

export function DateSelector({ dates, onChange }: IDateRangeSelectorProps) {
    const [values, setValues] = useState<Date[]>([]);

    useEffect(() => {
        setValues([...(dates.filter(Boolean) as Date[])]);
    }, [dates]);

    function SelectedPeriodRow() {
        if (!values.length) {
            return null;
        }

        const text: string[] = [];

        if (values.length === 1 || dayjs(values[0]).format('LL') === dayjs(values[1]).format('LL')) {
            text.push(dayjs(values[0]).format('LL'));
        } else {
            if (Number(values[0])) {
                text.push(dayjs(values[0]).format('LL'));
            } else {
                text.push(t('date_selector.created'));
            }

            text.push(dayjs(values[1]).format('LL'));
        }

        return (
            <Caption level="1" weight="3" className={commonClasses.footerCount}>
                {text.join(' — ')}
            </Caption>
        );
    }

    return (
        <>
            <Calendar
                value={values}
                weekStartDayIndex={getAppLangCode() === LangType.RU ? 1 : 0}
                highlightToday={false}
                disableYearPicker={true}
                disableMonthPicker={true}
                maxDate={new DateObject()}
                onChange={(e) => {
                    const selectedDates = e.map((item) => item.toDate());

                    setValues(selectedDates);
                    onChange(selectedDates as TPeriodType);
                }}
                range
                plugins={[weekends()]}
                locale={{
                    ...to<Locale>('date_selector'),
                    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                }}
            />

            {SelectedPeriodRow()}
        </>
    );
}
