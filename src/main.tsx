import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import dayjs from 'dayjs';
import toObject from 'dayjs/plugin/toObject';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(toObject);
dayjs.extend(relativeTime);

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
