import { useContext, useEffect, useState } from 'react';
import { Box, Center, CloseButton, Input, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconUsersGroup } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI, getPeerId } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { OwnerRow } from './OwnerRow.tsx';

export enum EOwnerType {
    user = 'user',
    chat = 'chat',
    channel = 'channel',
    supergroup = 'supergroup'
}

type TOwnerType = Api.User | Api.Chat | Api.Channel;

interface IOwnerRow {
    owner: TOwnerType;
    description?: string;
}

interface IOptionsBase {
    allowTypes: EOwnerType[];
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
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 500);

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
                <Center h={100} mx="auto">
                    <Loader />
                </Center>
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
            return (
                <Box p="lg">
                    <Center>
                        <IconUsersGroup size={50} />
                    </Center>
                    <Center>{t('select_owner.no_dialogs')}</Center>
                </Box>
            );
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
            <Input
                leftSection={<IconSearch />}
                mb="sm"
                placeholder={t('select_owner.search_placeholder')}
                value={searchQuery}
                rightSectionPointerEvents="all"
                rightSection={searchQuery && <CloseButton onClick={() => setSearchQuery('')} />}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
            {UsersBlock()}
        </>
    );
}

export function SelectDialog(options: IOptionsSelectDialog) {
    const { user, setAppLoading } = useContext(AppContext);

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
            (options.allowTypes.includes(EOwnerType.chat) && row.owner instanceof Api.Chat) ||
            (options.allowTypes.includes(EOwnerType.supergroup) &&
                row.owner instanceof Api.Channel &&
                row.owner.megagroup)
        ) {
            return true;
        }

        return (
            options.allowTypes.includes(EOwnerType.channel) && row.owner instanceof Api.Channel && !row.owner.megagroup
        );
    }

    function formatRows(peers: Api.TypePeer[], users: Api.User[], chats: (Api.Chat | Api.Channel)[]): IOwnerRow[] {
        return peers.map((peer): IOwnerRow => {
            let ownerId = 0;
            ownerId = getPeerId(peer);

            const owner =
                peer instanceof Api.PeerUser
                    ? (users.find((findUser) => findUser.id.valueOf() === ownerId) as Api.User)
                    : (chats.find((findChat) => findChat.id.valueOf() === ownerId) as Api.Chat | Api.Channel);

            const row: IOwnerRow = { owner };

            if (options.getDescription) {
                row.description = options.getDescription(owner);
            }

            return row;
        });
    }

    async function getOwners(): Promise<IOwnerRow[]> {
        setAppLoading(true);

        const result = (await CallAPI(
            new Api.messages.GetDialogs({
                offsetPeer: user?.id.valueOf(),
                limit: 100
            })
        )) as Api.messages.Dialogs;

        setAppLoading(false);

        return formatRows(
            result.dialogs.map((dialog) => dialog.peer),
            result.users as Api.User[],
            result.chats as (Api.Chat | Api.Channel)[]
        )
            .filter(filterOwner)
            .slice(0, 20);
    }

    async function searchOwners(query: string): Promise<IOwnerRow[]> {
        setAppLoading(true);

        const result = await CallAPI(
            new Api.contacts.Search({
                q: query,
                limit: 100
            })
        );

        setAppLoading(false);

        return formatRows(result.myResults, result.users as Api.User[], result.chats as (Api.Chat | Api.Channel)[])
            .filter(filterOwner)
            .slice(0, 20);
    }

    return SelectOwner({ ...options, getOwners, searchOwners });
}
