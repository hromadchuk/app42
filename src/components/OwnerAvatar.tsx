import { useEffect, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { Api } from 'telegram';
import { getAvatar, getDocumentThumb, TOwnerInfo } from '../lib/helpers.ts';
import { ExAvatar } from './ExAvatar.tsx';

interface IOwnerAvatar {
    owner: TOwnerInfo;
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
