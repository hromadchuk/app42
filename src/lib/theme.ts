import { ThemeParamsParsed } from '@tma.js/sdk';
import { generateColors } from '@mantine/colors-generator';
import { getParams } from './helpers.ts';

type RGB = `#${string}`;

type RequiredStringProps<T> = {
    [P in keyof T]-?: RGB;
};

export function getBackgroundColor() {
    const body = document.querySelector('body') as HTMLBodyElement;
    const color = window.getComputedStyle(body).getPropertyValue('background-color');

    return rgbToHex(color);
}

export function updateThemeFromParams() {
    const theme = getParams().get('tgWebAppThemeParams');
    const colors = JSON.parse(theme || '{}');

    setColors(colors);
}

export function rgbToHex(rgb: string): RGB {
    const rgbValues = rgb.match(/\d+/g) as string[];
    const hex = rgbValues
        .map((val) => {
            const hexVal = parseInt(val).toString(16);
            return hexVal.length === 1 ? '0' + hexVal : hexVal;
        })
        .join('');

    return `#${hex}`;
}

export function hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) as string[];
    const parse = {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha
    };

    return `rgba(${parse.r}, ${parse.g}, ${parse.b}, ${parse.a})`;
}

export function darkenNex(hex: string): string {
    const darkenFactor = 70;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) as string[];
    const rgb = {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };

    const darkRgb = {
        r: Math.max(0, rgb.r - darkenFactor),
        g: Math.max(0, rgb.g - darkenFactor),
        b: Math.max(0, rgb.b - darkenFactor)
    };

    return rgbToHex(`rgb(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b})`);
}

export function setColors(colors: RequiredStringProps<ThemeParamsParsed>) {
    const body = document.querySelector('body') as HTMLBodyElement;

    // set tg vars
    for (const [key, value] of Object.entries(colors)) {
        const setKey = `--tg-color-${key.replace(/_/g, '-')}`;
        body.style.setProperty(setKey, value as string);
    }

    // override blue theme
    const generatedColors = generateColors(colors.button_color);

    for (const [index, value] of Object.entries(generatedColors)) {
        body.style.setProperty(`--tg-color-override-${index}`, value);
    }

    const overrideSpecialState = (key: string, type: string, value: string) => {
        body.style.setProperty(`--tg-color-override-${type}-${key}`, value);
    };

    overrideSpecialState('filled', 'dark', generatedColors[8]);
    overrideSpecialState('filled-hover', 'dark', generatedColors[9]);
    overrideSpecialState('light', 'dark', hexToRgba(generatedColors[6], 0.15));
    overrideSpecialState('light-hover', 'dark', hexToRgba(generatedColors[6], 0.2));
    overrideSpecialState('light-color', 'dark', generatedColors[3]);
    overrideSpecialState('outline', 'dark', generatedColors[4]);
    overrideSpecialState('outline-hover', 'dark', hexToRgba(generatedColors[4], 0.05));

    overrideSpecialState('filled', 'light', generatedColors[6]);
    overrideSpecialState('filled-hover', 'light', generatedColors[7]);
    overrideSpecialState('light', 'light', hexToRgba(generatedColors[6], 0.1));
    overrideSpecialState('light-hover', 'light', hexToRgba(generatedColors[6], 0.12));
    overrideSpecialState('light-color', 'light', generatedColors[6]);
    overrideSpecialState('outline', 'light', generatedColors[6]);
    overrideSpecialState('outline-hover', 'light', hexToRgba(generatedColors[6], 0.05));

    const generatedDarkColors = generateColors(colors.secondary_bg_color);

    for (const [index, value] of Object.entries(generatedDarkColors)) {
        body.style.setProperty(`--tg-color-override-dark-colors-${index}`, darkenNex(value));
    }
}
