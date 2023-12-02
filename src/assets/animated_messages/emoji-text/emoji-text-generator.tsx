import { bigEmojiMap, emojiMap, russianToEnglishMap } from './letters.ts';

function chickIsContainsRussianLetter(text: string) {
    const russianRegex = /[а-яА-ЯЁё]/;

    return russianRegex.test(text);
}

function chickIsContainsNonDigitsOrRussianOrEnglishOrLetters(text: string) {
    const nonRussianEnglishDigitsRegex = /[^a-zA-Zа-яА-ЯЁё0-9\s]/;

    return nonRussianEnglishDigitsRegex.test(text);
}

function convertRussianToEnglish(inputText: string) {
    return inputText
        .split('')
        .map((char: string) => russianToEnglishMap[char.toUpperCase()] || char)
        .join('');
}

function generateEmojiLetter(letter: string) {
    return emojiMap[letter.toUpperCase()] || letter;
}

function generateBigEmojiLetter(letter: string) {
    return bigEmojiMap[letter.toUpperCase()] || letter;
}

export const linesSeparator = '⬜️';

function generateEmojiText(text: string) {
    if (chickIsContainsNonDigitsOrRussianOrEnglishOrLetters(text)) {
        return null;
    }

    const result = {
        emojiText: '',
        emojiTextBig: ['']
    };

    let englishText = text;
    let emojiText = '';
    let emojiTextBigRows: string[] = [];

    if (chickIsContainsRussianLetter(text)) {
        englishText = convertRussianToEnglish(text);
    }

    for (const char of englishText) {
        // Add an invisible separator after the emoji to avoid gluing emoji letters into country flags
        emojiText += generateEmojiLetter(char) + '⁣';
    }

    for (const char of text) {
        if (emojiTextBigRows.length === 0) {
            emojiTextBigRows = Array(5).fill(linesSeparator);
        }

        const bigEmojiChar = generateBigEmojiLetter(char);
        emojiTextBigRows = emojiTextBigRows.map(
            (row, index) =>
                row + (char.trim() === '' ? linesSeparator : bigEmojiChar.split('\n')[index]) + linesSeparator
        );
    }

    result.emojiText = emojiText;
    result.emojiTextBig = emojiTextBigRows;

    return result;
}

export default generateEmojiText;
