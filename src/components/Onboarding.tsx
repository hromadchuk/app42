import { Button, Card, Group, Image, Text, UnstyledButton } from '@mantine/core';
import React, { useState } from 'react';
import { t } from '../lib/lang.ts';

// @ts-ignore
import HeartAnimationGif from '../assets/animated_messages/examples/heart.gif';
// @ts-ignore
import CategoriesImage from '../assets/onboarding/categories.png';
// @ts-ignore
import LockImage from '../assets/onboarding/lock.png';
// @ts-ignore
import MessageStatsGif from '../assets/onboarding/message_stats.gif';
// @ts-ignore
import AllStatsGif from '../assets/onboarding/all_stats.gif';

interface IPageData {
    image: string;
    imageFit?: React.CSSProperties['objectFit'];
    title: string;
    description: string;
    nextPageButtonText: string;
    backButtonText?: string;
    closeOnboardingButtonText?: string;
}

type TOnboardingPages = Array<IPageData>;

interface IOnboarding {
    onOnboardingEnd: () => void;
}

function mt(text: string) {
    const onboardingKey = `onboarding.${text}`;
    const translatedText = t(`${onboardingKey}`);

    return translatedText === `${onboardingKey}` ? '' : translatedText;
}

export default function Onboarding({ onOnboardingEnd }: IOnboarding) {
    const [activeOnboardingPageIndex, setActiveOnboardingPageIndex] = useState(0);

    const onboardingImages: { [key: string]: string } = {
        welcome: String(HeartAnimationGif),
        categories: String(CategoriesImage),
        message_stats: String(MessageStatsGif),
        all_stats: String(AllStatsGif),
        authorize: String(LockImage)
    };

    const onboardingPages: TOnboardingPages = [];

    for (const onboardingImageKey in onboardingImages) {
        onboardingPages.push({
            image: onboardingImages[onboardingImageKey],
            title: mt(`${onboardingImageKey}.title`),
            description: mt(`${onboardingImageKey}.description`),
            nextPageButtonText: mt(`${onboardingImageKey}.next`),
            backButtonText: mt(`${onboardingImageKey}.back`),
            closeOnboardingButtonText: mt(`${onboardingImageKey}.close`)
        });
    }

    function onboardingPage(page: IPageData) {
        return (
            <Card shadow="sm" padding="lg" radius="0">
                <Card.Section>
                    <Image fit={page.imageFit} src={page.image} height={160} alt="onboarding image" />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                    <Text fw="bold">{page.title}</Text>
                </Group>

                <Text size="sm">{page.description}</Text>

                <Button.Group mt="md">
                    {page.backButtonText && (
                        <Button
                            fullWidth
                            variant="default"
                            onClick={() => setActiveOnboardingPageIndex(activeOnboardingPageIndex - 1)}
                        >
                            {page.backButtonText}
                        </Button>
                    )}

                    <Button
                        fullWidth
                        onClick={() =>
                            activeOnboardingPageIndex === onboardingPages.length - 1
                                ? onOnboardingEnd()
                                : setActiveOnboardingPageIndex(activeOnboardingPageIndex + 1)
                        }
                    >
                        {page.nextPageButtonText}
                    </Button>
                </Button.Group>

                {page.closeOnboardingButtonText && (
                    <UnstyledButton
                        onClick={() => setActiveOnboardingPageIndex(onboardingPages.length - 1)}
                        mt="md"
                        style={{ textAlign: 'center' }}
                    >
                        {page.closeOnboardingButtonText}
                    </UnstyledButton>
                )}
            </Card>
        );
    }

    return onboardingPage(onboardingPages[activeOnboardingPageIndex]);
}
