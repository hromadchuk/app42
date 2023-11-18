import { Center, Loader } from '@mantine/core';
import { createElement, JSX, lazy, Suspense } from 'react';
import {
    Icon123,
    IconAddressBook,
    IconCalendarPlus,
    IconCreativeCommonsNd,
    IconHourglassLow,
    IconKeyframes,
    IconMessageCircleCog,
    IconMessageCircleSearch,
    IconMessageCircleUp,
    IconPhoneCall,
    IconReportAnalytics,
    IconThumbDownOff,
    TablerIconsProps
} from '@tabler/icons-react';

import { t } from './lib/lang.ts';

const AuthRequired = lazy(() => import('./components/AuthRequired.tsx'));

export interface IRouter {
    path: string;
    isMethod: boolean;
    element: JSX.Element;
    id?: string;
    name?: string;
    withoutAuth?: boolean;
    childElement?: JSX.Element;
    icon?: (props: TablerIconsProps) => JSX.Element;
}

interface IAppMethodRouter {
    id: string;
    icon?: (props: TablerIconsProps) => JSX.Element;
    element: JSX.Element;
}

interface IAppRouter {
    path: string;
    withoutAuth?: boolean;
    element: JSX.Element;
    methods?: IAppMethodRouter[];
}

const appRoutes: IAppRouter[] = [
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
        path: '/methods',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        methods: [
            {
                id: 'get_id',
                icon: Icon123,
                element: createElement(lazy(() => import('./methods/GetId.tsx')))
            },
            {
                id: 'contacts_analysis',
                icon: IconAddressBook,
                element: createElement(lazy(() => import('./methods/ContactsAnalysis.tsx')))
            },
            {
                id: 'messages_stat',
                icon: IconMessageCircleSearch,
                element: createElement(lazy(() => import('./methods/MessagesStat.tsx')))
            },
            {
                id: 'animated_messages',
                icon: IconKeyframes,
                element: createElement(lazy(() => import('./methods/AnimatedMessages.tsx')))
            },
            {
                id: 'inactive_channels',
                icon: IconHourglassLow,
                element: createElement(lazy(() => import('./methods/InactiveChannels.tsx')))
            },
            {
                id: 'import_messages',
                icon: IconMessageCircleUp,
                element: createElement(lazy(() => import('./methods/ImportMessages.tsx')))
            },
            {
                id: 'clear_blacklist',
                icon: IconThumbDownOff,
                element: createElement(lazy(() => import('./methods/ClearBlacklist.tsx')))
            },
            {
                id: 'administered',
                icon: IconMessageCircleCog,
                element: createElement(lazy(() => import('./methods/Administered.tsx')))
            },
            {
                id: 'common_chats_top',
                icon: IconCreativeCommonsNd,
                element: createElement(lazy(() => import('./methods/CommonChatsTop.tsx')))
            },
            {
                id: 'calls_stat',
                icon: IconPhoneCall,
                element: createElement(lazy(() => import('./methods/CallsStat.tsx')))
            },
            {
                id: 'channels_registration',
                icon: IconCalendarPlus,
                element: createElement(lazy(() => import('./methods/ChannelsRegistration.tsx')))
            },
            {
                id: 'records_stat',
                icon: IconReportAnalytics,
                element: createElement(lazy(() => import('./methods/RecordsStat.tsx')))
            }
        ]
    }
];

const formattedRoutes: IRouter[] = [];

function makeRoute(route: IAppRouter, method?: IAppMethodRouter): IRouter {
    const result: IRouter = {
        path: route.path,
        isMethod: Boolean(method),
        element: route.element,
        withoutAuth: Boolean(route.withoutAuth)
    };

    if (method) {
        result.isMethod = true;
        result.id = method.id;
        result.name = t(`routes.${method.id}`);
        result.path = `/methods/${method.id}`;
        result.icon = method.icon;
        result.childElement = method.element;
    }

    if (!result.withoutAuth) {
        result.element = <AuthRequired page={result.element} />;
    }

    result.element = (
        <Suspense
            fallback={
                <Center h={100} mx="auto">
                    <Loader />
                </Center>
            }
        >
            {result.element}
        </Suspense>
    );

    return result;
}

for (const route of appRoutes) {
    if (route.methods) {
        formattedRoutes.push(...route.methods.map((method) => makeRoute(route, method)));
    } else {
        formattedRoutes.push(makeRoute(route));
    }
}

export const routes = formattedRoutes;
