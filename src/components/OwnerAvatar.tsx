import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@telegram-apps/telegram-ui';
import { Api } from 'telegram';
import { useIntersection } from '../hooks/useIntersection.ts';
import { getAvatar, getDocumentThumb, TOwnerInfo } from '../lib/helpers.ts';

interface IOwnerAvatar {
    owner: TOwnerInfo;
    size: 20 | 24 | 28 | 40 | 48 | 96;
}

export function OwnerAvatar({ owner, size }: IOwnerAvatar) {
    const ref = useRef();
    const [alreadyRequested, setAlreadyRequested] = useState<boolean>(false);
    const [userAvatar, setUserAvatar] = useState<null | string>(null);

    const isIntersecting = useIntersection(ref);

    useEffect(() => {
        if (
            (owner instanceof Api.User || owner instanceof Api.Chat || owner instanceof Api.Channel) &&
            owner.photo &&
            isIntersecting &&
            !alreadyRequested
        ) {
            if (owner.photo instanceof Api.UserProfilePhotoEmpty || owner.photo instanceof Api.ChatPhotoEmpty) {
                return;
            }

            if (owner.photo.strippedThumb) {
                setUserAvatar(getDocumentThumb(owner.photo) as string);
            }

            setAlreadyRequested(true);
            getAvatar(owner).then((photo) => {
                if (photo) {
                    setUserAvatar(photo);
                }
            });
        }
    }, [isIntersecting]);

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

    return (
        // @ts-ignore
        <div ref={ref} style={{ boxShadow: 'none' }}>
            <Avatar acronym={name} size={size} src={userAvatar || ''} />
        </div>
    );
}
