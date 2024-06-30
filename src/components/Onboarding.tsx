import { useEffect, useState } from 'react';
import { Button, FixedLayout, IconButton, Text } from '@telegram-apps/telegram-ui';
import {
    Icon,
    IconChartHistogram,
    IconChevronLeft,
    IconChevronRight,
    IconProps,
    IconSeeding,
    IconShieldLock,
    IconTool
} from '@tabler/icons-react';
import { t } from '../lib/lang.ts';
import * as react from 'react';

interface IOnboarding {
    onOnboardingEnd: () => void;
}

interface ISlide {
    title: string;
    description: string;
    color: string;
    icon: react.ForwardRefExoticComponent<IconProps & react.RefAttributes<Icon>>;
}

export default function Onboarding({ onOnboardingEnd }: IOnboarding) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showEndButton, setShowEndButton] = useState(false);

    const slides: ISlide[] = [
        {
            title: t('onboarding.slides.slide1.title'),
            description: t('onboarding.slides.slide1.description'),
            color: 'violet',
            icon: IconChartHistogram
        },
        {
            title: t('onboarding.slides.slide2.title'),
            description: t('onboarding.slides.slide2.description'),
            color: 'teal',
            icon: IconSeeding
        },
        {
            title: t('onboarding.slides.slide3.title'),
            description: t('onboarding.slides.slide3.description'),
            color: 'yellow',
            icon: IconTool
        },
        {
            title: t('onboarding.slides.slide4.title'),
            description: t('onboarding.slides.slide4.description'),
            color: 'pink',
            icon: IconShieldLock
        }
    ];

    useEffect(() => {
        setShowEndButton(currentSlide === slides.length - 1);
    }, [currentSlide]);

    function onClick() {
        if (showEndButton) {
            onOnboardingEnd();
        } else {
            setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
        }
    }

    function Slide(slide: ISlide, key: number) {
        return (
            <div
                key={key}
                className="slide-content"
                style={{
                    display: key === currentSlide ? 'flex' : 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                }}
            >
                <IconButton>
                    <slide.icon size={64} color={slide.color} />
                </IconButton>
                <Text weight="1" size={1} style={{ marginTop: '16px', marginBottom: '8px' }}>
                    {slide.title}
                </Text>
                <Text style={{ textAlign: 'center', maxWidth: '80%' }}>{slide.description}</Text>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {slides.map((slide, index) => Slide(slide, index))}

                <div
                    style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '0',
                        right: '0',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: index === currentSlide ? '#3390EC' : '#DDDDDD',
                                margin: '0 4px'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                <IconButton
                    onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                    disabled={currentSlide === 0}
                >
                    <IconChevronLeft />
                </IconButton>
                <IconButton
                    onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
                    disabled={currentSlide === slides.length - 1}
                >
                    <IconChevronRight />
                </IconButton>
            </div>

            <FixedLayout vertical="bottom">
                <div style={{ padding: '16px' }}>
                    <Button onClick={onClick} style={{ width: '100%' }}>
                        {showEndButton ? t('onboarding.launch_app') : t('onboarding.continue_button')}
                    </Button>
                </div>
            </FixedLayout>
        </div>
    );
}
