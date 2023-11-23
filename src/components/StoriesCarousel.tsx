import { Carousel } from '@mantine/carousel';
import { IStoryTop } from '../methods/StoriesStat.tsx';
import { StoryCard } from './StoryCard.tsx';
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext.tsx';

interface ICarouselProps {
    storiesStats: IStoryTop[];
}

export function StoriesCarousel({ storiesStats }: ICarouselProps) {
    const { user } = useContext(AppContext);

    if (!user?.id) {
        return null;
    }

    const storyPeer =
        user?.username || (user?.usernames ? user?.usernames.find((username) => username.active)?.username : null);

    return (
        <Carousel slideSize={{ base: 'auto' }} slideGap={{ base: 0 }} withControls={false} align="start" dragFree>
            {storiesStats.map((storyStat) => (
                <Carousel.Slide key={storyStat.story.id}>
                    <StoryCard story={storyStat.story} actionCount={storyStat.count} peer={storyPeer} />
                </Carousel.Slide>
            ))}
        </Carousel>
    );
}
