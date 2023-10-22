import { Avatar, AvatarProps, useMantineTheme } from '@mantine/core';

interface ILettersAvatar extends AvatarProps {
    id?: number;
    src?: string;
    letters?: string;
}

export function ExAvatar({ id, letters, src, ...props }: ILettersAvatar) {
    const theme = useMantineTheme();

    function getAvatarColor(): string {
        const colors = Object.keys(theme.colors).reverse();

        return colors[(id as number) % (colors.length - 2)]; // skip 2 black colors
    }

    if (src) {
        return <Avatar src={src} radius="xl" {...props} />;
    }

    return (
        <Avatar color={getAvatarColor()} radius="xl" {...props}>
            {letters}
        </Avatar>
    );
}
