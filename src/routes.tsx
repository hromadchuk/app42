import {
    createElement,
    ForwardRefExoticComponent,
    FunctionComponentElement,
    JSX,
    lazy,
    RefAttributes,
    Suspense
} from 'react';
import { Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import {
    Icon,
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
    IconProps,
    IconReportAnalytics,
    IconThumbDownOff,
    IconTransfer,
    IconUsersGroup,
    IconWritingSign
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
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    categories: MethodCategory[];
    authType: AuthType;
    element: JSX.Element;
}

export interface IRouter {
    path: string;
    element: JSX.Element;
}

export interface IMethodComponent {
    id: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    categories: MethodCategory[];
    authType: AuthType;
    element: JSX.Element;
}

interface IAppMethodRouter {
    id: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
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
    {
        path: '/methods/:categoryId',
        element: createElement(lazy(() => import('./pages/MethodsPage.tsx')))
    },
    {
        path: '/methods/:categoryId/:methodId',
        element: createElement(lazy(() => import('./pages/MethodPage.tsx')))
    }
];

const appMethods: IMethodComponent[] = [
    {
        id: 'get_id',
        icon: Icon123,
        element: createElement(lazy(() => import('./methods/GetId.tsx'))),
        categories: [MethodCategory.ACCOUNT, MethodCategory.CHANNELS],
        authType: AuthType.TG
    },
    {
        id: 'contacts_analysis',
        icon: IconAddressBook,
        element: createElement(lazy(() => import('./methods/ContactsAnalysis.tsx'))),
        categories: [MethodCategory.CONTACTS],
        authType: AuthType.TG
    },
    {
        id: 'messages_stat',
        icon: IconMessageCircleSearch,
        element: createElement(lazy(() => import('./methods/MessagesStat.tsx'))),
        categories: [MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'animated_messages',
        icon: IconKeyframes,
        element: createElement(lazy(() => import('./methods/AnimatedMessages.tsx'))),
        categories: [MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'inactive_channels',
        icon: IconHourglassLow,
        element: createElement(lazy(() => import('./methods/InactiveChannels.tsx'))),
        categories: [MethodCategory.CHANNELS],
        authType: AuthType.TG
    },
    {
        id: 'import_messages',
        icon: IconMessageCircleUp,
        element: createElement(lazy(() => import('./methods/ImportMessages.tsx'))),
        categories: [MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'clear_blacklist',
        icon: IconThumbDownOff,
        element: createElement(lazy(() => import('./methods/ClearBlacklist.tsx'))),
        categories: [MethodCategory.ACCOUNT],
        authType: AuthType.TG
    },
    {
        id: 'administered',
        icon: IconMessageCircleCog,
        element: createElement(lazy(() => import('./methods/Administered.tsx'))),
        categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'common_chats_top',
        icon: IconCreativeCommonsNd,
        element: createElement(lazy(() => import('./methods/CommonChatsTop.tsx'))),
        categories: [MethodCategory.CONTACTS, MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'calls_stat',
        icon: IconPhoneCall,
        element: createElement(lazy(() => import('./methods/CallsStat.tsx'))),
        categories: [MethodCategory.CONTACTS],
        authType: AuthType.TG
    },
    {
        id: 'channels_registration',
        icon: IconCalendarPlus,
        element: createElement(lazy(() => import('./methods/ChannelsRegistration.tsx'))),
        categories: [MethodCategory.CHANNELS],
        authType: AuthType.TG
    },
    {
        id: 'records_stat',
        icon: IconReportAnalytics,
        element: createElement(lazy(() => import('./methods/RecordsStat.tsx'))),
        categories: [MethodCategory.CHANNELS],
        authType: AuthType.TG
    },
    {
        id: 'stories_stat',
        icon: IconPhotoPentagon,
        element: createElement(lazy(() => import('./methods/StoriesStat.tsx'))),
        categories: [MethodCategory.ACCOUNT],
        authType: AuthType.TG
    },
    {
        id: 'dialog_joined',
        icon: IconDoorEnter,
        element: createElement(lazy(() => import('./methods/DialogJoined.tsx'))),
        categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'clear_dialog_members',
        icon: IconFriendsOff,
        element: createElement(lazy(() => import('./methods/ClearDialogMembers.tsx'))),
        categories: [MethodCategory.CHANNELS, MethodCategory.CHATS],
        authType: AuthType.TG
    },
    {
        id: 'birthdays',
        icon: IconCake,
        element: createElement(lazy(() => import('./methods/Birthdays.tsx'))),
        categories: [MethodCategory.CONTACTS],
        authType: AuthType.TG
    },
    {
        id: 'own_channels',
        icon: IconUsersGroup,
        element: createElement(lazy(() => import('./methods/OwnChannels.tsx'))),
        categories: [MethodCategory.CONTACTS],
        authType: AuthType.TG
    },
    {
        id: 'ton_contacts',
        icon: IconArchive,
        element: createElement(lazy(() => import('./methods/TonContactsWithNFT.tsx'))),
        categories: [MethodCategory.TON, MethodCategory.CONTACTS],
        authType: AuthType.TG
    },
    {
        id: 'ton_jettons_analysis',
        icon: IconCoins,
        element: createElement(lazy(() => import('./methods/TonJettonsAnalysis.tsx'))),
        categories: [MethodCategory.TON],
        authType: AuthType.TON
    },
    {
        id: 'ton_transactions',
        icon: IconTransfer,
        element: createElement(lazy(() => import('./methods/TonTransactions.tsx'))),
        categories: [MethodCategory.TON],
        authType: AuthType.TON
    },
    {
        id: 'contacts_names',
        icon: IconWritingSign,
        element: createElement(lazy(() => import('./methods/ContactsNames.tsx'))),
        categories: [MethodCategory.CONTACTS, MethodCategory.ACCOUNT],
        authType: AuthType.TG
    }
];

function wrapElement(element: FunctionComponentElement<unknown>) {
    return (
        <Suspense
            fallback={
                <Placeholder>
                    <Spinner size="m" />
                </Placeholder>
            }
        >
            {element}
        </Suspense>
    );
}

export const routes = appRoutes.map((route) => ({
    path: route.path,
    element: wrapElement(route.element)
}));

export function getMethods(): IMethod[] {
    const methods = appMethods.map((item) => ({
        id: item.id,
        name: t(`routes.${item.id}`),
        icon: item.icon,
        categories: item.categories,
        authType: item.authType,
        element: item.element
    }));

    return methods.sort((a, b) => a.name.localeCompare(b.name));
}

export function getMethodsByName(name: string): IMethod[] {
    return getMethods().filter((method) => method.name.toLowerCase().includes(name.toLowerCase()));
}

export function getMethodById(methodId: string): IMethod {
    return getMethods().find((method) => method.id === methodId) as IMethod;
}
