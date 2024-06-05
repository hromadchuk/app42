import { createElement, CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';
import { Multiselectable } from '@telegram-apps/telegram-ui';
import { Link } from 'react-router-dom';
import { Api } from 'telegram';
import { Icon, IconChevronRight, IconProps, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { TOwnerInfo } from '../lib/helpers.ts';
import { WrappedCell } from './Helpers.tsx';
import { OwnerAvatar } from './OwnerAvatar.tsx';

interface IOwnerRow {
    owner: TOwnerInfo;
    description?: string;
    rightIcon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    withoutLink?: boolean;
    disabled?: boolean;
    callback?: () => void;
    checked?: boolean;
}

interface ILinkProps {
    onClick?: () => void;
    href?: string;
    target?: string;
    component?: 'a' | 'button';
}

export function OwnerRow({ owner, description, rightIcon, withoutLink, callback, disabled, checked }: IOwnerRow) {
    const name: string[] = [];
    const linkProps: ILinkProps = {};
    const isUser = owner instanceof Api.User;
    const isChat = owner instanceof Api.Chat;
    const isChannel = owner instanceof Api.Channel;
    const isCheckbox = checked !== undefined;

    if (!withoutLink && !disabled) {
        if (callback) {
            linkProps.onClick = () => callback();
            linkProps.component = 'a';
        } else if ((isUser || isChannel) && (owner.username || owner.usernames)) {
            const username = (owner.usernames ? owner.usernames[0].username : owner.username) as string;

            linkProps.href = `https://t.me/${username}`;
        } else if (owner?.id && (isChannel || isChat)) {
            linkProps.href = `https://t.me/c/${owner.id}/999999999`;
        }

        if (linkProps.href) {
            linkProps.target = '_blank';
            linkProps.component = 'a';
        }
    }

    if (isUser) {
        if (owner.firstName) {
            name.push(owner.firstName);
        }

        if (owner.lastName) {
            name.push(owner.lastName);
        }
    } else if (isChat || isChannel) {
        if (owner.title) {
            name.push(owner.title);
        }
    }

    if (!name.length) {
        name.push('Unknown name');
    }

    function getBadge() {
        if ((isUser || isChannel) && owner.verified) {
            return <IconRosetteDiscountCheckFilled size={18} color="#1c93e3" />;
        }

        return undefined;
    }

    const style: CSSProperties = {};
    let interactiveAnimation: 'opacity' | 'background' = 'background';

    if (withoutLink || disabled) {
        style.cursor = 'default';
        style.opacity = '1 !important';
        style.background = 'unset !important';

        interactiveAnimation = 'opacity';
    }

    if (disabled) {
        style.opacity = 0.5;
    }

    if (isCheckbox && !checked) {
        style.opacity = 0.5;
        style.filter = 'grayscale(1)';
    }

    function RightBlock() {
        if (isCheckbox) {
            return <Multiselectable checked={checked} readOnly />;
        }

        if (linkProps.component) {
            return createElement(rightIcon || IconChevronRight, { size: 14, stroke: 1.5 });
        }

        return null;
    }

    function CellRow() {
        return (
            <WrappedCell
                {...linkProps}
                titleBadge={getBadge()}
                interactiveAnimation={interactiveAnimation}
                before={<OwnerAvatar owner={owner} size={description ? 48 : 40} />}
                style={style}
                after={RightBlock()}
                description={description}
                multiline={true}
            >
                {name.join(' ')}
            </WrappedCell>
        );
    }

    return linkProps.href ? (
        <Link to={linkProps.href} target="_blank">
            {CellRow()}
        </Link>
    ) : (
        CellRow()
    );
}
