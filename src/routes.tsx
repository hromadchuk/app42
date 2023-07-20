import React, { createElement, lazy, Suspense } from 'react';
import { Icon123, IconAddressBook, TablerIconsProps } from '@tabler/icons-react';

import { AuthRequired } from './components/AuthRequired.tsx';
import { t } from './lib/lang.tsx';

export interface IRouter {
    path: string;
    file: string;
    child?: string;
    id?: string;
    name?: string;
    withoutAuth?: boolean;
    isMethod?: boolean;
    element?: React.JSX.Element;
    childElement?: React.JSX.Element;
    icon?: (props: TablerIconsProps) => React.JSX.Element;
}

export const routers: IRouter[] = [
    {
        path: '/',
        withoutAuth: true,
        file: './pages/AuthPage.tsx'
    },
    {
        path: '/menu',
        file: './pages/MenuPage.tsx'
    },
    {
        path: '/profile',
        file: './pages/ProfilePage.tsx'
    },
    {
        id: 'get_id',
        icon: Icon123,
        isMethod: true,
        path: '/methods/get_id',
        file: './methods/AbstractMethod.tsx',
        child: './methods/GetId.tsx'
    },
    {
        id: 'contacts_analysis',
        icon: IconAddressBook,
        isMethod: true,
        path: '/methods/contacts_analysis',
        file: './methods/AbstractMethod.tsx',
        child: './methods/ContactsAnalysis.tsx'
    }
].map((route: IRouter) => {
    route.element = createElement(lazy(() => import(/* @vite-ignore */ route.file as string)));

    if (route.id) {
        route.name = t(`routes.${route.id}`);
    }

    if (route.child) {
        route.childElement = createElement(lazy(() => import(/* @vite-ignore */ route.child as string)));
    }

    if (!route.withoutAuth) {
        route.element = <AuthRequired page={route.element} />;
    }

    route.element = <Suspense fallback={<>Lazy loading...</>}>{route.element}</Suspense>;

    return route;
});
