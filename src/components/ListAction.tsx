import { useEffect, useState } from 'react';
import { Button, FixedLayout, Section } from '@telegram-apps/telegram-ui';
import { formatNumber, sleep } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import commonClasses from '../styles/Common.module.css';
import { OwnerRow } from './OwnerRow.tsx';

import { IFinishBlock, IProgress, ISetListAction } from '../contexts/MethodContext.tsx';

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
    setFinishBlock,
    descriptions
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
        <Section className={commonClasses.sectionBox}>
            {owners.map((owner, key) => {
                const peerId = owner.id.valueOf();
                const description = descriptions ? descriptions[peerId] || '' : '';

                return (
                    <div key={key}>
                        <OwnerRow
                            owner={owner}
                            description={description}
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

            <FixedLayout
                style={{
                    padding: 16
                }}
            >
                <Button stretched disabled={!selected.length} onClick={run}>
                    <div style={{ marginBottom: -5 }}>{buttonText}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{selectedButtonText}</div>
                </Button>
            </FixedLayout>
        </Section>
    );

    // return (
    //     <>
    //         {owners.map((owner, key) => {
    //             const peerId = owner.id.valueOf();
    //
    //             return (
    //                 <div key={key}>
    //                     <OwnerRow
    //                         owner={owner}
    //                         checked={selected.includes(peerId)}
    //                         callback={() => {
    //                             if (selected.includes(peerId)) {
    //                                 setSelected(selected.filter((id) => id !== peerId));
    //                             } else {
    //                                 setSelected([...selected, peerId]);
    //                             }
    //                         }}
    //                     />
    //                 </div>
    //             );
    //         })}
    //
    //         <Space h="xs" />
    //
    //         <Affix position={{ bottom: 0 }} style={{ width: '100%' }}>
    //             <Container p="xs">
    //                 <Button fullWidth disabled={!selected.length} onClick={run} h={40}>
    //                     <Stack gap={0}>
    //                         {buttonText}
    //                         <Text size="xs" opacity={0.5}>
    //                             {selectedButtonText}
    //                         </Text>
    //                     </Stack>
    //                 </Button>
    //             </Container>
    //         </Affix>
    //     </>
    // );
}
