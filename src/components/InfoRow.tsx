import { createElement, JSX } from 'react';
import { Container, Flex, Group, Text } from '@mantine/core';
import { TablerIconsProps } from '@tabler/icons-react';
import { formatNumber } from '../lib/helpers.ts';

interface IInfoRow {
    title: string;
    titleLineClamp?: number;
    description?: string;
    icon?: (props: TablerIconsProps) => JSX.Element;
    count?: number;
}

export function InfoRow({ title, titleLineClamp, description, icon, count }: IInfoRow) {
    return (
        <Container p={0}>
            <Flex gap="md" p={5} justify="flex-start" align="center" direction="row" wrap="nowrap">
                {icon && createElement(icon, {})}

                <div>
                    <Group gap={0}>
                        <Text lineClamp={titleLineClamp} inline>
                            {title}
                        </Text>
                    </Group>
                    <Text c="dimmed" fz="xs">
                        {description}
                    </Text>
                </div>

                {Number.isInteger(count) && (
                    <Container p={0} mr={0}>
                        <Text size="sm">{formatNumber(count as number)}</Text>
                    </Container>
                )}
            </Flex>
        </Container>
    );
}
