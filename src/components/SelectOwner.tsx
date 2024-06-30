import { useContext, useEffect, useState } from 'react';
import { Input, Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import { IconSearch } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI, getPeerId, TOwnerType } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { OwnerRow } from './OwnerRow.tsx';
import { useDebouncedInput } from '../hooks/useDebouncedInput.ts';
import { TDialogWithoutUser } from '../contexts/MethodContext.tsx';

import { AppContext } from '../contexts/AppContext.tsx';

import commonClasses from '../styles/Common.module.css';
import classes from '../styles/MenuPage.module.css';

export enum EOwnerType {
    user = 'user',
    chat = 'chat',
    channel = 'channel',
    supergroup = 'supergroup'
}

interface IOwnerRow {
    owner: TOwnerType;
    description?: string;
}

interface IOptionsBase {
    allowTypes: EOwnerType[];
    isOnlyWithKickPermissions?: boolean;
    selfIgnore?: boolean;
    onOwnerSelect: (owner: TOwnerType) => void;
    getDescription?: (owner: TOwnerType) => string;
}

interface IOptionsSelectOwner extends IOptionsBase {
    getOwners: () => Promise<IOwnerRow[]>;
    searchOwners: (query: string) => Promise<IOwnerRow[]>;
}

type IOptionsSelectDialog = IOptionsBase;

function SelectOwner({ getOwners, onOwnerSelect, searchOwners }: IOptionsSelectOwner) {
    const [isLoading, setLoading] = useState(true);
    const [dialogsList, setDialogsList] = useState<IOwnerRow[]>([]);
    const [searchDialogsList, setSearchDialogsList] = useState<IOwnerRow[] | null>(null);
    // const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearchQuery, setSearchQuery] = useDebouncedInput('', 500);

    useEffect(() => {
        (async () => {
            const owners = await getOwners();

            setDialogsList(owners);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!debouncedSearchQuery) {
            setSearchDialogsList(null);
            return;
        }

        (async () => {
            setLoading(true);

            const owners = await searchOwners(debouncedSearchQuery);

            setSearchDialogsList(owners);
            setLoading(false);
        })();
    }, [debouncedSearchQuery]);

    const UsersBlock = () => {
        if (isLoading) {
            return (
                <Placeholder>
                    <Spinner size="m" />
                </Placeholder>
            );
        }

        if (searchDialogsList?.length) {
            return searchDialogsList.map((row) => (
                <OwnerRow
                    key={row.owner.id.valueOf()}
                    owner={row.owner}
                    description={row.description}
                    callback={() => onOwnerSelect(row.owner)}
                />
            ));
        }

        if (!dialogsList.length || (searchDialogsList && !searchDialogsList.length)) {
            return <Placeholder description={t('select_owner.no_dialogs')} />;
        }

        return dialogsList.map((row) => (
            <OwnerRow
                key={row.owner.id.valueOf()}
                owner={row.owner}
                description={row.description}
                callback={() => onOwnerSelect(row.owner)}
            />
        ));
    };

    return (
        <>
            <div className={commonClasses.fixSearchBackground}>
                <Input
                    before={<IconSearch opacity={0.3} />}
                    placeholder={t('menu.search_placeholder')}
                    className={classes.searchInput}
                    onChange={setSearchQuery}
                />
            </div>

            {UsersBlock()}
        </>
    );
}

export function SelectDialog(options: IOptionsSelectDialog) {
    const { user } = useContext(AppContext);

    function checkIsCanKickUsers(owner: TDialogWithoutUser): boolean {
        return !options.isOnlyWithKickPermissions || owner.creator || Boolean(owner?.adminRights?.banUsers);
    }

    function filterOwner(row: IOwnerRow): boolean {
        if (row.owner instanceof Api.User) {
            if (row.owner.bot) {
                return false;
            }

            if (options.selfIgnore && row.owner.id.valueOf() === user?.id.valueOf()) {
                return false;
            }
        }

        if (options.allowTypes.includes(EOwnerType.user) && row.owner instanceof Api.User) {
            return true;
        }

        if (
            ((options.allowTypes.includes(EOwnerType.chat) && row.owner instanceof Api.Chat) ||
                (options.allowTypes.includes(EOwnerType.supergroup) &&
                    row.owner instanceof Api.Channel &&
                    row.owner.megagroup)) &&
            checkIsCanKickUsers(row.owner)
        ) {
            return true;
        }

        return (
            options.allowTypes.includes(EOwnerType.channel) &&
            row.owner instanceof Api.Channel &&
            !row.owner.megagroup &&
            checkIsCanKickUsers(row.owner)
        );
    }

    function formatRows(peers: Api.TypePeer[], users: Api.User[], chats: (Api.Chat | Api.Channel)[]): IOwnerRow[] {
        return peers
            .map((peer): IOwnerRow | null => {
                const ownerId = getPeerId(peer);

                const owner =
                    peer instanceof Api.PeerUser
                        ? (users.find((findUser) => findUser.id.valueOf() === ownerId) as Api.User)
                        : (chats.find((findChat) => findChat.id.valueOf() === ownerId) as Api.Chat | Api.Channel);

                if (owner instanceof Api.Chat && owner.migratedTo) {
                    return null;
                }

                const row: IOwnerRow = { owner };

                if (options.getDescription) {
                    row.description = options.getDescription(owner);
                }

                return row;
            })
            .filter(Boolean) as IOwnerRow[];
    }

    async function getOwners(): Promise<IOwnerRow[]> {
        const result = (await CallAPI(
            new Api.messages.GetDialogs({
                offsetPeer: user?.id.valueOf(),
                limit: 100
            })
        )) as Api.messages.Dialogs;

        return formatRows(
            result.dialogs.map((dialog) => dialog.peer),
            result.users as Api.User[],
            result.chats as (Api.Chat | Api.Channel)[]
        )
            .filter(filterOwner)
            .slice(0, 20);
    }

    async function searchOwners(query: string): Promise<IOwnerRow[]> {
        const result = await CallAPI(
            new Api.contacts.Search({
                q: query,
                limit: 100
            })
        );

        return formatRows(result.myResults, result.users as Api.User[], result.chats as (Api.Chat | Api.Channel)[])
            .filter(filterOwner)
            .slice(0, 20);
    }

    return SelectOwner({ ...options, getOwners, searchOwners });
}
