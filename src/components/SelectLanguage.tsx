import { useEffect, useState } from 'react';
import { Group, Image, Menu, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { classNames } from '../lib/helpers.ts';
import { getAppLangCode, LangType } from '../lib/lang.ts';

import ENIcon from '../assets/languages/en.svg';
import UKIcon from '../assets/languages/uk.svg';
import RUIcon from '../assets/languages/ru.svg';

import classes from '../styles/SelectLanguage.module.css';

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

export function SelectLanguage() {
    const [opened, setOpened] = useState(false);
    const [selected, setSelected] = useState<ISelectLanguage>(appLanguages[0]);
    const items = appLanguages.map((item) => (
        <Menu.Item
            disabled={selected.code === item.code}
            leftSection={<Image src={item.icon} width={18} height={18} />}
            onClick={() => {
                localStorage.setItem('lang', item.code);
                setSelected(item);
                window.location.reload();
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
                        <Group gap="xs">
                            <Image src={selected.icon} width={22} height={22} />
                            <span className={classes.label}>{selected.label}</span>
                        </Group>
                        <IconChevronDown
                            size={16}
                            className={classNames(classes.icon, { [classes.iconOpened]: opened })}
                            stroke={1.5}
                        />
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>{items}</Menu.Dropdown>
            </Menu>
        </Group>
    );
}
