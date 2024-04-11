import { Center, Loader } from '@mantine/core';
import { createElement, JSX, lazy, Suspense } from 'react';
import {
    Icon123,
    IconAddressBook,
    IconCalendarPlus,
    IconCreativeCommonsNd,
    IconDoorEnter,
    IconFriendsOff,
    IconHourglassLow,
    IconKeyframes,
    IconMessageCircleCog,
    IconMessageCircleSearch,
    IconMessageCircleUp,
    IconPhoneCall,
    IconPhotoPentagon,
    IconReportAnalytics,
    IconThumbDownOff,
    IconUser,
    TablerIconsProps
} from '@tabler/icons-react';

import { t } from './lib/lang.ts';

const AuthRequired = lazy(() => import('./components/AuthRequired.tsx'));

export enum MethodCategory {
    ACCOUNT = 'account',
    CONTACTS = 'contacts',
    CHANNELS = 'channels',
    CHATS = 'chats',
    TON = 'ton'
}

export interface IMethod {
    id: string;
    name: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    categories: MethodCategory[];
}

export interface IRouter extends Partial<IMethod> {
    path: string;
    element: JSX.Element;
    withoutAuth?: boolean;
    childElement?: JSX.Element;
    methodId?: string;
}

interface IAppMethodRouter {
    id: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    element: JSX.Element;
    categories: MethodCategory[];
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
        element: createElement(lazy(() => import('./pages/MenuPage.tsx')))
    },
    {
        path: '/methods',
        element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
        methods: [
            {
                id: 'get_id',
                icon: Icon123,
                element: createElement(lazy(() => import('./methods/GetId.tsx'))),
                categories: [MethodCategory.ACCOUNT, MethodCategory.CHANNELS]
            },
            {
                id: 'contacts_analysis',
                icon: IconAddressBook,
                element: createElement(lazy(() => import('./methods/ContactsAnalysis.tsx'))),
                categories: [MethodCategory.CONTACTS]
            },
            {
                id: 'messages_stat',
                icon: IconMessageCircleSearch,
                element: createElement(lazy(() => import('./methods/MessagesStat.tsx'))),
                categories: [MethodCategory.CHATS]
            },
            {
                id: 'animated_messages',
                icon: IconKeyframes,
                element: createElement(lazy(() => import('./methods/AnimatedMessages.tsx'))),
                categories: [MethodCategory.CHATS]
            },
            {
                id: 'inactive_channels',
                icon: IconHourglassLow,
                element: createElement(lazy(() => import('./methods/InactiveChannels.tsx'))),
                categories: [MethodCategory.CHANNELS]
            },
            {
                id: 'import_messages',
                icon: IconMessageCircleUp,
                element: createElement(lazy(() => import('./methods/ImportMessages.tsx'))),
                categories: [MethodCategory.CHATS]
            },
            {
                id: 'clear_blacklist',
                icon: IconThumbDownOff,
                element: createElement(lazy(() => import('./methods/ClearBlacklist.tsx'))),
                categories: [MethodCategory.ACCOUNT]
            },
            {
                id: 'administered',
                icon: IconMessageCircleCog,
                element: createElement(lazy(() => import('./methods/Administered.tsx'))),
                categories: [MethodCategory.CHANNELS, MethodCategory.CHATS]
            },
            {
                id: 'common_chats_top',
                icon: IconCreativeCommonsNd,
                element: createElement(lazy(() => import('./methods/CommonChatsTop.tsx'))),
                categories: [MethodCategory.CONTACTS, MethodCategory.CHATS]
            },
            {
                id: 'calls_stat',
                icon: IconPhoneCall,
                element: createElement(lazy(() => import('./methods/CallsStat.tsx'))),
                categories: [MethodCategory.CONTACTS]
            },
            {
                id: 'channels_registration',
                icon: IconCalendarPlus,
                element: createElement(lazy(() => import('./methods/ChannelsRegistration.tsx'))),
                categories: [MethodCategory.CHANNELS]
            },
            {
                id: 'records_stat',
                icon: IconReportAnalytics,
                element: createElement(lazy(() => import('./methods/RecordsStat.tsx'))),
                categories: [MethodCategory.CHANNELS]
            },
            {
                id: 'stories_stat',
                icon: IconPhotoPentagon,
                element: createElement(lazy(() => import('./methods/StoriesStat.tsx'))),
                categories: [MethodCategory.ACCOUNT]
            },
            {
                id: 'dialog_joined',
                icon: IconDoorEnter,
                element: createElement(lazy(() => import('./methods/DialogJoined.tsx'))),
                categories: [MethodCategory.CHANNELS, MethodCategory.CHATS]
            },
            {
                id: 'clear_dialog_members',
                icon: IconFriendsOff,
                element: createElement(lazy(() => import('./methods/ClearDialogMembers.tsx'))),
                categories: [MethodCategory.CHANNELS, MethodCategory.CHATS]
            },
            {
                id: 'wallet',
                icon: IconUser,
                element: createElement(lazy(() => import('./methods/TonWallet.tsx'))),
                categories: [MethodCategory.TON]
            }
        ]
    }
];

const formattedRoutes: IRouter[] = [];

function makeRoute(route: IAppRouter, method?: IAppMethodRouter): IRouter {
    const result: IRouter = {
        path: route.path,
        element: route.element,
        withoutAuth: Boolean(route.withoutAuth)
    };

    if (method) {
        result.path = `/methods/${method.id}`;
        result.childElement = method.element;
        result.methodId = method.id;
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

export const getMethods = (): IMethod[] => {
    const methodsRoute = appRoutes.find((item) => item.path === '/methods') as Required<IAppRouter>;

    const methods = methodsRoute.methods.map((item) => ({
        id: item.id,
        name: t(`routes.${item.id}`),
        icon: item.icon,
        categories: item.categories
    }));

    return methods.sort((a, b) => a.name.localeCompare(b.name));
};
