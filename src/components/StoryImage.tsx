import { useEffect, useState } from 'react';
import { Image } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { getDocumentThumb, getMediaPhoto, getMediaVideoPreview } from '../lib/helpers.ts';
import { Api } from 'telegram';

interface StoryPhotoProps {
    src: string | null;
}

export function StoryImage({ storyDocument }: { storyDocument?: Api.TypePhoto | Api.TypeDocument }) {
    const { ref, entry } = useIntersection();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [mediaPhoto, setMediaPhoto] = useState<null | string>(null);

    useEffect(() => {
        if (storyDocument && entry?.isIntersecting && !alreadyRequested) {
            setAlreadyRequested(true);
            if (storyDocument instanceof Api.Photo) {
                getMediaPhoto(storyDocument).then((photoBase64) => {
                    setMediaPhoto(photoBase64);
                });
            } else if (storyDocument instanceof Api.Document) {
                getMediaVideoPreview(storyDocument).then((photoBase64) => {
                    setMediaPhoto(photoBase64);
                });
            }
        }
    }, [entry?.isIntersecting]);

    function StoryPhoto({ src }: StoryPhotoProps) {
        return (
            <Image radius="md" h={200} w={112} fit="contain" src={src} fallbackSrc={getDocumentThumb(storyDocument)} />
        );
    }

    if (mediaPhoto) {
        return <StoryPhoto src={mediaPhoto} />;
    }

    return (
        <div ref={ref}>
            <StoryPhoto src={null} />
        </div>
    );
}
