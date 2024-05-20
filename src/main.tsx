import { createRoot } from 'react-dom/client';
import { MiniAppWrapper } from './MiniAppWrapper.tsx';
// import { getParams, isDevUser } from './lib/helpers.ts';
// import { getAppLangCode } from './lib/lang.ts';
//
// import App from './App.tsx';
//
// import dayjs from 'dayjs';
// import toObject from 'dayjs/plugin/toObject';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import localizedFormat from 'dayjs/plugin/localizedFormat';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
//
// import 'dayjs/locale/ru';
// import 'dayjs/locale/uk';
//
// dayjs.extend(toObject);
// dayjs.extend(relativeTime);
// dayjs.extend(localizedFormat);
// dayjs.extend(customParseFormat);
// dayjs.locale(getAppLangCode());
//
// if (isDevUser) {
//     const script = document.createElement('script');
//     script.src = 'https://cdn.jsdelivr.net/npm/eruda';
//     document.body.append(script);
//     script.onload = () => {
//         window.eruda.init();
//     };
// }

import '@telegram-apps/telegram-ui/dist/styles.css';
import './App.css';

createRoot(document.getElementById('root') as HTMLElement).render(<MiniAppWrapper />);
