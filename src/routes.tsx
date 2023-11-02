import { Center, Loader } from '@mantine/core';
import { createElement, JSX, lazy, Suspense } from 'react';
import {
    Icon123,
    IconAddressBook,
    IconHourglassLow,
    IconKeyframes,
    IconMessageCircleCog,
    IconMessageCircleSearch,
    IconMessageCircleUp,
    IconThumbDownOff,
    TablerIconsProps
} from '@tabler/icons-react';

import { t } from './lib/lang.tsx';

const AuthRequired = lazy(() => import('./components/AuthRequired.tsx'));

export interface IRouter {
    path: string;
    id?: string;
    name?: string;
    withoutAuth?: boolean;
    isMethod?: boolean;
    element: JSX.Element;
    childElement?: JSX.Element;
    icon?: (props: TablerIconsProps) => JSX.Element;
}

export const routers: IRouter[] = [
    {
        path: '/',
        withoutAuth: true,
        element: createElement(lazy(() => import('./pages/AuthPage.tsx')))
    },
    {
        path: '/menu',
        element: createElement(lazy(() => import('./pages/MenuPage.tsx')))
    },
    {
        path: '/profile',
        element: createElement(lazy(() => import('./pages/ProfilePage.tsx')))
    },
    {
        id: 'get_id',
        icon: Icon123,
        isMethod: true,
        path: '/methods/get_id',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/GetId.tsx')))
    },
    {
        id: 'contacts_analysis',
        icon: IconAddressBook,
        isMethod: true,
        path: '/methods/contacts_analysis',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/ContactsAnalysis.tsx')))
    },
    {
        id: 'messages_stat',
        icon: IconMessageCircleSearch,
        isMethod: true,
        path: '/methods/messages_stat',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/MessagesStat.tsx')))
    },
    {
        id: 'animated_messages',
        icon: IconKeyframes,
        isMethod: true,
        path: '/methods/animated_messages',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/AnimatedMessages.tsx')))
    },
    {
        id: 'inactive_channels',
        icon: IconHourglassLow,
        isMethod: true,
        path: '/methods/inactive_channels',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/InactiveChannels.tsx')))
    },
    {
        id: 'import_messages',
        icon: IconMessageCircleUp,
        isMethod: true,
        path: '/methods/import_messages',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/ImportMessages.tsx')))
    },
    {
        id: 'clear_blacklist',
        icon: IconThumbDownOff,
        isMethod: true,
        path: '/methods/clear_blacklist',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/ClearBlacklist.tsx')))
    },
    {
        id: 'administered',
        icon: IconMessageCircleCog,
        isMethod: true,
        path: '/methods/administered',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        childElement: createElement(lazy(() => import('./methods/Administered.tsx')))
    }
].map((route: IRouter) => {
    if (route.id) {
        route.name = t(`routes.${route.id}`);
    }

    if (!route.withoutAuth) {
        route.element = <AuthRequired page={route.element} />;
    }

    route.element = (
        <Suspense
            fallback={
                <Center h={100} mx="auto">
                    <Loader />
                </Center>
            }
        >
            {route.element}
        </Suspense>
    );

    return route;
});
