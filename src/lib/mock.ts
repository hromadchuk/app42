import { ServerMethods, ServerResponses } from '../interfaces/server.ts';

export function ServerMock<METHOD extends ServerMethods>(method: string): ServerResponses[METHOD] {
    /**
     * The method to initialize the application. Getting popular methods and hashes for authorization.
     *
     * @used
     * - src/MiniAppWrapper.tsx
     *
     * @returns
     * - status: `ok` if the method was successful.
     * - topMethods: An array of popular methods.
     * - storageHash: A hash for authorization.
     * - walletHash: A hash for TON authorization.
     */
    if (method === 'init') {
        return {
            status: 'ok',
            topMethods: ['messages_stat', 'contacts_analysis', 'animated_messages', 'common_chats_top', 'administered'],
            storageHash: 'localTestStorageHash',
            walletHash: '588fdc4d275259e20000000066952006963a5d5142b7b654176c7bac056ae10a'
        } as ServerResponses[METHOD];
    }

    /**
     * The method returns how you are saved in other people's contacts.
     *
     * @used
     * - src/lib/logic_helpers.ts
     */
    if (method === 'get_my_names') {
        return {
            date: Number(new Date()),
            names: [
                {
                    name: 'Paulo',
                    count: 3
                },
                {
                    name: 'App 42 dev',
                    count: 1
                }
            ]
        } as ServerResponses[METHOD];
    }

    /**
     * The method returns wallet addresses by anonymous numbers and purchased addresses.
     *
     * @used
     * - src/methods/TonContactsWithNFT.tsx
     */
    if (method === 'get_wallets') {
        return {
            usernames: [
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'pavel'
                },
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'myth'
                },
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    username: 'nerd'
                }
            ],
            numbers: [
                {
                    ownerWallet: '0:d8cd999fb2b1b384e6ca254c3883375e23111a8b78c015b886286c31bf11e29d',
                    number: 88802375914
                }
            ]
        } as ServerResponses[METHOD];
    }

    /**
     * The method returns the minimum costs of the NFTs in the collections.
     *
     * @used
     * - src/methods/TonNFTAnalysis.tsx
     */
    if (method === 'get_collections_floor') {
        return {
            '0:06d811f426598591b32b2c49f29f66c821368e4acb1de16762b04e0174532465': 27,
            '0:0e41dc1dc3c9067ed24248580e12b3359818d83dee0304fabcf80845eafafdb2': 113,
            '0:0eb87b4e4cf47246aac941580e6c09c634aa1a493f56d6c28d6e86f9430fbf34': 13.3,
            '0:339555309d02814897b2c8ffbbdf75e9e38b6764383f6ff77332a6443becf9f3': 42.5,
            '0:f71e8ffd2a8aa34a63737caa2b72d2ef4d569b9fd53f06a9e320fab5ed294bb3': 9,
            '0:f740d46156d4568071cfdd1238fc87de2aa65b3254626865d340620e9a5ffc08': 14.9,
            '0:fb783c4fff02d7d7c92bf2ec987eceacae582834c7d16d735833c7663174f6bf': 179
        } as unknown as ServerResponses[METHOD];
    }

    return { status: 'ok' } as ServerResponses[METHOD];
}
