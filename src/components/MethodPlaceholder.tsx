import { Placeholder } from '@telegram-apps/telegram-ui';
import { IconCheck, IconX } from '@tabler/icons-react';
import { IFinishBlock } from '../contexts/MethodContext.tsx';

export function MethodPlaceholder(finishBlock: IFinishBlock) {
    return (
        <Placeholder description={finishBlock.text}>
            {finishBlock.state === 'done' && <IconCheck size={50} color="var(--tgui--green)" />}
            {finishBlock.state === 'error' && <IconX size={50} color="var(--tgui--destructive_text_color)" />}
        </Placeholder>
    );
}
