import { Checkbox, Flex, Text, UnstyledButton } from '@mantine/core';

// @ts-ignore
import classes from '../styles/CheckboxCard.module.css';
import { ReactElement } from 'react';

interface ICheckboxCard {
    title: string;
    icon: ReactElement;
    checked: boolean;
    setChecked: (checked: boolean) => void;
    disabled?: boolean;
}

export function CheckboxCard({ title, icon, disabled, checked, setChecked }: ICheckboxCard) {
    return (
        <Flex className={classes.root} data-disabled={disabled || undefined}>
            <Checkbox
                classNames={{ root: classes.checkboxWrapper, input: classes.checkbox }}
                checked={checked}
                onChange={(event) => setChecked(event.currentTarget.checked)}
                disabled={disabled}
                indeterminate={disabled}
                tabIndex={-1}
                size="xs"
            />

            <UnstyledButton
                className={classes.control}
                data-checked={checked || undefined}
                disabled={disabled}
                onClick={() => setChecked(!checked)}
            >
                <Flex align={'center'} direction={'column'}>
                    {icon}
                    <Text mt={5} className={classes.label}>
                        {title}
                    </Text>
                </Flex>
            </UnstyledButton>
        </Flex>
    );
}
