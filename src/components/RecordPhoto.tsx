import { useEffect, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { getMessagePhoto } from '../lib/helpers.ts';
import { ExAvatar } from './ExAvatar.tsx';
import { Api } from 'telegram';
import { IconPhotoMinus } from '@tabler/icons-react';

export function RecordPhoto({ photo }: { photo?: Api.TypePhoto }) {
    const { ref, entry } = useIntersection();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [mediaPhoto, setMediaPhoto] = useState<null | string>(null);

    useEffect(() => {
        if (photo && entry?.isIntersecting && !alreadyRequested) {
            setAlreadyRequested(true);
            getMessagePhoto(photo).then((photoBase64) => {
                if (photoBase64) {
                    setMediaPhoto(photoBase64);
                }
            });
        }
    }, [entry?.isIntersecting]);

    function Avatar({ src, children }: { src?: string; children?: JSX.Element }) {
        return (
            <ExAvatar src={src} radius="xs" size="lg">
                {children}
            </ExAvatar>
        );
    }

    if (mediaPhoto) {
        return <Avatar src={mediaPhoto} />;
    }

    return (
        <div ref={ref}>
            <Avatar>
                <IconPhotoMinus size="1.5rem" />
            </Avatar>
        </div>
    );
}
