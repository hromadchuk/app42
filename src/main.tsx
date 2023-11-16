import { createRoot } from 'react-dom/client';

import { getAppLangCode } from './lib/lang.tsx';

import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/ru';
import 'dayjs/locale/uk';

import App from './App.tsx';

dayjs.extend(toObject);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale(getAppLangCode());

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
