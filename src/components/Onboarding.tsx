import { useEffect, useState } from 'react';
import { Button, FixedLayout } from '@telegram-apps/telegram-ui';
import { IconChartHistogram, IconSeeding, IconShieldLock, IconTool } from '@tabler/icons-react';
import { t } from '../lib/lang.ts';
import Carousel from './Carousel';
import styles from '../styles/Onboarding.module.css';

interface IOnboarding {
    onOnboardingEnd: () => void;
}

export default function Onboarding({ onOnboardingEnd }: IOnboarding) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showEndButton, setShowEndButton] = useState(false);

    const slides = [
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

    return (
        <div className={styles.container}>
            <Carousel
                slides={slides}
                currentSlide={currentSlide}
                onNext={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
                onPrev={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            />
            <FixedLayout vertical="bottom">
                <div className={styles.buttonContainer}>
                    <Button onClick={onClick} className={styles.button}>
                        {showEndButton ? t('onboarding.launch_app') : t('onboarding.continue_button')}
                    </Button>
                </div>
            </FixedLayout>
        </div>
    );
}
