import { NumberFormatter } from '@mantine/core';
import { convertTonValueToHumanReadable } from '../lib/helpers.ts';

export default function TonBalance({ value }: { value?: number }) {
    return (
        <NumberFormatter
            suffix=" TON"
            value={convertTonValueToHumanReadable(value ?? 0)}
            thousandSeparator
            decimalScale={2}
        />
    );
}
