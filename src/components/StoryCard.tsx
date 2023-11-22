import { Container, Flex, Text, UnstyledButton } from '@mantine/core';
import { Api } from 'telegram';
import { classNames } from '../lib/helpers.ts';
import { StoryImage } from './StoryImage.tsx';
// @ts-ignore
import classes from '../styles/OwnerRow.module.css';

interface IStoriesCarousel {
    story: Api.StoryItem;
    actionCount: number;
    peer: string;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component: 'a';
}

export function StoryCard({ story, actionCount, peer }: IStoriesCarousel) {
    const linkProps: ILinkProps = {
        component: 'a'
    };

    linkProps.href = `https://t.me/${peer}/s/${story.id}`;
    linkProps.target = '_blank';

    let storyMediaDocument = undefined;
    if (story.media instanceof Api.MessageMediaPhoto) {
        storyMediaDocument = story.media.photo;
    } else if (story.media instanceof Api.MessageMediaDocument) {
        storyMediaDocument = story.media.document;
    }

    const Row = (
        <Flex
            gap="md"
            p={5}
            justify="flex-start"
            align="center"
            direction="column"
            wrap="wrap"
            className={classNames({ [classes.row]: 'a' })}
        >
            <StoryImage storyDocument={storyMediaDocument} />

            <Text>{actionCount}</Text>
        </Flex>
    );

    return (
        <UnstyledButton {...linkProps}>
            <Container p={0}>{Row}</Container>
        </UnstyledButton>
    );
}
