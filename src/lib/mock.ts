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
            date: Number(new Date()),
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

    if (method === 'get-wallets') {
        return {
            usernames: [
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'pavel'
                },
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'paul'
                },
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'paulo'
                }
            ],
            numbers: [
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    number: 88802375914
                }
            ]
        } as T;
    }

    return {} as T;
}
