import { createRoot } from 'react-dom/client';
import { getParams, isDevUser } from './lib/helpers.ts';
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

if (isDevUser) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    document.body.append(script);
    script.onload = () => {
        window.eruda.init();
    };
}

// only for test!!!
import Test from '../Test.tsx';
createRoot(document.getElementById('root') as HTMLElement).render(<Test />);

// const tgWebAppData = getParams().get('tgWebAppData');
// if (tgWebAppData) {
//     updateThemeFromParams();
//     createRoot(document.getElementById('root') as HTMLElement).render(<App />);
// } else {
//     location.href = 'https://t.me/kit42app/kit42';
// }
