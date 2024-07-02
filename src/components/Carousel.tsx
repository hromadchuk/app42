import React from 'react';
import { IconButton, Text } from '@telegram-apps/telegram-ui';
import { Icon, IconChevronLeft, IconChevronRight, IconProps } from '@tabler/icons-react';
import styles from '../styles/Carousel.module.css';

interface ISlide {
    title: string;
    description: string;
    color: string;
    icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
}

interface CarouselProps {
    slides: ISlide[];
    currentSlide: number;
    onNext: () => void;
    onPrev: () => void;
}

const Carousel: React.FC<CarouselProps> = ({ slides, currentSlide, onNext, onPrev }) => {
    function Slide(slide: ISlide, key: number) {
        const IconComponent = slide.icon;
        return (
            <div key={key} className={`${styles.slideContent} ${key === currentSlide ? '' : styles.hidden}`}>
                <IconButton>
                    <IconComponent size={64} color={slide.color} />
                </IconButton>
                <Text weight="1" sizes="large" className={styles.slideTitle}>
                    {slide.title}
                </Text>
                <Text className={styles.slideDescription}>{slide.description}</Text>
            </div>
        );
    }

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.slideContainer}>
                {slides.map((slide, index) => Slide(slide, index))}

                <div className={styles.indicators}>
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.indicator} ${index === currentSlide ? styles.active : styles.inactive}`}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.navigation}>
                <IconButton onClick={onPrev} disabled={currentSlide === 0}>
                    <IconChevronLeft />
                </IconButton>
                <IconButton onClick={onNext} disabled={currentSlide === slides.length - 1}>
                    <IconChevronRight />
                </IconButton>
            </div>
        </div>
    );
};

export default Carousel;
