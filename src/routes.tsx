import React, { createElement, lazy, Suspense } from 'react';
import { Icon123, IconAddressBook, TablerIconsProps } from '@tabler/icons-react';

import { t } from './lib/lang.tsx';

const AuthRequired = lazy(() => import('./components/AuthRequired.tsx'));

export interface IRouter {
    path: string;
    id?: string;
    name?: string;
    withoutAuth?: boolean;
    isMethod?: boolean;
    element: React.JSX.Element;
    childElement?: React.JSX.Element;
    icon?: (props: TablerIconsProps) => React.JSX.Element;
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
    }
].map((route: IRouter) => {
    if (route.id) {
        route.name = t(`routes.${route.id}`);
    }

    if (!route.withoutAuth) {
        route.element = <AuthRequired page={route.element} />;
    }

    route.element = <Suspense fallback={<>Lazy loading...</>}>{route.element}</Suspense>;

    return route;
});
