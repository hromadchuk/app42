import { useContext, useState } from 'react';
import { ActionIcon, Button, CopyButton, Input, Space, TextInput } from '@mantine/core';
import { IconAt, IconCheck, IconCopy } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CallAPI, TOwnerInfo } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';

export default function GetId() {
    const { mt, needHideContent } = useContext(MethodContext);

    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [inputError, setInputError] = useState('');
    const [ownerInfo, setOwnerInfo] = useState<TOwnerInfo>(null);

    async function getOwnerInfo() {
        setIsLoading(true);
        setInputError('');
        setOwnerInfo(null);

        try {
            const result = await CallAPI(
                new Api.contacts.ResolveUsername({
                    username
                })
            );

            if (result.users.length) {
                setOwnerInfo(result.users[0]);
            } else if (result.chats.length) {
                setOwnerInfo(result.chats[0]);
            } else {
                setOwnerInfo(null);
            }
        } catch (error) {
            // @ts-ignore
            setInputError(error.message);
        }

        setIsLoading(false);
    }

    if (needHideContent()) return null;

    const ResultRow = () => {
        if (!ownerInfo) {
            return null;
        }

        return (
            <>
                <OwnerRow owner={ownerInfo} />
                <TextInput
                    value={ownerInfo?.id.toString()}
                    readOnly
                    mt="xs"
                    rightSection={
                        <CopyButton value={ownerInfo.id.toString()} timeout={2000}>
                            {({ copied, copy }) => (
                                <ActionIcon variant="transparent" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck /> : <IconCopy />}
                                </ActionIcon>
                            )}
                        </CopyButton>
                    }
                />
            </>
        );
    };

    return (
        <>
            <Input.Wrapper error={inputError}>
                <Input
                    leftSection={<IconAt />}
                    placeholder={mt('input_placeholder')}
                    onChange={(event) => setUsername(event.target.value)}
                    error={Boolean(inputError)}
                />
            </Input.Wrapper>
            <Button
                fullWidth
                variant="outline"
                mt="xs"
                onClick={getOwnerInfo}
                loading={isLoading}
                disabled={!username.length}
            >
                {mt('button_get')}
            </Button>
            <Space mt="xs" />

            {ResultRow()}
        </>
    );
}
