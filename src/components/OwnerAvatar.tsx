import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { Api } from 'telegram';
import { getCache, setCache } from '../lib/cache.tsx';
import { ExAvatar } from './ExAvatar.tsx';

interface IOwnerAvatar {
    owner: null | Api.TypeUser | Api.TypeChat;
}

export function OwnerAvatar({ owner }: IOwnerAvatar) {
    const { ref, entry } = useIntersection();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [userAvatar, setUserAvatar] = useState<null | string>(null);

    useEffect(() => {
        if (
            (owner instanceof Api.User || owner instanceof Api.Chat || owner instanceof Api.Channel) &&
            owner.photo &&
            entry?.isIntersecting &&
            !alreadyRequested
        ) {
            setAlreadyRequested(true);

            const userPhoto = owner.photo as Api.UserProfilePhoto;
            const cacheKey = `owner-avatar-${userPhoto?.photoId}`;
            const cache = getCache(cacheKey);
            if (cache) {
                setUserAvatar(cache as string);
            } else {
                window.TelegramClient.downloadProfilePhoto(owner.id).then((buffer) => {
                    // @ts-ignore - Buffer is not defined
                    const imageCode = Buffer.from(buffer).toString('base64');
                    if (imageCode) {
                        const imageBase64 = `data:image/jpeg;base64,${imageCode}`;

                        setCache(cacheKey, imageBase64, 30);
                        setUserAvatar(imageBase64);
                    }
                });
            }
        }
    }, [entry?.isIntersecting]);

    let name = '';

    if (owner instanceof Api.User) {
        if (owner.firstName) {
            name += owner.firstName[0];
        }

        if (owner.lastName) {
            name += owner.lastName[0];
        }
    } else if (owner instanceof Api.Chat || owner instanceof Api.Channel) {
        if (owner.title) {
            name += owner.title[0];
        }
    }

    if (userAvatar) {
        return <ExAvatar src={userAvatar} radius="xl" />;
    }

    return (
        <div ref={ref}>
            <ExAvatar id={Number(owner?.id.valueOf())} letters={name} />
        </div>
    );
}
