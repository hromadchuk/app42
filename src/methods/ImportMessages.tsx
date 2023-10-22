import { createElement, useContext, useEffect, useState } from 'react';
import {
    Button,
    CloseButton,
    FileButton,
    Input,
    Notification,
    Stack,
    Text,
    Title,
    UnstyledButton
} from '@mantine/core';
import { IconBrandFacebook, IconBrandInstagram, IconBrandVk, IconSearch } from '@tabler/icons-react';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import dayjs from 'dayjs';
import { Api } from 'telegram';
import { CustomFile } from 'telegram/client/uploads';
import { ExAvatar } from '../components/ExAvatar.tsx';

import { MethodContext } from '../components/MethodContext.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { CallAPI, getDocLink } from '../lib/helpers.tsx';
import { t } from '../lib/lang.tsx';

// @ts-ignore
import classes from '../styles/MenuPage.module.css';

enum ImportType {
    VK = 'vk',
    Instagram = 'instagram',
    Facebook = 'facebook'
}

interface IFileUser {
    filePath: string;
    name: string;
}

enum TImportMedia {
    PHOTO = 'photo'
}

interface IJSZipObject extends JSZip.JSZipObject {
    _data: {
        compressedSize: number;
        compressedContent: Uint8Array;
    };
}

interface IImportData {
    rows: string[];
    media: {
        name: string;
        type: TImportMedia;
        path: string;
    }[];
}

interface IMetaFileSchema {
    participants: {
        name: string;
    }[];
    messages: {
        sender_name: string;
        timestamp_ms: number;
        content: string;
        photos: {
            uri: string;
            creation_timestamp: number;
        }[];
        is_geoblocked_for_viewer: boolean;
    }[];
    title: string;
    is_still_participant: boolean;
    thread_path: string;
}

const icons = {
    [ImportType.VK]: IconBrandVk,
    [ImportType.Facebook]: IconBrandFacebook,
    [ImportType.Instagram]: IconBrandInstagram
};

export const ImportMessages = () => {
    const { mt, needHideContent, setProgress, getProgress, setFinishBlock } = useContext(MethodContext);

    const [importType, setImportType] = useState<ImportType | null>(null);
    const [fileUsers, setFileUsers] = useState<IFileUser[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [selectedUserFrom, setSelectedUserFrom] = useState<IFileUser | null>(null);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (!file) {
            return;
        }

        readFile(file);
    }, [file]);

    async function readFile(uploadedFile: File) {
        setLoading(true);
        setErrorText(null);

        const archive = await new JSZip().loadAsync(uploadedFile);
        const files = Object.keys(archive.files);

        const path = files.find((filePath) => filePath.endsWith('messages/'));
        if (!path) {
            setLoading(false);
            setErrorText(mt('errors.no_messages'));
            return;
        }

        const users = await getUsers(archive, files);

        if (!users.length) {
            setLoading(false);
            setErrorText(mt('errors.no_users'));
            return;
        }

        setLoading(false);
        setFileUsers(users);
    }

    async function getUsers(archive: JSZip, files: string[]) {
        const filesWithUsers: IFileUser[] = [];

        if (importType === ImportType.Instagram) {
            for (const filePath of files) {
                if (filePath.match(/^messages\/inbox\/[\w.-]+\/$/)) {
                    const content = JSON.parse(
                        await (archive.file(filePath + 'message_1.json') as JSZip.JSZipObject).async('string')
                    );

                    if (content.participants.length > 2) {
                        continue; // skip multi chats
                    }

                    const name = decodeText(content.title);
                    if (name === 'Instagram User') {
                        continue;
                    }

                    filesWithUsers.push({
                        filePath,
                        name
                    });
                }
            }
        }

        if (importType === ImportType.Facebook) {
            for (const filePath of files) {
                if (filePath.match(/^your_activity_across_facebook\/messages\/inbox\/[\w.-]+\/$/)) {
                    const content = JSON.parse(
                        await (archive.file(filePath + 'message_1.json') as JSZip.JSZipObject).async('string')
                    );

                    if (content.participants.length > 2) {
                        continue; // skip multi chats
                    }

                    filesWithUsers.push({
                        filePath,
                        name: decodeText(content.title)
                    });
                }
            }
        }

        return filesWithUsers;
    }

    function selectUserFrom(user: IFileUser) {
        setSearchQuery('');
        setSelectedUserFrom(user);
    }

    async function getImportData(user: IFileUser): Promise<IImportData> {
        const data: IImportData = {
            rows: [],
            media: []
        };

        const archive = await new JSZip().loadAsync(file as File);
        const files = Object.keys(archive.files);
        const userFiles = files.filter(
            (filePath) => filePath.startsWith(user.filePath) && filePath.length > user.filePath.length
        );

        // if (importType === ImportType.VK) {
        //
        // }

        if (importType === ImportType.Instagram || importType === ImportType.Facebook) {
            const messageFiles = userFiles.filter((filePath) => filePath.match(/\/message_\d+\.json$/));
            const messages = [];

            for (const filePath of messageFiles) {
                const content: IMetaFileSchema = JSON.parse(
                    await (archive.file(filePath) as JSZip.JSZipObject).async('string')
                );

                messages.push(...content.messages);
            }

            messages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

            messages.forEach((message) => {
                const date = dayjs(message.timestamp_ms).format('DD.MM.YYYY, HH:mm:ss');
                const prefix = `[${date}] ${message.sender_name}: `;

                if (message.content) {
                    data.rows.push(prefix + decodeText(message.content));
                }

                if (message.photos) {
                    message.photos.forEach((photo) => {
                        const photoName = photo.uri.split('/').pop() as string;

                        data.rows.push(prefix + `<attached: ${photoName}>`);
                        data.media.push({
                            name: photoName,
                            path: photo.uri,
                            type: TImportMedia.PHOTO
                        });
                    });
                }
            });
        }

        return data;
    }

    async function selectUserTo(user: Api.User) {
        setSearchQuery('');
        setProgress({});

        const importData = await getImportData(selectedUserFrom as IFileUser);
        const testData = importData.rows.slice(0, 100).join('\n');

        try {
            await CallAPI(
                new Api.messages.CheckHistoryImport({
                    importHead: testData
                })
            );
        } catch (error) {
            setErrorText(error?.toString() as string);
            setSelectedUserFrom(null);
            setFileUsers([]);
            setProgress(null);
            return;
        }

        const bufferText = Buffer.from(importData.rows.join('\n'), 'utf-8');

        const init = await CallAPI(
            new Api.messages.InitHistoryImport({
                peer: user,
                file: await uploadFile('messages.txt', bufferText.length, bufferText),
                mediaCount: importData.media.length
            })
        );

        if (importData.media.length) {
            setProgress({ text: mt('uploading_media'), total: importData.media.length });

            const archive = await new JSZip().loadAsync(file as File);

            for (const media of importData.media) {
                const mediaFile = archive.file(media.path) as IJSZipObject;

                let teMedia: Api.TypeInputMedia | undefined;

                if (media.type === TImportMedia.PHOTO) {
                    teMedia = new Api.InputMediaUploadedPhoto({
                        file: await uploadFile(
                            media.name,
                            mediaFile._data.compressedSize,
                            Buffer.from(mediaFile._data.compressedContent)
                        )
                    });
                }

                await CallAPI(
                    new Api.messages.UploadImportedMedia({
                        peer: user,
                        importId: init.id,
                        fileName: media.name,
                        media: teMedia
                    })
                );

                const currentProgress = getProgress();
                setProgress({ ...currentProgress, count: (currentProgress.count || 0) + 1 });
            }
        }

        await CallAPI(
            new Api.messages.StartHistoryImport({
                peer: user,
                importId: init.id
            })
        );

        setFinishBlock({});
    }

    function decodeText(text: string): string {
        const decoder = new TextDecoder('utf-8');

        return decoder.decode(new Uint8Array(text.split('').map((char) => char.charCodeAt(0))));
    }

    function filterList(users: IFileUser[]): IFileUser[] {
        if (searchQuery) {
            return users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return users;
    }

    function uploadFile(name: string, size: number, data: Buffer) {
        return window.TelegramClient.uploadFile({
            // @ts-ignore
            file: new CustomFile(name, size, '', data),
            workers: 1
        });
    }

    if (needHideContent()) return null;

    function RadioRow({ type }: { type: ImportType }) {
        const icon = createElement(icons[type], { size: 14 });
        const variant = importType === type ? 'light' : 'default';

        return (
            <Button leftSection={icon} variant={variant} onClick={() => setImportType(type)}>
                {mt(`networks.${type}`)}
            </Button>
        );
    }

    function FixFileButton() {
        return (
            // @ts-ignore fix incorrect props for FileButtonProps
            <FileButton onChange={setFile} accept=".zip" mt="md" fullWidth loading={isLoading}>
                {(props) => (
                    <Button disabled={!importType} {...props}>
                        {mt('button_import')}
                    </Button>
                )}
            </FileButton>
        );
    }

    if (selectedUserFrom) {
        return (
            <>
                <Notification withCloseButton={false} mb="sm">
                    {mt('select_move_message_to')}
                </Notification>

                <SelectDialog
                    allowTypes={[EOwnerType.user]}
                    selfIgnore={true}
                    onOwnerSelect={(owner) => {
                        selectUserTo(owner as Api.User);
                    }}
                />
            </>
        );
    }

    if (fileUsers.length) {
        return (
            <>
                <Notification withCloseButton={false}>
                    {mt('select_move_message_from').replace('{network}', mt(`networks.${importType}`))}
                </Notification>

                <Input
                    leftSection={<IconSearch />}
                    mt="sm"
                    mb="sm"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    rightSectionPointerEvents="all"
                    rightSection={searchQuery && <CloseButton onClick={() => setSearchQuery('')} />}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                />

                {filterList(fileUsers).map((user, key) => (
                    <UnstyledButton key={key} className={classes.link} onClick={() => selectUserFrom(user)}>
                        <ExAvatar id={key} letters={user.name[0]} mr="xs" />
                        <span>{user.name}</span>
                    </UnstyledButton>
                ))}
            </>
        );
    }

    return (
        <>
            <Notification withCloseButton={false} color="yellow">
                {mt('read_warning')}
                <Button
                    variant="light"
                    size="xs"
                    mt="xs"
                    fullWidth
                    component="a"
                    href={getDocLink('methods/import_messages')}
                    target="_blank"
                >
                    {mt('read_warning_link')}
                </Button>
            </Notification>

            <Title order={4} mt="xs">
                {mt('networks.title')}
            </Title>

            <Stack mt="xs" gap="xs">
                {/* <RadioRow type={ImportType.VK} /> */}
                <RadioRow type={ImportType.Instagram} />
                <RadioRow type={ImportType.Facebook} />
            </Stack>

            <FixFileButton />
            {errorText && (
                <Text c="red" ta="center">
                    {errorText}
                </Text>
            )}
        </>
    );
};

export default ImportMessages;
