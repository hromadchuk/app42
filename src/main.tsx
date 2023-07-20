import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import * as dayjs from 'dayjs';
import * as toObject from 'dayjs/plugin/toObject';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(toObject);
dayjs.extend(relativeTime);

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
