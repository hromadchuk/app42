import { useEffect, useState } from 'react';
import { Api } from 'telegram';
import { Caption, Image } from '@telegram-apps/telegram-ui';
import { useIntersection } from '../hooks/useIntersection.ts';
import { formatNumber, getDocumentThumb, getMediaPhoto, getMediaVideoPreview, TOwnerType } from '../lib/helpers.ts';

import classes from '../styles/StoryCard.module.css';

interface IStoriesCarousel {
    story: Api.StoryItem;
    actionCount: number;
    key: string;
    peer?: TOwnerType | null;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component: 'a' | 'button';
}

export function StoryCard({ story, actionCount, key, peer }: IStoriesCarousel) {
    const [ref, entry] = useIntersection({
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [mediaPhoto, setMediaPhoto] = useState<null | string>(null);

    let storyMediaDocument: Api.TypePhoto | Api.TypeDocument | undefined = undefined;
    if (story.media instanceof Api.MessageMediaPhoto) {
        storyMediaDocument = story.media.photo;
    } else if (story.media instanceof Api.MessageMediaDocument) {
        storyMediaDocument = story.media.document;
    }

    useEffect(() => {
        if (storyMediaDocument && entry?.isIntersecting && !alreadyRequested) {
            setAlreadyRequested(true);

            if (storyMediaDocument instanceof Api.Photo) {
                getMediaPhoto(storyMediaDocument).then((photoBase64) => {
                    setMediaPhoto(photoBase64);
                });
            } else if (storyMediaDocument instanceof Api.Document) {
                getMediaVideoPreview(storyMediaDocument).then((photoBase64) => {
                    setMediaPhoto(photoBase64);
                });
            }
        }
    }, [entry?.isIntersecting]);

    const linkProps: ILinkProps = { component: 'button' };

    if (peer) {
        linkProps.component = 'a';

        linkProps.href = `https://t.me/${peer}/s/${story.id}`;
        linkProps.target = '_blank';
    }

    function ImageRow() {
        if (mediaPhoto) {
            return <Image className={classes.card} src={mediaPhoto} />;
        }

        return <Image className={classes.card} src={getDocumentThumb(storyMediaDocument)} />;
    }

    return (
        // @ts-ignore
        <div ref={ref} key={key}>
            {ImageRow()}
            <Caption className={classes.caption}>{formatNumber(actionCount)}</Caption>
        </div>
    );
}
