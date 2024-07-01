export function ServerMock<T>(method: string) {
    if (method === 'init') {
        return {
            status: 'ok',
            topMethods: ['messages_stat', 'contacts_analysis', 'animated_messages', 'common_chats_top', 'administered'],
            storageHash: 'localTestStorageHash',
            showEruda: false,
            isPremium: false
        } as T;
    }

    if (method === 'is-premium') {
        return {
            status: 'ok',
            isPremium: false
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
        } as T;
    }

    if (method === 'get-collections-floor') {
        return {
            '0:01e069094cc193299a56fc235a5f05c084aecdd8a2557a8ee911f33d00b4a048': 0.09,
            '0:06d811f426598591b32b2c49f29f66c821368e4acb1de16762b04e0174532465': 27,
            '0:0d6e87c34b3ef72f9772a3f61f38788f618773b1cfe57a2a50bad997cd0ef9a8': 0.59,
            '0:0e41dc1dc3c9067ed24248580e12b3359818d83dee0304fabcf80845eafafdb2': 113,
            '0:0eb87b4e4cf47246aac941580e6c09c634aa1a493f56d6c28d6e86f9430fbf34': 13.3,
            '0:10403e0b8ca5fbbcebadf556439f00dd5d9547e1d089f6cfbf72ace72d3f5d0a': 0.199,
            '0:1967f9355f19268db0f3c0aea4ffaf9e834ab0381428181c14e5ff3be632264a': 2.999,
            '0:24ebab83065f8cdae69d248e3d9461723f5155a38011cbed91e79fcec11c6174': 0.33,
            '0:25fe150201e12ff9f2ad1b162d213012e8f3f1b8c45a4301e3d100077967ba65': 1.95,
            '0:2ee5a2a0948d857d5b055c26d997a48baf09388baac4a94db3987c2fa1a1c117': 24.8,
            '0:339555309d02814897b2c8ffbbdf75e9e38b6764383f6ff77332a6443becf9f3': 42.5,
            '0:4e3f653d99080fa6e54dc0bd911b8c86f8d92bf7e626f6230b63e2f7c357403d': 0.09,
            '0:4f56c8efc1a2e7046bb0bd330387ef84d130e9787e56cd42ed3099976785d122': 98.9,
            '0:56835abd2dee31e3f7f3ac9eba2e6c3be700a8c278b5e9ebb52fdc986ef99546': 0.33,
            '0:7001347fa0ac63ee2de2ffc5a492a28943722b74ee25c34b5220b3d5fd30edeb': 5,
            '0:7c0fc03d3a80e84662fba956d406b77fa68f6f34a725e381c24b0e9bf9cde7bd': 50,
            '0:7fe73919d9d7e613d9ceea6672f99e10908fe634fdbb0de845c145ab650948c6': 1.5,
            '0:80595ecb9c370cbefc5b38d9416f95e966ce7f6a56b8322799a890db95533344': 0.38,
            '0:80d78a35f955a14b679faa887ff4cd5bfc0f43b4a4eea2a7e6927f3701b273c2': 4.6,
            '0:82aaddd0778ee241e576637f17d1da83e85aa1cac4d7b47d5b075d6a089cb218': 40,
            '0:8907c2c75d102675c79cb9f3dbcef38c8f60bde615afb52284e62883b37faa53': 7.8,
            '0:8914101541a6e58731cbdde241c061e5234edbbdd1258100e93161d9ecf9dd61': 0.688,
            '0:8e147f4919242df1a4f1563281d2138db34b2bf901e8b5c1fa77701573bad051': 0.88,
            '0:8f5ca3b280c0c8b9623abe7481b78f7c3f01c0c1a6ad839c8b602ed38adc4b2d': 0.35,
            '0:aa2c01bca43907495e85027a00704e347c610ea4a7510250e8c85f21a4ec1179': 18.88,
            '0:abadbf0c1854f5f26ba7ccce85a2551384b6fdda26341a5e92736bccc3dd8601': 3,
            '0:b4a42930b24a9d3e5b3d42a2f8032ad9e357dad58d71d0686c59abc45b80e072': 39.8,
            '0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf': 0.94,
            '0:c58920d4f3b4c4bd8ebbcaac747532d0fb11ca6eb47ce1d61fad85d66b9156b4': 0.268,
            '0:c5bd1fc3a8b5669edf804541ccd6a4f87c05de644d8830dd9bf954f7d5d96650': 2.49,
            '0:d82b0475651b91fb9ca847aa91fc25471224e6bbae89a688cacbf7b4c233506f': 18.5,
            '0:df6f9780a28ea54b229d1edc1e63b0f4b17693f7d2b68a0823c97a41485558fb': 0.08,
            '0:e1955aba7249f23e4fd2086654a176516d98b134e0df701302677c037c358b17': 0.31,
            '0:e26b5758e46e7f2782c36aa5bdc4fc8bc364f7b36e72e94d56d674a4437051cc': 20.9,
            '0:e3761d93694255fe52cc3264364cfb01f5acdf3194d19cb6fee116fbfaee5eb6': 255,
            '0:f25992284d7b8451a33a44eb672acd259ad909556120d6f5cc8a69bf03fadd30': 5.9,
            '0:f6184855aa6061ef37d57fc20cc87c8453a0bcfd1f46cd710e40f2489b06b3f4': 0.38,
            '0:f71e8ffd2a8aa34a63737caa2b72d2ef4d569b9fd53f06a9e320fab5ed294bb3': 9,
            '0:f740d46156d4568071cfdd1238fc87de2aa65b3254626865d340620e9a5ffc08': 14.9,
            '0:fb783c4fff02d7d7c92bf2ec987eceacae582834c7d16d735833c7663174f6bf': 179
        } as T;
    }

    if (method === 'get-invoice') {
        return {
            link: 'https://t.me/$rGgxuJxG0UsKAAAAdqFEuQL8Oi4',
            status: 'ok'
        } as T;
    }

    return {} as T;
}
