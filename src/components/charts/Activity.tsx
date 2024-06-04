import { useEffect, useRef, useState } from 'react';
import { Caption } from '@telegram-apps/telegram-ui';
import { SectionHeader } from '@telegram-apps/telegram-ui/dist/components/Blocks/Section/components/SectionHeader/SectionHeader';
import dayjs from 'dayjs';
import { generateColorGradation, getPercent, rgbToHex } from '../../lib/helpers.ts';
import { chartLang } from './chart_helpers.ts';

import classes from './Activity.module.css';

interface IActivityChartProps {
    data: number[][];
}

export function ActivityChart({ data }: IActivityChartProps) {
    const [cellWidth, setCellWidth] = useState<number>(0);
    const graphRef = useRef<HTMLDivElement>(null);
    const lang = chartLang('activity');

    useEffect(() => {
        if (graphRef.current) {
            const divSize = graphRef.current.offsetWidth / 24;

            setCellWidth(divSize);
        }
    }, [graphRef]);

    function getWidthProp(key: number, isHeader: boolean): { width: number } {
        if (key === 0) {
            return { width: 30 };
        }

        return { width: isHeader ? cellWidth * 2 : cellWidth };
    }

    function getColorStyle(level: number): { backgroundColor: string } {
        const rootStyle = getComputedStyle(document.getElementById('method_header') as HTMLElement);
        const headerColor = rootStyle.getPropertyValue('background-color');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [r, g, b] = headerColor.match(/\d+/g)!.map(Number);
        const nexColor = rgbToHex(r, g, b);
        const colors = generateColorGradation(nexColor, 6);

        return { backgroundColor: colors[level + 1] };
    }

    function getDayName(day: number): string {
        return dayjs().day(day).format('ddd').toLowerCase();
    }

    function getLevel(total: number, value: number): number {
        const percent = getPercent(value, total);

        if (percent >= 75) {
            return 4;
        } else if (percent >= 50) {
            return 3;
        } else if (percent >= 25) {
            return 2;
        } else if (percent > 0) {
            return 1;
        }

        return 0;
    }

    function getRowsData() {
        const rows: (string | number)[][] = [
            [getDayName(1)],
            [getDayName(2)],
            [getDayName(3)],
            [getDayName(4)],
            [getDayName(5)],
            [getDayName(6)],
            [getDayName(0)]
        ];

        const maxValue = Math.max(...data.reduce((res, row) => [...res, ...row], []));

        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 24; j++) {
                rows[i].push(getLevel(maxValue, data[i][j]));
            }
        }

        return rows;
    }

    const headerRows = ['', 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    return (
        <>
            <SectionHeader style={{ paddingLeft: 10 }}>{lang('title')}</SectionHeader>

            <div className={classes.header}>
                {headerRows.map((row, key) => (
                    <div className={classes.cellBox} key={key} style={getWidthProp(key, true)}>
                        {row}
                    </div>
                ))}
            </div>

            <div className={classes.graph} ref={graphRef}>
                {getRowsData().map((row, key) => (
                    <div className={classes.row} key={key}>
                        {row.map((cell, cellKey) => {
                            if (cellKey === 0) {
                                return (
                                    <div key={cellKey} className={classes.cell} style={getWidthProp(cellKey, false)}>
                                        <div className={classes.dayCell}>{cell}</div>
                                    </div>
                                );
                            }

                            return (
                                <div key={cellKey} className={classes.cell} style={getWidthProp(cellKey, false)}>
                                    <div className={classes.cellBox} style={getColorStyle(cell as number)} />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div>
                <div className={classes.levels}>
                    <div className={classes.levelsCell} style={getColorStyle(0)}></div>
                    <div className={classes.levelsCell} style={getColorStyle(1)}></div>
                    <div className={classes.levelsCell} style={getColorStyle(2)}></div>
                    <div className={classes.levelsCell} style={getColorStyle(3)}></div>
                    <div className={classes.levelsCell} style={getColorStyle(4)}></div>
                </div>

                <div className={classes.minMaxBlock}>
                    <div>{lang('min')}</div>
                    <div>{lang('max')}</div>
                </div>
            </div>

            <Caption level="1" weight="3">
                {lang('description')}
            </Caption>
        </>
    );
}
