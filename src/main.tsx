import { createRoot } from 'react-dom/client';
import { getParams } from './lib/helpers.ts';
import { getAppLangCode } from './lib/lang.ts';
import { updateThemeFromParams } from './lib/theme.ts';

import App from './App.tsx';

import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/ru';
import 'dayjs/locale/uk';

dayjs.extend(toObject);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale(getAppLangCode());

const tgWebAppData = getParams().get('tgWebAppData');

if (!tgWebAppData) {
    location.href = 'https://t.me/kit42bot/kit42';
} else {
    updateThemeFromParams();
    createRoot(document.getElementById('root') as HTMLElement).render(<App />);
}
