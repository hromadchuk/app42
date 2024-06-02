import { Button } from '@telegram-apps/telegram-ui';
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
        <div>
            {reactionsArray.map(([reactionEmoji, reactionCount]) => (
                <Button before={reactionEmoji} mode="outline" size="s" style={{ marginRight: 10 }}>
                    {formatNumber(reactionCount)}
                </Button>
            ))}
        </div>
    );
}
