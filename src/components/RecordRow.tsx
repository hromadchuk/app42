import { Api } from 'telegram';
import { t } from '../lib/lang.ts';
import { TCorrectMessage } from '../lib/methods/messages.ts';
import { WrappedCell } from './Helpers.tsx';
import { RecordPhoto } from './RecordPhoto.tsx';

interface IRecordRow {
    record: TCorrectMessage;
    description?: string;
}

export function RecordRow({ record, description }: IRecordRow) {
    if (!(record.peerId instanceof Api.PeerChannel && record.peerId?.channelId.valueOf())) {
        return null;
    }

    return (
        <WrappedCell
            key={record.id.valueOf()}
            description={description}
            before={<RecordPhoto photo={record.photo} />}
            href={`https://t.me/c/${record.peerId.channelId.valueOf()}/${record.id}`}
        >
            {record.message || t('record_row.record')}
        </WrappedCell>
    );
}
