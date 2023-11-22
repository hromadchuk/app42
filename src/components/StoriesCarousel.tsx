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

    return (
        <Carousel slideSize={{ base: 'auto' }} slideGap={{ base: 0 }} withControls={false} align="start">
            {storiesStats.map((storyStat) => (
                <Carousel.Slide key={storyStat.story.id}>
                    <StoryCard
                        story={storyStat.story}
                        actionCount={storyStat.count}
                        peer={user?.username || String(user.id.valueOf())}
                    />
                </Carousel.Slide>
            ))}
        </Carousel>
    );
}
