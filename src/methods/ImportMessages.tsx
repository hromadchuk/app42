import { createElement, useContext, useEffect, useState } from 'react';
import { Avatar, Blockquote, FileInput, Input, Placeholder, Section } from '@telegram-apps/telegram-ui';
import { IconBrandFacebook, IconBrandInstagram, IconCheck, IconSearch } from '@tabler/icons-react';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import dayjs from 'dayjs';
import { Api } from 'telegram';
import { CustomFile } from 'telegram/client/uploads';
import { WrappedCell } from '../components/Helpers.tsx';
import { EOwnerType, SelectDialog } from '../components/SelectOwner.tsx';
import { CallAPI, getDocLink, parallelLimit } from '../lib/helpers.ts';

import { MethodContext } from '../contexts/MethodContext.tsx';

import commonClasses from '../styles/Common.module.css';

enum ImportType {
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
    [ImportType.Facebook]: IconBrandFacebook,
    [ImportType.Instagram]: IconBrandInstagram
};

export default function ImportMessages() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [importType, setImportType] = useState<ImportType | null>(null);
    const [fileUsers, setFileUsers] = useState<IFileUser[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [selectedUserFrom, setSelectedUserFrom] = useState<IFileUser | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (!file) {
            return;
        }

        readFile(file);
    }, [file]);

    async function readFile(uploadedFile: File) {
        setErrorText(null);

        const archive = await new JSZip().loadAsync(uploadedFile);
        const files = Object.keys(archive.files);

        const path = files.includes('messages.json') || files.find((filePath) => filePath.endsWith('messages/'));
        if (!path) {
            setErrorText(mt('errors.no_messages'));
            return;
        }

        const users = await getUsers(archive, files);

        if (!users.length) {
            setErrorText(mt('errors.no_users'));
            return;
        }

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

        return data;
    }

    async function selectUserTo(user: Api.User) {
        setSearchQuery('');
        setProgress({});

        const importData = await getImportData(selectedUserFrom as IFileUser);
        const testData = importData.rows.slice(0, 100).join('\n') + '\n';

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

        const bufferText = Buffer.from(importData.rows.join('\n') + '\n', 'utf-8');

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

            const uploads = new Map<string, Api.InputFile | Api.InputFileBig>();
            const uploadTasks: Function[] = [];

            for (const media of importData.media) {
                const mediaFile = archive.file(media.path) as IJSZipObject;

                uploadTasks.push(async () => {
                    const data = await uploadFile(
                        media.name,
                        mediaFile._data.compressedSize,
                        Buffer.from(mediaFile._data.compressedContent)
                    );

                    uploads.set(media.path, data);

                    setProgress({ addCount: 1 });
                });
            }

            await parallelLimit(10, uploadTasks);

            setProgress({ text: mt('save_media'), count: 0, total: importData.media.length });

            const saveTasks: Function[] = [];

            for (const media of importData.media) {
                saveTasks.push(async () => {
                    let tgMedia: Api.TypeInputMedia | undefined;

                    if (media.type === TImportMedia.PHOTO) {
                        tgMedia = new Api.InputMediaUploadedPhoto({
                            file: uploads.get(media.path) as Api.InputFile | Api.InputFileBig
                        });
                    }

                    await CallAPI(
                        new Api.messages.UploadImportedMedia({
                            peer: user,
                            importId: init.id,
                            fileName: media.name,
                            media: tgMedia
                        })
                    );

                    setProgress({ addCount: 1 });
                });
            }

            await parallelLimit(10, saveTasks);
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
            workers: 3
        });
    }

    if (needHideContent()) return null;

    function RadioRow({ type }: { type: ImportType }) {
        const icon = createElement(icons[type], { size: 14 });
        const isSelected = importType === type;

        return (
            <WrappedCell
                key={type}
                Component="label"
                // before={<Radio name="social" value={type} />}
                before={icon}
                after={isSelected && <IconCheck size={12} />}
                style={{ borderLeft: isSelected ? '3px solid var(--tgui--link_color)' : 'none' }}
                onClick={() => setImportType(type)}
            >
                {mt(`networks.${type}`)}
            </WrappedCell>
        );
    }

    function FixFileButton() {
        return (
            <FileInput
                multiple
                label={mt('button_import')}
                disabled={!importType}
                onChange={(e) => {
                    // @ts-ignore
                    setFile(e.currentTarget.files[0]);
                }}
                accept=".zip"
            />
        );
    }

    if (selectedUserFrom) {
        return (
            <>
                <Section className={commonClasses.sectionBox}>
                    <Blockquote>{mt('select_move_message_to')}</Blockquote>
                </Section>

                <Section className={commonClasses.sectionBox}>
                    <SelectDialog
                        allowTypes={[EOwnerType.user]}
                        selfIgnore={true}
                        onOwnerSelect={(owner) => {
                            selectUserTo(owner as Api.User);
                        }}
                    />
                </Section>
            </>
        );
    }

    if (fileUsers.length) {
        return (
            <>
                <Section className={commonClasses.sectionBox}>
                    <Blockquote>
                        {mt('select_move_message_from').replace('{network}', mt(`networks.${importType}`))}
                    </Blockquote>
                </Section>

                <Section className={commonClasses.sectionBox}>
                    <div className={commonClasses.fixSearchBackground}>
                        <Input
                            before={<IconSearch opacity={0.3} />}
                            placeholder={mt('search_placeholder')}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.currentTarget.value)}
                        />
                    </div>

                    {filterList(fileUsers).map((user, key) => (
                        <WrappedCell
                            key={key}
                            onClick={() => selectUserFrom(user)}
                            before={<Avatar acronym={user.name[0]} size={28} src={''} />}
                        >
                            {user.name}
                        </WrappedCell>
                    ))}
                </Section>
            </>
        );
    }

    return (
        <>
            <Section className={commonClasses.sectionBox}>
                <Blockquote>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: mt('read_warning')
                                .replace(
                                    '{link}',
                                    `<a href="${getDocLink('methods/import_messages')}" target="_blank">`
                                )
                                .replace('{/link}', '</a>')
                        }}
                    ></div>
                </Blockquote>
            </Section>

            <Section className={commonClasses.sectionBox} header={mt('networks.title')}>
                {[ImportType.Instagram, ImportType.Facebook].map((type) => (
                    <RadioRow key={type} type={type} />
                ))}

                <FixFileButton />

                {errorText && <Placeholder description={errorText} />}
            </Section>
        </>
    );
}
