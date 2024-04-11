import { useEffect, useState } from 'react';
import { CallStatImagesGenerator, ICallStatImagesOptions } from './src/images_generator/CallStatImagesGenerator.ts';
// import {
//     IMessagesStatImagesOptions,
//     MessageStatImagesGenerator
// } from './src/images_generator/MessageStatImagesGenerator.ts';
//
// import { IRegDateImagesOptions, RegDateImagesGenerator } from './src/images_generator/RegDateImagesGenerator.ts';
//
// const TEST_AVATAR = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAICAgICAQICAgIDAgIDAwYEAwMDAwcFBQQGCAcJCAgHCAgJCg0LCQoMCggICw8LDA0ODg8OCQsQERAOEQ0ODg7/2wBDAQIDAwMDAwcEBAcOCQgJDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg7/wAARCAFAAUADASIAAhEBAxEB/8QAHQABAQACAgMBAAAAAAAAAAAAAAkHCAEFAgMGBP/EAFgQAAEDAgMEBAYKCw0HBQAAAAEAAgMEBQYHEQgSITETQVFxMmFicoGRFBUiQlKSobHB0RcjMzQ2OHWCssPSJCVHU1RXZXSDk6KjwhYYVWOUs/A1Q2Th8f/EABwBAQACAgMBAAAAAAAAAAAAAAAHCAQGAQIFA//EAEQRAAECBAIFBwcLAwQDAAAAAAEAAgMEBREGITFBUWFxEoGRobHC0QcyM0JyosETFiIjNVJTYoLi8BQlVBckNJIVQ7L/2gAMAwEAAhEDEQA/APpERFdxU3REREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREWR8vcqcaZmXd0OGrZrQxv3am51RMdLAewv0O87yWgnuWNMTECVhGLHcGtGkk2H869yyIECNMxRCgtLnHQALlY4XBc1pAc4NJ5AnRUiwdsh4ItVPFPi+4VeKq4aF8LHmlpQewNad9w73ehbB2PLnAeGoWMsWELRbS3lJFQM6T0vILj61Gk5jymQXFsux0Tfk0ddz1BSHK4JqUZodHe2HuzcerLrUcKKxXy5EC3WS41+vL2NQSy6/FaV9LT5X5lVbQafAGIZQeR9qJh87QrONY1rA1o3WjkBwC8lrcTygzJ9HLtHFz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Lr8wKn+Mz3vBdvnzTvwn+74qvmo7R601HaPWpB/Z4zh/nBunqi/YXH2d84D/AAg3T/K/YT5gVP8AFZ73gnz5p34T/d8VX3Udo9aajtCj87PLN53PMK7jufGPmYvzSZ0ZsyeFmJfB5tXu/MAuwwBUtcZnveC6nHUhqgv93xVi1wXBrSXHQDmTwUYqjNDMqraRU4/xDKDzBu8wHyOC+ZrL5e7iSbherhX68/ZNdLJr8ZxWVD8n0yfSTDRwa49pCxn47lx5ku48XAdgKshfMxsB4bge++YvtFtLecctfH0noYCXH0Ba+Yx2u8EWmGanwjb6vFlaNQyZ7DS0oPaXPG+4dzPSpuhrWklrQ0nmQNFytkk8CUyC4OmHuibsmjquesLXpvG1SjNLYDGw9+bj15dSyRmFmvjXMy7tmxLctaGN+9TWylBjpYD2hupLneU4k93JY3RFJcvLwJWEIUBoa0aABYfzr3qPI8eNMxTFjOLnHSSblERFkrHREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREX/9k=';

const imagesOptions: ICallStatImagesOptions[] = [
    // {
    //     title: '10 years',
    //     description: 'ago channel was created',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'was created on 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 years',
    //     subTitle: '10 months',
    //     description: 'ago channel was created',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'was created on 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 years',
    //     subTitle: '10 months 10 days',
    //     description: 'ago channel was created',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'was created on 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 лет',
    //     description: 'назад был создан канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'был создан 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 лет',
    //     subTitle: '10 месяцев',
    //     description: 'назад был создан канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'был создан 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 лет',
    //     subTitle: '10 месяцев 10 дней',
    //     description: 'назад был создан канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'был создан 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 років',
    //     description: 'тому був створений канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'був створений 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 років',
    //     subTitle: '10 місяців',
    //     description: 'тому був створений канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'був створений 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: '10 років',
    //     subTitle: '10 місяців 10 днів',
    //     description: 'тому був створений канал',
    //     bottomText: 'Kit 42',
    //     bottomDateText: 'був створений 07.02.2014',
    //     avatar: TEST_AVATAR
    // },
    // {
    //     title: 'Chat activity',
    //     description: 'for Meme Devision Chat',
    //     bottomText: 'statistics for 15.09.2021 — 18.02.2024',
    //     users: [
    //         { name: 'Michael', description: '2 473 messages', avatar: TEST_AVATAR },
    //         { name: 'Paulo', description: '10 messages', avatar: TEST_AVATAR },
    //         { name: 'Анастасия', description: '10 messages', avatar: TEST_AVATAR },
    //
    //         { name: 'Светлана', description: '10 messages', avatar: TEST_AVATAR },
    //         { name: 'Paulo', description: '10 messages', avatar: TEST_AVATAR },
    //         { name: 'Юрий', description: '10 messages', avatar: TEST_AVATAR },
    //         { name: 'Елизавета', description: '10 messages', avatar: TEST_AVATAR },
    //         { name: '🫣', description: '10 messages', avatar: TEST_AVATAR }
    //     ]
    // },
    {
        title: 'Calls statistics',
        totalDurationCount: '20h 31m 53s',
        totalDurationLabel: 'total duration',
        callsCount: 472,
        callsLabel: 'calls in total',
        participantsCount: 72,
        participantsLabel: 'participants',
        maxDurationCount: '20h 31m 53s',
        maxDurationLabel: 'max duration'
    }
];

export default function Test() {
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        console.log('imagesOptions', imagesOptions);

        const functions = imagesOptions.map((data) => {
            const imagesGenerator = new CallStatImagesGenerator();
            // const imagesGenerator = new MessageStatImagesGenerator();
            // const imagesGenerator = new RegDateImagesGenerator();

            return imagesGenerator.generate({ ...data, storyImage: true, messageImage: true });
        });

        Promise.all(functions).then((results) => {
            console.log('result', results);

            const list = results.reduce(
                (acc, { storyImage, messageImage }) => {
                    if (storyImage) {
                        acc.stories.push(storyImage);
                    }

                    if (messageImage) {
                        acc.messages.push(messageImage);
                    }

                    return acc;
                },
                { stories: [], messages: [] } as { stories: string[]; messages: string[] }
            );

            setImages([...list.stories, ...list.messages]);
        });
    }, []);

    function Images() {
        if (!images.length) {
            return 'Empty!';
        }

        return images.map((image, index) => <img src={image} alt={`image-${index}`} width="250px" key={index} />);
    }

    return <div>{Images()}</div>;
}
