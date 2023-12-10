import emojiTextGenerator, { linesSeparator } from './emoji-text/emoji-text-generator.tsx';
import { MAX_FRAMES_COUNT } from '../../methods/AnimatedMessages.tsx';

const MAX_MESSAGE_LENGTH = 10;

export const getVisibleEmojiString = (emojiString: string) => {
    return [...new Intl.Segmenter().segment(emojiString)];
};

const generateEmojiText = (text: string) => {
    const generatedEmojiText = emojiTextGenerator(text);
    const emojiTextBig = generatedEmojiText?.emojiTextBig || [];
    const emojiTextBigLength = getVisibleEmojiString(emojiTextBig[0]).length || 0;
    if (emojiTextBig.length !== 5 || emojiTextBigLength > MAX_FRAMES_COUNT + MAX_MESSAGE_LENGTH - 1) {
        return [];
    }

    const result = [generatedEmojiText?.emojiText || linesSeparator];

    const blankLine = linesSeparator.repeat(emojiTextBigLength);
    emojiTextBig.unshift(blankLine);
    emojiTextBig.push(blankLine);

    const animationLength = Math.max(emojiTextBigLength, MAX_MESSAGE_LENGTH);
    let frameLength = Math.min(emojiTextBigLength, MAX_MESSAGE_LENGTH);

    if (frameLength === animationLength) {
        frameLength /= 2;
    }

    for (let frameNumber = 0; frameNumber < animationLength - frameLength; frameNumber++) {
        const emojiTextBigFrame: string[] = [];

        emojiTextBig.forEach((line) =>
            emojiTextBigFrame.push(
                [...getVisibleEmojiString(line)]
                    .slice(frameNumber, frameNumber + MAX_MESSAGE_LENGTH)
                    .map((emoji) => emoji.segment)
                    .join('')
            )
        );

        result.push(emojiTextBigFrame.join('\n'));
    }

    result.push(generatedEmojiText?.emojiText || linesSeparator);
    return result;
};

export default generateEmojiText;
