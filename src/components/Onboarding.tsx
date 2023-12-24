import { JSX, useEffect, useState } from 'react';
import { Affix, Button, Center, Container, getThemeColor, Stack, Text, useMantineTheme } from '@mantine/core';
import { IconChartHistogram, TablerIconsProps } from '@tabler/icons-react';
import { Carousel, Embla } from '@mantine/carousel';
import { t } from '../lib/lang.ts';

// @ts-ignore
import classes from '../styles/Onboarding.module.css';

interface IOnboarding {
    onOnboardingEnd: () => void;
}

interface ISlide {
    title: string;
    description: string;
    color: string;
    icon: (props: TablerIconsProps) => JSX.Element;
}

export default function Onboarding({ onOnboardingEnd }: IOnboarding) {
    const theme = useMantineTheme();
    const [carouselHeight, setCarouselHeight] = useState<number>(document.body.clientHeight);
    const [showEndButton, setShowEndButton] = useState<boolean>(false);
    const [embla, setEmbla] = useState<Embla | null>(null);

    const slides: ISlide[] = [
        {
            title: t('onboarding.slides.slide1.title'),
            description: t('onboarding.slides.slide1.description'),
            color: 'violet',
            icon: IconChartHistogram
        },
        {
            title: t('onboarding.slide1.title'),
            description: t('onboarding.slide1.description'),
            color: 'teal',
            icon: IconChartHistogram
        },
        {
            title: t('onboarding.slide1.title'),
            description: t('onboarding.slide1.description'),
            color: 'yellow',
            icon: IconChartHistogram
        },
        {
            title: t('onboarding.slide1.title'),
            description: t('onboarding.slide1.description'),
            color: 'pink',
            icon: IconChartHistogram
        }
    ];

    useEffect(() => {
        // hook for waiting for bottom area rendered
        setTimeout(() => {
            const bottomAreaHeight = document.querySelector('#bottom-area')?.clientHeight || 0;

            setCarouselHeight(document.body.clientHeight - bottomAreaHeight);
        });
    }, []);

    useEffect(() => {
        if (!embla) {
            return;
        }

        embla.on('select', () => {
            const [slideId] = embla.slidesInView(true);

            setShowEndButton(slideId === slides.length - 1);
        });
    }, [embla]);

    function onClick() {
        if (showEndButton) {
            onOnboardingEnd();
        } else {
            embla?.scrollNext();
        }
    }

    function Slide(slide: ISlide, key: number) {
        const iconColor = getThemeColor(slide.color, theme);

        return (
            <Carousel.Slide key={key}>
                <Center h={carouselHeight}>
                    <Stack align="center" p="md">
                        <slide.icon size={64} color={iconColor} />
                        <Text size="xl">{slide.title}</Text>
                        <Text size="sm" ta="center">{slide.description}</Text>
                    </Stack>
                </Center>
            </Carousel.Slide>
        );
    }

    return (
        <>
            <Carousel
                withIndicators
                withControls={false}
                h={carouselHeight}
                classNames={classes}
                getEmblaApi={setEmbla}
            >
                {slides.map(Slide)}
            </Carousel>

            <Affix id="bottom-area" position={{ bottom: 0 }} style={{ width: '100%' }}>
                <Container p="xs">
                    <Button fullWidth onClick={onClick}>
                        {showEndButton ? t('onboarding.authorization_button') : t('onboarding.continue_button')}
                    </Button>
                </Container>
            </Affix>
        </>
    );
}
