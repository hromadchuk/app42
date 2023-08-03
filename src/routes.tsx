import { Center, Loader } from '@mantine/core';
import { createElement, JSX, lazy, Suspense } from 'react';
import { Icon123, IconAddressBook, IconMessageCircleSearch, TablerIconsProps } from '@tabler/icons-react';

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
