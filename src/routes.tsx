import { createElement, JSX, lazy, Suspense } from 'react';
import { Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import {
    Icon123,
    IconAddressBook,
    IconArchive,
    IconCake,
    IconCalendarPlus,
    IconCoins,
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
    IconTransfer,
    IconUsersGroup,
    IconWritingSign,
    TablerIconsProps
} from '@tabler/icons-react';

import { t } from './lib/lang.ts';

export enum MethodCategory {
    ACCOUNT = 'account',
    CONTACTS = 'contacts',
    CHANNELS = 'channels',
    CHATS = 'chats',
    TON = 'ton'
}

export enum AuthType {
    TG = 'tg',
    TON = 'ton'
}

export interface IMethod {
    id: string;
    name: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    categories: MethodCategory[];
    authType: AuthType;
}

export interface IRouter extends Partial<IMethod> {
    path: string;
    element: JSX.Element;
    childElement?: JSX.Element;
    methodId?: string;
}

interface IAppMethodRouter {
    id: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    element: JSX.Element;
    categories: MethodCategory[];
    authType: AuthType;
}

interface IAppRouter {
    path: string;
    element: JSX.Element;
    methods?: IAppMethodRouter[];
}

const appRoutes: IAppRouter[] = [
    {
        path: '/',
        element: createElement(lazy(() => import('./pages/MenuPage.tsx')))
    },
    // {
    //     path: '/methods',
    //     element: createElement(lazy(() => import('./methods/AbstractMethod.tsx'))),
    //     methods: [
    //         {
    //             id: 'get_id',
    //             icon: Icon123,
    //             element: createElement(lazy(() => import('./methods/GetId.tsx'))),
    //             categories: [MethodCategory.ACCOUNT, MethodCategory.CHANNELS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'contacts_analysis',
    //             icon: IconAddressBook,
    //             element: createElement(lazy(() => import('./methods/ContactsAnalysis.tsx'))),
    //             categories: [MethodCategory.CONTACTS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'messages_stat',
    //             icon: IconMessageCircleSearch,
    //             element: createElement(lazy(() => import('./methods/MessagesStat.tsx'))),
    //             categories: [MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'animated_messages',
    //             icon: IconKeyframes,
    //             element: createElement(lazy(() => import('./methods/AnimatedMessages.tsx'))),
    //             categories: [MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'inactive_channels',
    //             icon: IconHourglassLow,
    //             element: createElement(lazy(() => import('./methods/InactiveChannels.tsx'))),
    //             categories: [MethodCategory.CHANNELS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'import_messages',
    //             icon: IconMessageCircleUp,
    //             element: createElement(lazy(() => import('./methods/ImportMessages.tsx'))),
    //             categories: [MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'clear_blacklist',
    //             icon: IconThumbDownOff,
    //             element: createElement(lazy(() => import('./methods/ClearBlacklist.tsx'))),
    //             categories: [MethodCategory.ACCOUNT],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'administered',
    //             icon: IconMessageCircleCog,
    //             element: createElement(lazy(() => import('./methods/Administered.tsx'))),
    //             categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'common_chats_top',
    //             icon: IconCreativeCommonsNd,
    //             element: createElement(lazy(() => import('./methods/CommonChatsTop.tsx'))),
    //             categories: [MethodCategory.CONTACTS, MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'calls_stat',
    //             icon: IconPhoneCall,
    //             element: createElement(lazy(() => import('./methods/CallsStat.tsx'))),
    //             categories: [MethodCategory.CONTACTS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'channels_registration',
    //             icon: IconCalendarPlus,
    //             element: createElement(lazy(() => import('./methods/ChannelsRegistration.tsx'))),
    //             categories: [MethodCategory.CHANNELS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'records_stat',
    //             icon: IconReportAnalytics,
    //             element: createElement(lazy(() => import('./methods/RecordsStat.tsx'))),
    //             categories: [MethodCategory.CHANNELS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'stories_stat',
    //             icon: IconPhotoPentagon,
    //             element: createElement(lazy(() => import('./methods/StoriesStat.tsx'))),
    //             categories: [MethodCategory.ACCOUNT],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'dialog_joined',
    //             icon: IconDoorEnter,
    //             element: createElement(lazy(() => import('./methods/DialogJoined.tsx'))),
    //             categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'clear_dialog_members',
    //             icon: IconFriendsOff,
    //             element: createElement(lazy(() => import('./methods/ClearDialogMembers.tsx'))),
    //             categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'birthdays',
    //             icon: IconCake,
    //             element: createElement(lazy(() => import('./methods/Birthdays.tsx'))),
    //             categories: [MethodCategory.CONTACTS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'own_channels',
    //             icon: IconUsersGroup,
    //             element: createElement(lazy(() => import('./methods/OwnChannels.tsx'))),
    //             categories: [MethodCategory.CONTACTS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'ton_contacts',
    //             icon: IconArchive,
    //             element: createElement(lazy(() => import('./methods/TonContactsWithNFT.tsx'))),
    //             categories: [MethodCategory.TON, MethodCategory.CONTACTS],
    //             authType: AuthType.TG
    //         },
    //         {
    //             id: 'ton_jettons_analysis',
    //             icon: IconCoins,
    //             element: createElement(lazy(() => import('./methods/TonJettonsAnalysis.tsx'))),
    //             categories: [MethodCategory.TON],
    //             authType: AuthType.TON
    //         },
    //         {
    //             id: 'ton_transactions',
    //             icon: IconTransfer,
    //             element: createElement(lazy(() => import('./methods/TonTransactions.tsx'))),
    //             categories: [MethodCategory.TON],
    //             authType: AuthType.TON
    //         },
    //         {
    //             id: 'contacts_names',
    //             icon: IconWritingSign,
    //             element: createElement(lazy(() => import('./methods/ContactsNames.tsx'))),
    //             categories: [MethodCategory.CONTACTS, MethodCategory.ACCOUNT],
    //             authType: AuthType.TG
    //         }
    //     ]
    // }
];

const formattedRoutes: IRouter[] = [];

function makeRoute(route: IAppRouter, method?: IAppMethodRouter): IRouter {
    const result: IRouter = {
        path: route.path,
        element: route.element
    };

    if (method) {
        result.path = `/methods/${method.id}`;
        result.childElement = method.element;
        result.methodId = method.id;
    }

    result.element = (
        <Suspense
            fallback={
                <Placeholder>
                    <Spinner size="m" />
                </Placeholder>
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
        categories: item.categories,
        authType: item.authType
    }));

    return methods.sort((a, b) => a.name.localeCompare(b.name));
};
