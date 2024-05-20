import { ReactElement } from 'react';
import { Checkbox, Flex, MantineSize, Text, UnstyledButton } from '@mantine/core';

import classes from '../styles/CheckboxCard.module.css';

interface ICheckboxCard {
    title: string;
    icon?: ReactElement;
    checked: boolean;
    size?: MantineSize | (string & {});
    setChecked: (checked: boolean) => void;
    disabled?: boolean;
    isHorizontal?: boolean;
}

export function CheckboxCard({ title, icon, disabled, checked, setChecked, size, isHorizontal }: ICheckboxCard) {
    return (
        <Flex className={classes.root} data-disabled={disabled || undefined}>
            <Checkbox
                classNames={{ root: classes.checkboxWrapper, input: classes.checkbox }}
                checked={checked}
                onChange={(event) => setChecked(event.currentTarget.checked)}
                disabled={disabled}
                indeterminate={disabled}
                tabIndex={-1}
                size={size || 'xs'}
            />

            <UnstyledButton
                className={classes.control}
                data-checked={checked || undefined}
                data-horizontal={isHorizontal || undefined}
                disabled={disabled}
                onClick={() => setChecked(!checked)}
            >
                <Flex align={isHorizontal ? undefined : 'center'} direction={isHorizontal ? 'row' : 'column'}>
                    {icon}
                    <Text
                        mt={isHorizontal ? undefined : 5}
                        data-horizontal={isHorizontal || undefined}
                        className={classes.label}
                    >
                        {title}
                    </Text>
                </Flex>
            </UnstyledButton>
        </Flex>
    );
}
