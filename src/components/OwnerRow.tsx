import { createElement, CSSProperties, ForwardRefExoticComponent, RefAttributes, useState } from 'react';
import { Multiselectable, Spinner } from '@telegram-apps/telegram-ui';
import { Api } from 'telegram';
import { useUtils } from '@telegram-apps/sdk-react';
import { Icon, IconChevronRight, IconProps, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { CallAPI, notifyError, TOwnerInfo } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { isDev, wrapCallMAMethod } from '../lib/utils.ts';
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
}

export function OwnerRow({ owner, description, rightIcon, withoutLink, callback, disabled, checked }: IOwnerRow) {
    const utils = useUtils();

    const [isLoading, setLoading] = useState(false);

    const name: string[] = [];
    const linkProps: ILinkProps = {};
    const isUser = owner instanceof Api.User;
    const isChat = owner instanceof Api.Chat;
    const isChannel = owner instanceof Api.Channel;
    const isCheckbox = checked !== undefined;

    if (!withoutLink && !disabled) {
        if (callback) {
            linkProps.onClick = () => callback();
        } else if ((isUser || isChannel) && (owner.username || owner.usernames)) {
            const username = (owner.usernames ? owner.usernames[0].username : owner.username) as string;

            linkProps.href = `https://t.me/${username}`;
        } else if (isUser && owner?.phone) {
            linkProps.href = `https://t.me/+${owner.phone}`;
        } else if (owner?.id && (isChannel || isChat)) {
            linkProps.onClick = async () => {
                if (isLoading) {
                    return;
                }

                setLoading(true);

                const dialog = await CallAPI(
                    new Api.messages.GetHistory({
                        peer: owner,
                        limit: 1
                    })
                );

                if (
                    dialog instanceof Api.messages.Messages ||
                    dialog instanceof Api.messages.MessagesSlice ||
                    dialog instanceof Api.messages.ChannelMessages
                ) {
                    const messageId = dialog.messages[0].id;
                    if (messageId) {
                        const link = `https://t.me/c/${owner.id}/${messageId}`;

                        if (isDev) {
                            window.open(link);
                        } else {
                            wrapCallMAMethod<void>(() => utils.openTelegramLink(link));
                        }
                    } else {
                        notifyError({
                            message: t('common.errors.cant_open_link')
                        });
                    }
                } else {
                    notifyError({
                        message: t('common.errors.cant_open_link')
                    });
                }

                setLoading(false);
            };
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
        if (isLoading) {
            return <Spinner size="s" />;
        }

        if (isCheckbox) {
            return <Multiselectable checked={checked} readOnly />;
        }

        if (linkProps.href || rightIcon) {
            return createElement(rightIcon || IconChevronRight, { size: 14, stroke: 1.5 });
        }

        return null;
    }

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
