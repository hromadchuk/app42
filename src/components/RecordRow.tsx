import { Link } from 'react-router-dom';
import { Api } from 'telegram';
import { t } from '../lib/lang.ts';
import { TCorrectMessage } from '../lib/methods/messages.ts';
import { WrappedCell } from './Helpers.tsx';
import { RecordPhoto } from './RecordPhoto.tsx';

interface IRecordRow {
    record: TCorrectMessage;
    description?: string;
    callback?: () => void;
}

interface ILinkProps {
    onClick?: () => void;
    to?: string;
    target?: string;
    component: 'a';
}

export function RecordRow({ record, description, callback }: IRecordRow) {
    const linkProps: ILinkProps = {
        component: 'a'
    };

    if (callback) {
        linkProps.onClick = () => callback();
    } else if (record.peerId instanceof Api.PeerChannel && record.peerId?.channelId.valueOf()) {
        linkProps.to = `https://t.me/c/${record.peerId.channelId.valueOf()}/${record.id}`;
        linkProps.target = '_blank';
    }

    return (
        // @ts-ignore
        <Link {...linkProps}>
            <WrappedCell description={description} before={<RecordPhoto photo={record.photo} />}>
                {record.message || t('record_row.record')}
            </WrappedCell>
        </Link>
    );
}
