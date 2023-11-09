import dayjs from 'dayjs';
import { t } from '../../lib/lang.tsx';

export class CalculateActivityTime {
    data = new Map<number, number[][]>();

    add(userId: number, time: number) {
        if (!this.data.has(userId)) {
            const initialData: number[][] = [];

            for (let i = 0; i < 7; i++) {
                initialData.push([]);

                for (let j = 0; j < 24; j++) {
                    initialData[i].push(0);
                }
            }

            this.data.set(userId, initialData);
        }

        const currentData = this.data.get(userId) as number[][];
        const hour = Number(dayjs(time * 1000).format('H'));
        const day = Number(dayjs(time * 1000).format('d'));
        const fixedDay = day === 0 ? 6 : day - 1;

        currentData[fixedDay][hour]++;

        this.data.set(userId, currentData);
    }

    get(userId: number): number[][] {
        return this.data.get(userId) as number[][];
    }
}

export function chartLang(chart: string) {
    return (key: string): string => {
        return t(`charts.${chart}.${key}`);
    };
}
