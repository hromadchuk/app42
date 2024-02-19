import dayjs from 'dayjs';
import { getTextTime } from '../lib/helpers.ts';
import { OwnerRow } from './OwnerRow.tsx';
import { Api } from 'telegram';
import { useContext, useState } from 'react';
import { MethodContext } from '../contexts/MethodContext.tsx';
import { openModal, ShareModal, ShareType } from './Share.tsx';

export const DialogWithDate = ({ dialogs }: { dialogs: Api.Channel[] | Api.Chat[] }) => {
    const { mt } = useContext(MethodContext);
    const [selectedOwner, setSelectedOwner] = useState<Api.User | Api.Chat | Api.Channel | null>(null);

    return (
        <>
            {ShareModal({
                owner: selectedOwner,
                type: ShareType.REG_DATE,
                data: []
            })}

            {dialogs.map((dialog, key) => {
                const createdDate = dayjs(dialog.date * 1000);
                const diffInSeconds = dayjs().diff(createdDate, 'second');
                let textTime = mt('today');

                if (diffInSeconds > 24 * 60 * 60) {
                    textTime = getTextTime(diffInSeconds, true);
                }

                const createdText = mt('created').replace('{time}', textTime);
                const createdDateText = createdDate.format('LL');

                return (
                    <OwnerRow
                        key={key}
                        owner={dialog}
                        description={`${createdText} (${createdDateText})`}
                        callback={() => {
                            setSelectedOwner(dialog);
                            openModal();
                        }}
                    />
                );
            })}
        </>
    );
};

export default DialogWithDate;
