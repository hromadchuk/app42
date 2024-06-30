import { useEffect, useRef, useState } from 'react';
import { Image } from '@telegram-apps/telegram-ui';
import { IconPhoto } from '@tabler/icons-react';
import { useIntersection } from '../hooks/useIntersection.ts';
import { getMediaPhoto } from '../lib/helpers.ts';
import { Api } from 'telegram';

export function RecordPhoto({ photo }: { photo?: Api.TypePhoto }) {
    const ref = useRef();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [mediaPhoto, setMediaPhoto] = useState<null | string>(null);

    const isIntersecting = useIntersection(ref);

    useEffect(() => {
        if (photo && isIntersecting && !alreadyRequested) {
            setAlreadyRequested(true);
            getMediaPhoto(photo).then((photoBase64) => {
                if (photoBase64) {
                    setMediaPhoto(photoBase64);
                }
            });
        }
    }, [isIntersecting]);

    if (mediaPhoto) {
        return <Image src={mediaPhoto} />;
    }

    return (
        // @ts-ignore
        <div ref={ref}>
            <Image>
                <IconPhoto size={24} />
            </Image>
        </div>
    );
}
