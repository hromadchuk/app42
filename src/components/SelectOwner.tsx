import { useContext, useEffect, useState } from 'react';
import { Box, Center, Loader } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI } from '../lib/helpers.tsx';
import { t } from '../lib/lang.tsx';
import { AppContext } from './AppContext.tsx';
import { OwnerRow } from './OwnerRow.tsx';

export enum EOwnerType {
    user = 'user',
    chat = 'chat',
    channel = 'channel'
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

function SelectOwner({ getOwners, onOwnerSelect }: IOptionsSelectOwner) {
    const [isLoading, setLoading] = useState(true);
    const [dialogsList, setDialogsList] = useState<IOwnerRow[]>([]);

    useEffect(() => {
        (async () => {
            const owners = await getOwners();

            console.log('owners', owners);

            setDialogsList(owners);
            setLoading(false);
        })();
    }, []);

    const UsersBlock = () => {
        if (isLoading) {
            return (
                <Center h={100} mx="auto">
                    <Loader />
                </Center>
            );
        }

        if (!dialogsList.length) {
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

    return <>{UsersBlock()}</>;
}

export function SelectDialog(options: IOptionsSelectDialog) {
    const { user } = useContext(AppContext);

    async function getOwners(): Promise<IOwnerRow[]> {
        const result = (await CallAPI(
            new Api.messages.GetDialogs({
                offsetPeer: user?.id.valueOf(),
                limit: 100
            })
        )) as Api.messages.Dialogs;

        return result.dialogs
            .map((dialog): IOwnerRow => {
                let ownerId = 0;
                if (dialog.peer instanceof Api.PeerUser) {
                    ownerId = dialog.peer.userId.valueOf();
                } else if (dialog.peer instanceof Api.PeerChat) {
                    ownerId = dialog.peer.chatId.valueOf();
                } else {
                    ownerId = dialog.peer.channelId.valueOf();
                }

                const owner =
                    dialog.peer instanceof Api.PeerUser
                        ? (result.users.find((findUser) => findUser.id.valueOf() === ownerId) as Api.User)
                        : (result.chats.find((findChat) => findChat.id.valueOf() === ownerId) as
                              | Api.Chat
                              | Api.Channel);

                const row: IOwnerRow = { owner };

                if (options.getDescription) {
                    row.description = options.getDescription(owner);
                }

                return row;
            })
            .filter((row) => {
                if (
                    options.selfIgnore &&
                    row.owner instanceof Api.User &&
                    row.owner.id.valueOf() === user?.id.valueOf()
                ) {
                    return false;
                }

                if (row.owner instanceof Api.User && row.owner.bot) {
                    return false;
                }

                if (options.allowTypes.includes(EOwnerType.user) && row.owner instanceof Api.User) {
                    return true;
                }

                if (options.allowTypes.includes(EOwnerType.chat) && row.owner instanceof Api.Chat) {
                    return true;
                }

                return options.allowTypes.includes(EOwnerType.channel) && row.owner instanceof Api.Channel;
            })
            .slice(0, 20);
    }

    async function searchOwners(query: string): Promise<IOwnerRow[]> {
        console.log('searchOwners', query);

        return [];
    }

    return SelectOwner({ ...options, getOwners, searchOwners });
}
