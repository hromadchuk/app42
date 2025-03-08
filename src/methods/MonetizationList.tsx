import { useContext, useState } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { IconCalendarStar, IconStar } from '@tabler/icons-react';
import { Api } from 'telegram';
import { WrappedCell } from '../components/Helpers.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { useAsyncEffect } from '../hooks/useAsyncEffect.ts';
import { CallAPI, classNames, formatNumberFloat, sleep, TOwnerType } from '../lib/helpers.ts';
import { getDialogs } from '../lib/logic_helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

interface IItems {
    owner: TOwnerType;
    availableStars: number;
    currentBalance: number;
    starsUsdRate: number;
}

interface IStatResult {
    list: IItems[];
    totalStars: number;
    totalStarsUsd: number;
    totalAvailableStars: number;
    totalAvailableStarsUsd: number;
}

export default function MonetizationList() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [stat, setStat] = useState<IStatResult | null>(null);

    useAsyncEffect(async () => {
        setProgress({});

        const dialogs = await getDialogs<Api.User | Api.Channel>(
            {
                types: [Api.User, Api.Channel]
            },
            { setProgress }
        );

        const created = dialogs.filter((dialog) => {
            if (dialog instanceof Api.User) {
                return dialog.botCanEdit;
            }

            return dialog.creator;
        });

        if (!created.length) {
            setFinishBlock({ state: 'error', text: mt('no_created') });
            return;
        }

        setProgress({ text: mt('check_balances'), total: created.length });

        const calcStat: IStatResult = {
            list: [],
            totalStars: 0,
            totalStarsUsd: 0,
            totalAvailableStars: 0,
            totalAvailableStarsUsd: 0
        };

        for (const dialog of created) {
            try {
                await sleep(666);

                const result: IItems = {
                    owner: dialog,
                    availableStars: 0,
                    currentBalance: 0,
                    starsUsdRate: 0
                };

                const stars = await CallAPI(
                    new Api.payments.GetStarsRevenueStats({
                        peer: dialog.id
                    })
                );

                result.availableStars = stars.status.availableBalance.valueOf();
                result.currentBalance = stars.status.currentBalance.valueOf();
                result.starsUsdRate = stars.usdRate;

                if (result.availableStars) {
                    calcStat.totalAvailableStars += result.availableStars;
                    calcStat.totalAvailableStarsUsd += result.availableStars * result.starsUsdRate;
                }

                if (result.currentBalance) {
                    calcStat.totalStars += result.currentBalance;
                    calcStat.totalStarsUsd += result.currentBalance * result.starsUsdRate;
                }

                calcStat.list.push(result);
            } catch (error) {
                console.error('MonetizationList error', error);
            }

            setProgress({ addCount: 1 });
        }

        calcStat.list.sort((a, b) => b.currentBalance - a.currentBalance);

        setStat(calcStat);
        setProgress(null);
    });

    if (needHideContent()) return null;

    if (stat) {
        return (
            <>
                <Section
                    header={mt('total_header')}
                    className={classNames(commonClasses.sectionBox, commonClasses.showHr)}
                >
                    <WrappedCell
                        before={<IconStar size={14} />}
                        after={<RightCounts value={stat.totalStars} valueUsd={stat.totalStarsUsd} />}
                    >
                        {mt('total_stars')}
                    </WrappedCell>

                    <WrappedCell
                        before={<IconCalendarStar size={14} />}
                        after={<RightCounts value={stat.totalAvailableStars} valueUsd={stat.totalAvailableStarsUsd} />}
                    >
                        {mt('available_stars')}
                    </WrappedCell>
                </Section>

                {stat.list.map((item, key) => (
                    <Section className={classNames(commonClasses.sectionBox, commonClasses.showHr)} key={key}>
                        <OwnerRow
                            owner={item.owner}
                            withoutLink={true}
                            description={item.owner instanceof Api.User ? mt('types.bot') : mt('types.channel')}
                        />

                        <WrappedCell
                            before={<IconStar size={14} />}
                            after={
                                <RightCounts
                                    value={item.currentBalance}
                                    valueUsd={item.currentBalance * item.starsUsdRate}
                                />
                            }
                        >
                            {mt('total_stars')}
                        </WrappedCell>

                        <WrappedCell
                            before={<IconCalendarStar size={14} />}
                            after={
                                <RightCounts
                                    value={item.availableStars}
                                    valueUsd={item.availableStars * item.starsUsdRate}
                                />
                            }
                        >
                            {mt('available_stars')}
                        </WrappedCell>
                    </Section>
                ))}
            </>
        );
    }
}

function RightCounts({ value, valueUsd }: { value: number; valueUsd: number }) {
    return (
        <div
            style={{
                display: 'block'
            }}
        >
            <h6
                style={{
                    margin: 3,
                    textAlign: 'right'
                }}
            >
                {formatNumberFloat(value)}
            </h6>
            <h6
                style={{
                    margin: 3,
                    textAlign: 'right'
                }}
            >
                ~{formatNumberFloat(valueUsd)}$
            </h6>
        </div>
    );
}
