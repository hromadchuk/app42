import { AreaChart, BarChart } from '@mantine/charts';
import { Button, Container, Divider, Flex, Group, SegmentedControl, Text, Title } from '@mantine/core';
import {
    IconBrandTether,
    IconDiamond,
    IconInfoSquareRounded,
    IconTransfer,
    TablerIconsProps
} from '@tabler/icons-react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import { modals } from '@mantine/modals';
import { useContext, useEffect, useState } from 'react';
import { JettonTransferAction } from 'tonapi-sdk-js';
import { TonApiCall } from '../lib/TonApi.ts';
import { formatNumber, formatNumberFloat } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

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

interface IDexChartItem {
    [EDexNames.STON]?: number;
    [EDexNames.DEDUST]?: number;
    [EDexNames.MEGATON]?: number;
}

interface IChartData {
    data: IChartItem[];
    series: { name: string; label: string; color: string }[];
}

interface IDexChartData {
    data: IDexChartItem[];
    series: { name: string; label: string; color: string }[];
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
    const [wallet] = useTonConnectUI();
    const userWallet = wallet.account?.address as string;

    useEffect(() => {
        (async () => {
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
            const months = Object.keys(calc.months).sort(
                (a, b) => dayjs(b, 'MM.YYYY').unix() - dayjs(a, 'MM.YYYY').unix()
            );
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
        })();
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

    function getChartData(): IChartData {
        const walletStat = stat as IStatResult;
        const isTON = selectedChartCurrency === 'TON';
        const selectedCurrency = isTON ? walletStat.chartDataTON : walletStat.chartDataUSDT;
        const selectedPeriod = selectedChartPeriod === 'months' ? selectedCurrency.months : selectedCurrency.years;
        const firstColor = isTON ? 'blue.3' : 'teal.4';
        const secondColor = isTON ? 'blue.9' : 'teal.9';

        return {
            data: selectedPeriod,
            series: [
                {
                    name: 'sent',
                    label: mt('sent'),
                    color: firstColor
                },
                {
                    name: 'received',
                    label: mt('received'),
                    color: secondColor
                }
            ]
        };
    }

    function getDexChartData(): IDexChartData {
        const walletStat = stat as IStatResult;
        const dexData = walletStat.total.dex;
        const keys = Object.keys(dexData) as EDexNames[];
        const dexColors = {
            [EDexNames.STON]: 'blue.6',
            [EDexNames.DEDUST]: 'orange.6',
            [EDexNames.MEGATON]: 'teal.6'
        };

        const dataRow: { [key: string]: number } = {};
        const series = [];

        for (const key of keys) {
            dataRow[key] = dexData[key];
            series.push({
                name: key,
                label: dexNames[key],
                color: dexColors[key]
            });
        }

        console.log('dataRow', dataRow);
        console.log('series', series);

        return {
            data: [dataRow],
            series
        };
    }

    function openPeriod(title: string, period: IStatPeriod) {
        modals.open({
            title,
            children: (
                <>
                    <Title order={4}>{mt('counts')}</Title>
                    <CountBlock {...period} />

                    <Title order={4} mt="md">
                        {mt('events')}
                    </Title>
                    <EventsBlock {...period} />
                </>
            )
        });
    }

    function InfoRow(item: {
        icon?: (props: TablerIconsProps) => JSX.Element;
        iconColor?: string;
        label: string;
        value: string;
    }) {
        return (
            <Flex gap="md" p={5} justify="flex-start" align="center" direction="row" wrap="wrap">
                {item.icon && <item.icon size={14} color={item.iconColor} />}
                <Text size="sm" inline>
                    {item.label}
                </Text>

                <Container p={0} mr={0}>
                    <Text size="12px" c="dimmed">
                        {item.value}
                    </Text>
                </Container>
            </Flex>
        );
    }

    function CountBlock(period: IStatPeriod) {
        return (
            <>
                <InfoRow icon={IconTransfer} label={mt('total_events')} value={formatNumberFloat(period.eventsCount)} />
                <Divider my={3} />
                <InfoRow
                    icon={IconDiamond}
                    iconColor="var(--mantine-color-blue-6)"
                    label={mt('sent_ton')}
                    value={formatNumberFloat(period.sentTON)}
                />
                <Divider my={3} />
                <InfoRow
                    icon={IconDiamond}
                    iconColor="var(--mantine-color-blue-6)"
                    label={mt('received_ton')}
                    value={formatNumberFloat(period.receivedTON)}
                />
                <Divider my={3} />
                <InfoRow
                    icon={IconBrandTether}
                    iconColor="var(--mantine-color-teal-7)"
                    label={mt('sent_usdt')}
                    value={formatNumberFloat(period.sentUSDT)}
                />
                <Divider my={3} />
                <InfoRow
                    icon={IconBrandTether}
                    iconColor="var(--mantine-color-teal-7)"
                    label={mt('received_usdt')}
                    value={formatNumberFloat(period.receivedUSDT)}
                />
            </>
        );
    }

    function EventsBlock(period: IStatPeriod) {
        const actions = Object.keys(period.actions);

        return actions
            .sort((a, b) => period.actions[b] - period.actions[a])
            .map((action, key) => (
                <div key={key}>
                    {key > 0 && <Divider my={3} />}
                    <InfoRow label={action} value={formatNumberFloat(period.actions[action])} />
                </div>
            ));
    }

    if (needHideContent()) return null;

    if (stat) {
        const chart = getChartData();
        const dexChart = getDexChartData();

        console.log('dexChart', dexChart);

        return (
            <>
                <Title order={4}>{mt('total_counts')}</Title>
                <CountBlock {...stat.total} />

                <Title order={4} mt="md">
                    {mt('total_events')}
                </Title>
                <EventsBlock {...stat.total} />

                <Title mt="md" order={4}>
                    {mt('chart')}
                </Title>
                {stat.needShowPeriodSegment && (
                    <SegmentedControl
                        fullWidth
                        size="xs"
                        data={[
                            {
                                value: 'months',
                                label: mt('by_months')
                            },
                            {
                                value: 'years',
                                label: mt('by_years')
                            }
                        ]}
                        onChange={setSelectedChartPeriod}
                    />
                )}
                {stat.needShowCurrencySegment && (
                    <SegmentedControl fullWidth size="xs" data={['TON', 'USDT']} onChange={setSelectedChartCurrency} />
                )}
                <AreaChart
                    h={300}
                    mt="md"
                    data={chart.data}
                    dataKey="label"
                    withLegend
                    legendProps={{ verticalAlign: 'bottom', height: 50 }}
                    tooltipProps={{ labelFormatter: (value) => formatNumberFloat(value) }}
                    series={chart.series}
                    curveType="bump"
                />

                {dexChart.data.length > 0 && (
                    <>
                        <Title mt="md" order={4}>
                            {mt('dex_events')}
                        </Title>
                        <BarChart
                            h={100}
                            data={dexChart.data}
                            dataKey="month"
                            type="percent"
                            orientation="vertical"
                            withLegend
                            legendProps={{ verticalAlign: 'bottom', height: 50 }}
                            series={dexChart.series}
                            tickLine="none"
                            gridAxis="none"
                            withXAxis={false}
                            withYAxis={false}
                        />
                    </>
                )}

                {stat.yearsKeys.length > 1 && (
                    <>
                        <Title mt="md" order={4}>
                            {mt('grouped_by_years')}
                        </Title>

                        {stat.yearsKeys.map((year, key) => (
                            <div key={key}>
                                {key > 0 && <Divider my={3} />}
                                <Button
                                    variant="subtle"
                                    justify="space-between"
                                    rightSection={
                                        <Group>
                                            <Text c="dimmed" size="xs">
                                                {formatNumber(stat.years[year].eventsCount)}
                                            </Text>
                                            <IconInfoSquareRounded size={16} />
                                        </Group>
                                    }
                                    fullWidth
                                    onClick={() => openPeriod(year, stat.years[year])}
                                >
                                    {year}
                                </Button>
                            </div>
                        ))}
                    </>
                )}

                {stat.monthsKeys.length > 1 && (
                    <>
                        <Title mt="md" order={4}>
                            {mt('grouped_by_months')}
                        </Title>

                        {stat.monthsKeys.map((month, key) => (
                            <div key={key}>
                                {key > 0 && <Divider my={3} />}
                                <Button
                                    variant="subtle"
                                    justify="space-between"
                                    rightSection={
                                        <Group>
                                            <Text c="dimmed" size="xs">
                                                {formatNumber(stat.months[month].eventsCount)}
                                            </Text>
                                            <IconInfoSquareRounded size={16} />
                                        </Group>
                                    }
                                    fullWidth
                                    onClick={() => {
                                        openPeriod(dayjs(month, 'MM.YYYY').format('MMM YY'), stat.months[month]);
                                    }}
                                >
                                    {dayjs(month, 'MM.YYYY').format('MMM YY')}
                                </Button>
                            </div>
                        ))}
                    </>
                )}
            </>
        );
    }

    return null;
}
