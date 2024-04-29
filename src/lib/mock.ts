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

    if (method === 'get-my-names') {
        return {
            names: [
                {
                    name: 'Paulo',
                    count: 3
                },
                {
                    name: 'Cool dev',
                    count: 1
                }
            ]
        } as T;
    }

    if (method === 'sync-contacts-names') {
        return { status: 'ok' } as T;
    }

    if (method === 'get-wallets') {
        return {
            usernames: [
                {
                    ownerWallet: 'UQDYzZmfsrGzhObKJUw4gzdeIxEai3jAFbiGKGwxvxHinf4K',
                    username: 'pavel'
                },
                {
                    ownerWallet: 'UQDYzZmfsrGzhObKJUw4gzdeIxEai3jAFbiGKGwxvxHinf4K',
                    username: 'paul'
                },
                {
                    ownerWallet: 'UQDYzZmfsrGzhObKJUw4gzdeIxEai3jAFbiGKGwxvxHinf4K',
                    username: 'paulo'
                }
            ],
            numbers: [
                {
                    ownerWallet: 'UQDYzZmfsrGzhObKJUw4gzdeIxEai3jAFbiGKGwxvxHinf4K',
                    number: 88802375914
                }
            ]
        } as T;
    }

    return {} as T;
}
