import { Badge, Group } from '@mantine/core';
import { formatNumber } from '../lib/helpers.ts';

interface IReactionsList {
    reactions?: Map<string, number>;
}

export function ReactionsList({ reactions }: IReactionsList) {
    if (!reactions) {
        return null;
    }

    const reactionsArray = Array.from(reactions.entries()).sort((a, b) => b[1] - a[1]);

    return (
        <Group pt={10} gap={8}>
            {reactionsArray.map(([reactionEmoji, reactionCount]) => (
                <Badge key={reactionEmoji} leftSection={reactionEmoji} size="lg" color="gray">
                    {formatNumber(reactionCount)}
                </Badge>
            ))}
        </Group>
    );
}
