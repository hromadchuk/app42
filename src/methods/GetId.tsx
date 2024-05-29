import { useContext, useState } from 'react';
import { Button, Input, Section, Tappable } from '@telegram-apps/telegram-ui';
import { IconAt, IconX } from '@tabler/icons-react';
import { Api } from 'telegram';
import { CopyButton } from '../components/CopyButton.tsx';
import { CallAPI, TOwnerInfo } from '../lib/helpers.ts';
import { OwnerRow } from '../components/OwnerRow.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

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
                }),
                {
                    hideErrorAlert: true
                }
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

    return (
        <>
            <Section className={commonClasses.sectionBox}>
                <Input
                    placeholder={mt('input_placeholder')}
                    value={username}
                    status={inputError ? 'error' : 'default'}
                    header={inputError}
                    before={<IconAt size={24} />}
                    onChange={(event) => setUsername(event.target.value)}
                    after={
                        <Tappable
                            Component="div"
                            style={{
                                display: 'flex',
                                opacity: 0.5
                            }}
                            onClick={() => setUsername('')}
                        >
                            <IconX size={16} />
                        </Tappable>
                    }
                />

                <div style={{ padding: 16 }}>
                    <Button
                        stretched
                        size="l"
                        loading={isLoading}
                        disabled={!username.length || isLoading}
                        onClick={getOwnerInfo}
                    >
                        {mt('button_get')}
                    </Button>
                </div>
            </Section>

            {ownerInfo && (
                <Section className={commonClasses.sectionBox}>
                    <div style={{ paddingTop: 8 }}>
                        <OwnerRow owner={ownerInfo} />
                    </div>

                    <Input
                        after={<CopyButton value={ownerInfo.id.toString()} />}
                        value={ownerInfo.id.valueOf()}
                        readOnly
                        // onClick={copy}
                    />
                </Section>
            )}
        </>
    );
}
