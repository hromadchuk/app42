import { useEffect, useState } from 'react';
import { Affix, Button, Container, Space, Stack, Text } from '@mantine/core';
import { IFinishBlock, IProgress, ISetListAction } from '../contexts/MethodContext.tsx';
import { formatNumber, sleep } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { OwnerRow } from './OwnerRow.tsx';

interface IListActionProps extends ISetListAction {
    setProgress: (progress: IProgress | null) => void;
    setFinishBlock: (finishBlock: IFinishBlock) => void;
}

export function ListAction({
    buttonText,
    loadingText,
    owners,
    requestSleep,
    action,
    setProgress,
    setFinishBlock
}: IListActionProps) {
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        const allOwnerIds = owners.map((owner) => owner.id.valueOf());

        setSelected(allOwnerIds);
    }, []);

    async function run() {
        setProgress({ text: loadingText, total: selected.length });
        const selectedCopy = selected.slice(0);

        while (selectedCopy.length) {
            const ownerId = selectedCopy.shift();
            const selectedOwner = owners.find((owner) => owner.id.valueOf() === ownerId);

            if (!selectedOwner) {
                continue;
            }

            try {
                await action(selectedOwner);
            } catch (error) {
                console.error('error', error);
            }

            setProgress({ addCount: 1 });
            await sleep(requestSleep);
        }

        setFinishBlock({});
    }

    const selectedButtonText = t(`common.selected_button_subtext`)
        .replace('{count}', formatNumber(selected.length))
        .replace('{total}', formatNumber(owners.length));

    return (
        <>
            {owners.map((owner, key) => {
                const peerId = owner.id.valueOf();

                return (
                    <div key={key}>
                        <OwnerRow
                            owner={owner}
                            checked={selected.includes(peerId)}
                            callback={() => {
                                if (selected.includes(peerId)) {
                                    setSelected(selected.filter((id) => id !== peerId));
                                } else {
                                    setSelected([...selected, peerId]);
                                }
                            }}
                        />
                    </div>
                );
            })}

            <Space h="xs" />

            <Affix position={{ bottom: 0 }} style={{ width: '100%' }}>
                <Container p="xs">
                    <Button fullWidth disabled={!selected.length} onClick={run} h={40}>
                        <Stack gap={0}>
                            {buttonText}
                            <Text size="xs" opacity={0.5}>
                                {selectedButtonText}
                            </Text>
                        </Stack>
                    </Button>
                </Container>
            </Affix>
        </>
    );
}
