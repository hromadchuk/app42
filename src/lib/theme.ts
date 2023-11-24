import { postEvent, ThemeChangedPayload } from '@tma.js/bridge';
import { getParams, isDev } from './helpers.ts';

type RGB = `#${string}`;

type RequiredStringProps<T> = {
    [P in keyof T]-?: RGB;
};

export function getBackgroundColor() {
    const body = document.querySelector('body') as HTMLBodyElement;
    const color = window.getComputedStyle(body).getPropertyValue('background-color');

    return rgbToHex(color);
}

export function getParamsTheme(): RequiredStringProps<ThemeChangedPayload['theme_params']> {
    const theme = getParams().get('tgWebAppThemeParams');

    return JSON.parse(theme || '{}');
}

export function generateDimmerColors(hexColor: string, numShades: number): string[] {
    const rgbColor = {
        r: parseInt(hexColor.substring(1, 3), 16),
        g: parseInt(hexColor.substring(3, 5), 16),
        b: parseInt(hexColor.substring(5, 7), 16)
    };

    const stepSize = {
        r: Math.floor(rgbColor.r / (numShades * 1.5)),
        g: Math.floor(rgbColor.g / (numShades * 1.5)),
        b: Math.floor(rgbColor.b / (numShades * 1.5))
    };

    const dimmerColors = [];

    for (let i = 1; i <= numShades; i++) {
        const dimmedColor = {
            r: Math.max(0, rgbColor.r - stepSize.r * i),
            g: Math.max(0, rgbColor.g - stepSize.g * i),
            b: Math.max(0, rgbColor.b - stepSize.b * i)
        };

        const hexParts = [
            dimmedColor.r.toString(16).padStart(2, '0'),
            dimmedColor.g.toString(16).padStart(2, '0'),
            dimmedColor.b.toString(16).padStart(2, '0')
        ];

        dimmerColors.push(`#${hexParts.join('')}`);
    }

    return dimmerColors;
}

export function rgbToHex(rgb: string): RGB {
    const rgbValues = rgb.match(/\d+/g) as string[];

    // Convert each value to hexadecimal and pad with zeros if necessary.
    const hex = rgbValues
        .map((val) => {
            const hexVal = parseInt(val).toString(16);
            return hexVal.length === 1 ? '0' + hexVal : hexVal;
        })
        .join('');

    return `#${hex}`;
}

export function updateWebViewTheme(setColor: RGB) {
    const color = setColor || getBackgroundColor();

    postEvent('web_app_set_header_color', {
        color
    });

    postEvent('web_app_set_background_color', {
        color
    });
}

export function setColors(colors: RequiredStringProps<ThemeChangedPayload['theme_params']>) {
    const body = document.querySelector('body') as HTMLBodyElement;

    for (const [key, value] of Object.entries(colors)) {
        const setKey = `--tg-color-${key.replace(/_/g, '-')}`;
        body.style.setProperty(setKey, value);

        if (isDev) {
            console.log(`%c█ Set color ${setKey}`, `color: ${value};`);
        }
    }
}
