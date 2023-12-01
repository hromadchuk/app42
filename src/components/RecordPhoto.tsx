import { useEffect, useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';
import { useIntersection } from '@mantine/hooks';
import { getMediaPhoto } from '../lib/helpers.ts';
import { ExAvatar } from './ExAvatar.tsx';
import { Api } from 'telegram';

export function RecordPhoto({ photo }: { photo?: Api.TypePhoto }) {
    const { ref, entry } = useIntersection();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [mediaPhoto, setMediaPhoto] = useState<null | string>(null);

    useEffect(() => {
        if (photo && entry?.isIntersecting && !alreadyRequested) {
            setAlreadyRequested(true);
            getMediaPhoto(photo).then((photoBase64) => {
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
                <IconPhoto size={24} />
            </Avatar>
        </div>
    );
}
