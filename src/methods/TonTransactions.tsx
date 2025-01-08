import { useContext, useState } from 'react';
import { Modal, Section, SegmentedControl } from '@telegram-apps/telegram-ui';
import { SegmentedControlItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/SegmentedControl/components/SegmentedControlItem/SegmentedControlItem';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconBrandTether, IconDiamond, IconTransfer } from '@tabler/icons-react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import { BarChart, LineChart } from 'react-chartkick';
import { JettonTransferAction } from 'tonapi-sdk-js';
import { WrappedCell } from '../components/Helpers.tsx';
import { useAsyncEffect } from '../hooks/useAsyncEffect.ts';
import { TonApiCall } from '../lib/TonApi.ts';
import { classNames, formatNumber, formatNumberFloat } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface IStatPeriod {
    eventsCount: number;
    sentTON: number;
    receivedTON: number;
    sentUSDT: number;
    receivedUSDT: number;
    actions: {
        [key: string]: number;
    };
    dex: {
        [key: string]: number;
    };
}

enum EDexNames {
    STON = 'stonfi',
    DEDUST = 'dedust',
    MEGATON = 'megatonfi'
}

interface IStatCalc {
    total: IStatPeriod;
    years: {
        [key: string]: IStatPeriod;
    };
    months: {
        [key: string]: IStatPeriod;
    };
}

interface IChartItem {
    date: number;
    label: string;
    sent: number;
    received: number;
}

interface IStatResult extends IStatCalc {
    needShowPeriodSegment: boolean;
    needShowCurrencySegment: boolean;
    yearsKeys: string[];
    monthsKeys: string[];
    chartDataTON: {
        months: IChartItem[];
        years: IChartItem[];
    };
    chartDataUSDT: {
        months: IChartItem[];
        years: IChartItem[];
    };
}

const USDT_WALLET = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
const dexNames = {
    [EDexNames.STON]: 'STON.fi',
    [EDexNames.DEDUST]: 'DeDust.io',
    [EDexNames.MEGATON]: 'Megaton Finance'
};

export default function TonTransactions() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [stat, setStat] = useState<IStatResult | null>(null);
    const [selectedChartPeriod, setSelectedChartPeriod] = useState<string>('months');
    const [selectedChartCurrency, setSelectedChartCurrency] = useState<string>('TON');
    const [selectedPeriod, setSelectedPeriod] = useState<IStatPeriod | null>(null);
    const [wallet] = useTonConnectUI();
    const userWallet = wallet.account?.address as string;

    useAsyncEffect(async () => {
        setProgress({ text: mt('get_events') });

        const events = await TonApiCall.getEvents(userWallet, setProgress);
        const calc: IStatCalc = {
            total: getEmptyPeriod(),
            years: {},
            months: {}
        };

        if (!events.length) {
            setProgress(null);
            setFinishBlock({ state: 'error', text: mt('no_transactions') });
            return;
        }

        events.sort((a, b) => b.timestamp - a.timestamp);

        events.forEach((event) => {
            const month = dayjs(event.timestamp * 1000).format('MM.YYYY');
            const year = dayjs(event.timestamp * 1000).format('YYYY');

            if (!calc.years[year]) {
                calc.years[year] = getEmptyPeriod();
            }

            if (!calc.months[month]) {
                calc.months[month] = getEmptyPeriod();
            }

            [calc.total, calc.years[year], calc.months[month]].forEach((period) => {
                period.eventsCount++;

                event.actions.forEach((action) => {
                    if (!period.actions[action.type]) {
                        period.actions[action.type] = 0;
                    }

                    period.actions[action.type]++;

                    if (action.type === 'JettonSwap') {
                        const dex = action.JettonSwap?.dex as string;

                        if (!period.dex[dex]) {
                            period.dex[dex] = 0;
                        }

                        period.dex[dex]++;
                    }

                    if (action.type === 'TonTransfer') {
                        const isRecipient = action.TonTransfer?.recipient.address === userWallet;
                        const amount = Number(action.TonTransfer?.amount) / 1e9;

                        if (amount) {
                            if (isRecipient) {
                                period.receivedTON += amount;
                            } else {
                                period.sentTON += amount;
                            }
                        }
                    }

                    if (action.type === 'JettonTransfer') {
                        if (action.JettonTransfer?.jetton.address === USDT_WALLET) {
                            const point = `1${new Array(action.JettonTransfer?.jetton.decimals).fill(0).join('')}`;
                            const amount = Number(action.JettonTransfer?.amount) / Number(point);
                            const isRecipient = action.JettonTransfer?.recipient?.address === userWallet;

                            if (amount) {
                                if (isRecipient) {
                                    period.receivedUSDT += amount;
                                } else {
                                    period.sentUSDT += amount;
                                }
                            }
                        } else {
                            const dex = detectDexName(action.JettonTransfer as JettonTransferAction);
                            if (dex) {
                                if (!period.dex[dex]) {
                                    period.dex[dex] = 0;
                                }

                                period.dex[dex]++;
                            }
                        }
                    }
                });
            });
        });

        const years = Object.keys(calc.years).sort((a, b) => Number(b) - Number(a));
        const months = Object.keys(calc.months).sort((a, b) => dayjs(b, 'MM.YYYY').unix() - dayjs(a, 'MM.YYYY').unix());
        const result: IStatResult = {
            total: calc.total,
            years: calc.years,
            months: calc.months,
            needShowPeriodSegment: true,
            needShowCurrencySegment: true,
            yearsKeys: years,
            monthsKeys: months,
            chartDataTON: {
                months: [],
                years: []
            },
            chartDataUSDT: {
                months: [],
                years: []
            }
        };

        result.needShowPeriodSegment = years.length > 1;
        result.needShowCurrencySegment = calc.total.sentUSDT > 0 || calc.total.receivedUSDT > 0;

        result.chartDataTON.years = years
            .map((year) => ({
                date: Number(year),
                label: String(year),
                sent: fixedNumber(calc.years[year].sentTON),
                received: fixedNumber(calc.years[year].receivedTON)
            }))
            .sort((a, b) => a.date - b.date);
        result.chartDataTON.months = months
            .slice(0, 12)
            .map((month) => ({
                date: dayjs(month, 'MM.YYYY').unix(),
                label: dayjs(month, 'MM.YYYY').format('MMM YY'),
                sent: fixedNumber(calc.months[month].sentTON),
                received: fixedNumber(calc.months[month].receivedTON)
            }))
            .sort((a, b) => a.date - b.date);

        result.chartDataUSDT.years = years
            .map((year) => ({
                date: Number(year),
                label: String(year),
                sent: fixedNumber(calc.years[year].sentUSDT),
                received: fixedNumber(calc.years[year].receivedUSDT)
            }))
            .sort((a, b) => a.date - b.date);
        result.chartDataUSDT.months = months
            .slice(0, 12)
            .map((month) => ({
                date: dayjs(month, 'MM.YYYY').unix(),
                label: dayjs(month, 'MM.YYYY').format('MMM YY'),
                sent: fixedNumber(calc.months[month].sentUSDT),
                received: fixedNumber(calc.months[month].receivedUSDT)
            }))
            .sort((a, b) => a.date - b.date);

        setStat(result);
        setProgress(null);
    }, []);

    function fixedNumber(num: number) {
        return parseFloat(num.toFixed(2));
    }

    function getEmptyPeriod(): IStatPeriod {
        return {
            eventsCount: 0,
            sentTON: 0,
            receivedTON: 0,
            sentUSDT: 0,
            receivedUSDT: 0,
            actions: {},
            dex: {}
        };
    }

    function detectDexName(action: JettonTransferAction): EDexNames | null {
        if (action.comment) {
            if (action.comment.includes('DedustSwap')) {
                return EDexNames.DEDUST;
            }
        }

        const senderName = (action.sender?.name || '').toLowerCase();
        const recipientName = (action.recipient?.name || '').toLowerCase();

        if (senderName.includes('ston.fi') || recipientName.includes('ston.fi')) {
            return EDexNames.STON;
        }

        return null;
    }

    function getChartData() {
        const walletStat = stat as IStatResult;
        const isTON = selectedChartCurrency === 'TON';
        const selectedCurrency = isTON ? walletStat.chartDataTON : walletStat.chartDataUSDT;
        const chartPeriod = selectedChartPeriod === 'months' ? selectedCurrency.months : selectedCurrency.years;
        const firstColor = isTON ? '#289ed0' : '#28b980';
        const secondColor = isTON ? '#095584' : '#1f6b4d';
        const sentData: { [key: string]: number } = {};
        const receivedData: { [key: string]: number } = {};

        chartPeriod.forEach((item) => {
            const date = selectedChartPeriod === 'months' ? dayjs(item.date * 1000).format('YYYY-MM-DD') : item.label;

            sentData[date] = item.sent;
            receivedData[date] = item.received;
        });

        return [
            { name: mt('sent'), data: sentData, color: firstColor },
            { name: mt('received'), data: receivedData, color: secondColor }
        ];
    }

    function getDexChartData() {
        const walletStat = stat as IStatResult;
        const dexData = walletStat.total.dex;
        const keys = Object.keys(dexData) as EDexNames[];
        const dexColors = {
            [EDexNames.STON]: '#3cadf9',
            [EDexNames.DEDUST]: '#d57f14',
            [EDexNames.MEGATON]: '#2b43a0'
        };

        const dataRow: { [key: string]: number } = {};
        const series = [];

        const data: [string, number][] = [];
        const colors: string[] = [];

        for (const key of keys) {
            dataRow[key] = dexData[key];
            series.push({
                name: key,
                label: dexNames[key],
                color: dexColors[key]
            });

            data.push([dexNames[key], dexData[key]]);
            colors.push(dexColors[key]);
        }

        return { data, colors };
    }

    function CountBlock(period: IStatPeriod, header: string, className?: string) {
        return (
            <Section className={className} header={header}>
                <WrappedCell before={<IconTransfer />} after={formatNumberFloat(period.eventsCount)}>
                    {mt('total_events')}
                </WrappedCell>

                {period.sentTON > 0 && (
                    <WrappedCell before={<IconDiamond color="#095584" />} after={formatNumberFloat(period.sentTON)}>
                        {mt('sent_ton')}
                    </WrappedCell>
                )}

                {period.receivedTON > 0 && (
                    <WrappedCell before={<IconDiamond color="#095584" />} after={formatNumberFloat(period.receivedTON)}>
                        {mt('received_ton')}
                    </WrappedCell>
                )}

                {period.sentUSDT > 0 && (
                    <WrappedCell
                        before={<IconBrandTether color="#1f6b4d" />}
                        after={formatNumberFloat(period.sentUSDT)}
                    >
                        {mt('sent_usdt')}
                    </WrappedCell>
                )}

                {period.receivedUSDT > 0 && (
                    <WrappedCell
                        before={<IconBrandTether color="#1f6b4d" />}
                        after={formatNumberFloat(period.receivedUSDT)}
                    >
                        {mt('received_usdt')}
                    </WrappedCell>
                )}
            </Section>
        );
    }

    function EventsBlock(period: IStatPeriod, header: string, className?: string) {
        const actions = Object.keys(period.actions);

        return (
            <Section className={className} header={header}>
                {actions
                    .sort((a, b) => period.actions[b] - period.actions[a])
                    .map((action, key) => (
                        <WrappedCell key={key} after={formatNumberFloat(period.actions[action])}>
                            {action}
                        </WrappedCell>
                    ))}
            </Section>
        );
    }

    if (needHideContent()) return null;

    if (stat) {
        const chartData = getChartData();
        const dexChart = getDexChartData();

        return (
            <>
                {CountBlock(stat.total, mt('total_counts'), classNames(commonClasses.sectionBox, commonClasses.showHr))}

                {EventsBlock(
                    stat.total,
                    mt('total_events'),
                    classNames(commonClasses.sectionBox, commonClasses.showHr)
                )}

                <Section className={commonClasses.sectionBox} header={mt('chart')}>
                    <div style={{ padding: 10 }}>
                        {stat.needShowPeriodSegment && (
                            <SegmentedControl className={commonClasses.tinySegment}>
                                <SegmentedControlItem
                                    onClick={() => setSelectedChartPeriod('months')}
                                    selected={selectedChartPeriod === 'months'}
                                >
                                    {mt('by_months')}
                                </SegmentedControlItem>
                                <SegmentedControlItem
                                    onClick={() => setSelectedChartPeriod('years')}
                                    selected={selectedChartPeriod === 'years'}
                                >
                                    {mt('by_years')}
                                </SegmentedControlItem>
                            </SegmentedControl>
                        )}

                        {stat.needShowCurrencySegment && (
                            <SegmentedControl className={commonClasses.tinySegment}>
                                <SegmentedControlItem
                                    onClick={() => setSelectedChartCurrency('TON')}
                                    selected={selectedChartCurrency === 'TON'}
                                >
                                    TON
                                </SegmentedControlItem>
                                <SegmentedControlItem
                                    onClick={() => setSelectedChartCurrency('USDT')}
                                    selected={selectedChartCurrency === 'USDT'}
                                >
                                    USDT
                                </SegmentedControlItem>
                            </SegmentedControl>
                        )}

                        <LineChart data={chartData} />
                    </div>
                </Section>

                {dexChart.data.length > 0 && (
                    <Section className={commonClasses.sectionBox} header={mt('dex_events')}>
                        <div style={{ padding: 10 }}>
                            <BarChart data={dexChart.data} colors={dexChart.colors} />
                        </div>
                    </Section>
                )}

                {stat.yearsKeys.length > 1 && (
                    <Section className={commonClasses.sectionBox} header={mt('grouped_by_years')}>
                        {stat.yearsKeys.map((year, key) => (
                            <WrappedCell
                                key={key}
                                after={formatNumber(stat.years[year].eventsCount)}
                                onClick={() => {
                                    setSelectedPeriod(stat.years[year]);
                                }}
                            >
                                {year}
                            </WrappedCell>
                        ))}
                    </Section>
                )}

                {stat.monthsKeys.length > 1 && (
                    <Section className={commonClasses.sectionBox} header={mt('grouped_by_months')}>
                        {stat.monthsKeys.map((month, key) => (
                            <WrappedCell
                                key={key}
                                after={formatNumber(stat.months[month].eventsCount)}
                                onClick={() => {
                                    setSelectedPeriod(stat.months[month]);
                                }}
                            >
                                {dayjs(month, 'MM.YYYY').format('MMM YY')}
                            </WrappedCell>
                        ))}
                    </Section>
                )}

                {selectedPeriod && (
                    <Modal
                        header={<ModalHeader />}
                        open={Boolean(selectedPeriod)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedPeriod(null);
                            }
                        }}
                    >
                        {CountBlock(selectedPeriod, mt('counts'))}
                        {EventsBlock(selectedPeriod, mt('events'))}
                    </Modal>
                )}
            </>
        );
    }
}
