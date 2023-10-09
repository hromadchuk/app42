import { createRoot } from 'react-dom/client';

import { getAppLangCode } from './lib/lang.tsx';

import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
import relativeTime from 'dayjs/plugin/relativeTime';

import 'dayjs/locale/ru';
import 'dayjs/locale/uk';

import App from './App.tsx';

dayjs.extend(toObject);
dayjs.extend(relativeTime);
dayjs.locale(getAppLangCode());

if (!new URLSearchParams(location.hash.slice(1)).get('tgWebAppData')) {
    location.href = 'https://t.me/kit42bot/kit42';
} else {
    createRoot(document.getElementById('root') as HTMLElement).render(<App />);
}
