export function ServerMock<T>(method: string) {
    if (method === 'init') {
        return {
            status: 'ok',
            topMethods: ['messages_stat', 'contacts_analysis', 'animated_messages', 'common_chats_top', 'administered'],
            storageHash: 'localTestStorageHash',
            showEruda: false
        } as T;
    }

    if (method === 'method') {
        return { status: 'ok' } as T;
    }

    return {} as T;
}
