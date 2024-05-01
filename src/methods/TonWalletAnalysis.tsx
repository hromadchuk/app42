import { useContext, useEffect, useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';

import { AvailableBalancePeriods, TonApiCall } from '../lib/TonApi.ts';
import dayjs from 'dayjs';
import { Account, DomainNames } from 'tonapi-sdk-js';
import { AreaChart, ChartData } from '@mantine/charts';
import { convertTonValueToHumanReadable } from '../lib/helpers.ts';
import {
    ActionIcon,
    Box,
    Burger,
    Button,
    CopyButton,
    Divider,
    Group,
    LoadingOverlay,
    NativeSelect,
    NumberInput,
    Overlay,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Tooltip
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import TonBalance from '../components/TonBalance.tsx';
import { MethodContext } from '../contexts/MethodContext.tsx';
import classes from '../styles/TonWalletAnalysis.module.css';
import { useDisclosure } from '@mantine/hooks';

interface IBalanceChartItem extends ChartData {
    date: string;
    balance: number;
}

type BalanceChartDataType = IBalanceChartItem[];

const CHART_DATE_FORMAT = 'L';

function AddressRow({ address, text }: { address: string; text: string }) {
    const { mt } = useContext(MethodContext);

    return (
        <CopyButton value={address} timeout={2000}>
            {({ copied, copy }) => (
                <InfoRow header={text} content={address}>
                    <Tooltip label={copied ? mt('copied') : mt('copy')} withArrow position="right">
                        <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? (
                                <IconCheck className={classes.copyIcon} />
                            ) : (
                                <IconCopy className={classes.copyIcon} />
                            )}
                        </ActionIcon>
                    </Tooltip>
                </InfoRow>
            )}
        </CopyButton>
    );
}

function InfoRow({ children, header, content }: { children?: JSX.Element; header: string; content?: string }) {
    return (
        <Stack gap={0}>
            <HeaderText text={header} />
            <Group gap={0} wrap="nowrap">
                <Text className={classes.infoRowText}>{content}</Text>
                {children}
            </Group>
        </Stack>
    );
}

function HeaderText({ text }: { text: string }) {
    return <Text className={classes.infoRowHeaderText}>{text}</Text>;
}

export const TonWalletAnalysis = () => {
    const userFriendlyAddress = useTonAddress();
    const [wallet, setWallet] = useState<Account | null>(null);
    const [domains, setDomains] = useState<DomainNames | null>(null);
    const [balanceChartData, setBalanceChartData] = useState<BalanceChartDataType | null>(null);
    const [chartDataPending, setChartDataPending] = useState<boolean>(true);
    const [chartLoadingPassedSteps, setChartLoadingPassedSteps] = useState<string | null>(null);
    const [step, setStep] = useState<AvailableBalancePeriods>(AvailableBalancePeriods.month);
    const [stepSize] = useState<number>(1);
    const [stepsCount, setStepsCount] = useState<number>(5);

    const { mt } = useContext(MethodContext);
    const [isChartSettingsOpened, { toggle: toggleChartSettings }] = useDisclosure();

    useEffect(() => {
        getWalletData();
    }, []);

    async function getWalletData() {
        const activeWallet = await TonApiCall.getWallet(userFriendlyAddress);
        setWallet(activeWallet);
        setDomains(await TonApiCall.getDomains(userFriendlyAddress));

        await updateChartData(activeWallet.balance);
    }

    async function updateChartData(currentBalance = wallet?.balance) {
        const startDate = dayjs();
        let currentChartLoadingStep = 0;

        if (currentBalance === undefined) {
            return;
        }

        setChartDataPending(true);
        setChartLoadingPassedSteps(null);
        const balanceChanges = [] as BalanceChartDataType;
        let latestBalance = currentBalance;

        for await (const balanceChange of TonApiCall.getBalanceChange(
            userFriendlyAddress,
            startDate,
            step,
            stepSize,
            stepsCount
        )) {
            currentChartLoadingStep++;
            setChartLoadingPassedSteps(`${currentChartLoadingStep}/${stepsCount}`);

            latestBalance -= balanceChange.value;

            balanceChanges.unshift({
                date: dayjs(balanceChange.date * 1000).format(CHART_DATE_FORMAT),
                balance: convertTonValueToHumanReadable(latestBalance)
            } as IBalanceChartItem);
        }

        balanceChanges.push({
            date: dayjs().format(CHART_DATE_FORMAT),
            balance: convertTonValueToHumanReadable(currentBalance)
        } as IBalanceChartItem);

        setChartDataPending(false);
        setBalanceChartData(balanceChanges);
    }

    return (
        <>
            <Stack>
                <AddressRow address={userFriendlyAddress} text={mt('address')} />
                <Divider />
                <Skeleton visible={!wallet}>
                    <AddressRow address={wallet?.address ?? ''} text={mt('full_address')} />
                </Skeleton>
                <Divider />
                {wallet?.name ? (
                    <>
                        <InfoRow header={mt('name')} content={wallet?.name} />
                        <Divider />
                    </>
                ) : (
                    <></>
                )}
                <Skeleton visible={!wallet}>
                    <InfoRow header={mt('balance')}>
                        <TonBalance value={wallet?.balance} />
                    </InfoRow>
                </Skeleton>
                <Divider />
                <Skeleton visible={!wallet}>
                    <InfoRow
                        header={mt('last_activity')}
                        content={
                            wallet?.last_activity ? dayjs(wallet.last_activity * 1000).format('LLLL') : mt('never')
                        }
                    />
                </Skeleton>

                {!domains || domains.domains.length !== 0 ? (
                    <>
                        <Divider />
                        <Skeleton visible={!domains}>
                            <InfoRow header={mt('domains')}>
                                <Stack>
                                    {domains?.domains.map((domain) => {
                                        return (
                                            <>
                                                <Text>{domain}</Text>
                                            </>
                                        );
                                    })}
                                </Stack>
                            </InfoRow>
                        </Skeleton>
                    </>
                ) : (
                    <></>
                )}
                <Divider />
                <HeaderText text={mt('balance_changes')} />
                <Box pos="relative">
                    <ThemeIcon className={classes.chartBurgerIcon}>
                        <Burger opened={isChartSettingsOpened} onClick={toggleChartSettings} />
                    </ThemeIcon>
                    <LoadingOverlay
                        visible={chartDataPending}
                        zIndex={1000}
                        overlayProps={{ radius: 'sm', blur: 2 }}
                        loaderProps={{
                            children: chartLoadingPassedSteps
                                ? mt('chart_loading').replace('{step}', chartLoadingPassedSteps)
                                : chartLoadingPassedSteps
                        }}
                    ></LoadingOverlay>
                    {isChartSettingsOpened ? (
                        <Overlay zIndex={9}>
                            <Stack h="100%" justify="center" align="center">
                                <NativeSelect
                                    className={classes.chartInput}
                                    label={mt('chart_interval')}
                                    value={step}
                                    onChange={(event) => setStep(event.currentTarget.value as AvailableBalancePeriods)}
                                    data={[
                                        AvailableBalancePeriods.day,
                                        AvailableBalancePeriods.week,
                                        AvailableBalancePeriods.month,
                                        AvailableBalancePeriods.year
                                    ]}
                                />
                                <NumberInput
                                    className={classes.chartInput}
                                    label={mt('chart_divisions_count')}
                                    allowNegative={false}
                                    min={2}
                                    max={31}
                                    defaultValue={stepsCount + 1}
                                    onChange={(value) => setStepsCount((value as number) - 1)}
                                />
                                <Button
                                    onClick={() => {
                                        toggleChartSettings();
                                        updateChartData();
                                    }}
                                >
                                    {mt('save_changes')}
                                </Button>
                            </Stack>
                        </Overlay>
                    ) : (
                        <></>
                    )}
                    <Skeleton visible={!balanceChartData}>
                        <AreaChart
                            h={300}
                            data={balanceChartData as ChartData}
                            dataKey="date"
                            series={[{ name: 'balance', color: 'blue.6' }]}
                            curveType="linear"
                        />
                    </Skeleton>
                </Box>
            </Stack>
        </>
    );
};

export default TonWalletAnalysis;
