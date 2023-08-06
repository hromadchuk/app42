import { useEffect, useState } from 'react';
import { createStyles, Group, Image, Menu, rem, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { getAppLangCode, LangType } from '../lib/lang.tsx';

import ENIcon from '../assets/languages/en.svg';
import UKIcon from '../assets/languages/uk.svg';
import RUIcon from '../assets/languages/ru.svg';

interface ISelectLanguage {
    label: string;
    code: LangType;
    icon: string;
}

const appLanguages: ISelectLanguage[] = [
    { label: 'English', code: LangType.EN, icon: ENIcon },
    { label: 'Українська', code: LangType.UK, icon: UKIcon },
    { label: 'Русский', code: LangType.RU, icon: RUIcon }
];

const useStyles = createStyles((theme, { opened }: { opened: boolean }) => ({
    control: {
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        borderRadius: theme.radius.md,
        border: `${rem(1)} solid ${theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]}`,
        transition: 'background-color 150ms ease',
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,

        '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]
        }
    },

    label: {
        fontWeight: 500,
        fontSize: theme.fontSizes.sm
    },

    icon: {
        transition: 'transform 150ms ease',
        transform: opened ? 'rotate(180deg)' : 'rotate(0deg)'
    }
}));

export function SelectLanguage() {
    const [opened, setOpened] = useState(false);
    const { classes } = useStyles({ opened });
    const [selected, setSelected] = useState<ISelectLanguage>(appLanguages[0]);
    const items = appLanguages.map((item) => (
        <Menu.Item
            disabled={selected.code === item.code}
            icon={<Image src={item.icon} width={18} height={18} />}
            onClick={() => {
                localStorage.setItem('lang', item.code);
                setSelected(item);
                location.reload();
            }}
            key={item.label}
        >
            {item.label}
        </Menu.Item>
    ));

    useEffect(() => {
        const selectedLang = getAppLangCode();
        const lang = appLanguages.find((item) => item.code === selectedLang) as ISelectLanguage;

        setSelected(lang);
    }, []);

    return (
        <Group my="sm">
            <Menu onOpen={() => setOpened(true)} onClose={() => setOpened(false)} radius="md" withinPortal>
                <Menu.Target>
                    <UnstyledButton className={classes.control}>
                        <Group spacing="xs">
                            <Image src={selected.icon} width={22} height={22} />
                            <span className={classes.label}>{selected.label}</span>
                        </Group>
                        <IconChevronDown size="1rem" className={classes.icon} stroke={1.5} />
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>{items}</Menu.Dropdown>
            </Menu>
        </Group>
    );
}
