import { useEffect } from 'react';
import { MiniAppsEvents, off, on, postEvent } from '@tma.js/sdk';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { isDev } from '../lib/helpers.ts';

const excludeBackButton = ['/', '/menu'];

export function EmptyHeader() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isDev) {
            ReactGA.initialize('G-T5H886J9RS');
        }

        // settings button
        postEvent('web_app_setup_settings_button', {
            is_visible: true
        });

        const settingsPressEvent: MiniAppsEvents['settings_button_pressed'] = () => {
            navigate('/profile');
        };

        on('settings_button_pressed', settingsPressEvent);

        // back button
        const backButtonPressEvent: MiniAppsEvents['back_button_pressed'] = () => {
            navigate('/menu');

            if (window.isProgress) {
                // need for stop all requests
                window.isProgress = false;
                window.location.reload();
            }
        };

        on('back_button_pressed', backButtonPressEvent);

        return () => {
            off('settings_button_pressed', settingsPressEvent);
            off('back_button_pressed', backButtonPressEvent);
        };
    }, []);

    useEffect(() => {
        if (!isDev) {
            ReactGA.send({ hitType: 'pageview', page: location.pathname });
        }

        postEvent('web_app_setup_back_button', {
            is_visible: !excludeBackButton.includes(location.pathname)
        });
    }, [location]);

    return null;
}
