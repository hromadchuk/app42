import { ForwardRefExoticComponent, RefAttributes } from 'react';
import {
    Icon,
    IconAddressBook,
    IconMessages,
    IconProps,
    IconUser,
    IconUsersGroup,
    IconWallet
} from '@tabler/icons-react';
import { getMethods, MethodCategory } from './routes.tsx';

export interface ICard {
    id: MethodCategory;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color: `#${string}`;
}

export const cards: ICard[] = [
    {
        id: MethodCategory.ACCOUNT,
        icon: IconUser,
        color: '#9747FF'
    },
    {
        id: MethodCategory.CONTACTS,
        icon: IconAddressBook,
        color: '#FF0D72'
    },
    {
        id: MethodCategory.CHANNELS,
        icon: IconUsersGroup,
        color: '#0D9D71'
    },
    {
        id: MethodCategory.CHATS,
        icon: IconMessages,
        color: '#FF9900'
    },
    {
        id: MethodCategory.TON,
        icon: IconWallet,
        color: '#0098EA'
    }
];

export function getCardById(id: MethodCategory) {
    return cards.find((card) => card.id === id) as ICard;
}

export function getMethodsByCardId(id: MethodCategory) {
    const methods = getMethods();

    return methods.filter((method) => method.categories.includes(id));
}
