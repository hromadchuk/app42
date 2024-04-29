import { useEffect, useState } from 'react';
import { Action, NftItem } from 'tonapi-sdk-js';
import { TonApiCall } from './src/lib/TonApi.ts';

const wallet = {
    device: {
        platform: 'iphone',
        appName: 'Tonkeeper',
        appVersion: '4.1.2',
        maxProtocolVersion: 2,
        features: [
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4
            }
        ]
    },
    provider: 'http',
    account: {
        address: '0:48a045e928af0afa3882bbe3888c6e72de4caef28bf3b98ab6224d16907d6af2',
        chain: '-239',
        walletStateInit: '...',
        publicKey: '8b908a8ebe9840e12859c7d76592778f5a6cbc64b46766be1a033e248d3bf939'
    },
    name: 'Tonkeeper',
    appName: 'tonkeeper',
    imageUrl: 'https://tonkeeper.com/assets/tonconnect-icon.png',
    aboutUrl: 'https://tonkeeper.com',
    tondns: 'tonkeeper.ton',
    platforms: ['ios', 'android', 'chrome', 'firefox', 'macos'],
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    universalLink: 'https://app.tonkeeper.com/ton-connect',
    deepLink: 'tonkeeper-tc://',
    jsBridgeKey: 'tonkeeper',
    injected: false,
    embedded: false,
    isPreferred: true,
    openMethod: 'qrcode'
};

const TEST_WALLET = '0:311db0071f5b75d371a5384a712c024d47ec992de1ed688d4dc490c328f72cff';
const TEST_COLLECTION = '0:e3761d93694255fe52cc3264364cfb01f5acdf3194d19cb6fee116fbfaee5eb6';

export default function TestTon() {
    const [nftsList, setNftsList] = useState<NftItem[]>([]);
    const [actionsList, setActionsList] = useState<Map<string, Action>>(new Map([]));

    // 0:dabcdf9103a4b608a941f3dd0833fd334c938270b24bfa940830e87d2210e08e
    //
    // {
    //   "type": "NftPurchase",
    //   "status": "ok",
    //   "NftPurchase": {
    //     "auction_type": "getgems",
    //     "amount": {
    //       "value": "400000000000",
    //       "token_name": "TON"
    //     },
    //     "nft": {
    //       "address": "0:dabcdf9103a4b608a941f3dd0833fd334c938270b24bfa940830e87d2210e08e",
    //       "index": 24,
    //       "owner": {
    //         "address": "0:48a045e928af0afa3882bbe3888c6e72de4caef28bf3b98ab6224d16907d6af2",
    //         "name": "paulo.ton",
    //         "is_scam": false,
    //         "is_wallet": true
    //       },
    //       "collection": {
    //         "address": "0:e3761d93694255fe52cc3264364cfb01f5acdf3194d19cb6fee116fbfaee5eb6",
    //         "name": "Annihilation — Mirage",
    //         "description": "“Annihilation — Mirage” is a graceful subseries to the original project. While the initial stones were home to nature's souls, the new ones carry the enchanting whispers of desert souls."
    //       },
    //       "verified": true,
    //       "metadata": {
    //         "image": "https://nft.ton.diamonds/annihilation-mirage/nft/66/66.jpg",
    //         "attributes": [
    //           {
    //             "trait_type": "Evolution",
    //             "value": "Rare"
    //           }
    //         ],
    //         "description": "This talisman embodies the beauty within and the essence of time. It serves as a reminder that true beauty resonates from the depths of one's soul, transcending the physical realm. Simultaneously, it acknowledges the importance of time—encouraging mindfulness and the appreciation of each fleeting moment. This artifact inspires its bearer to embrace their inner elegance while navigating the temporal journey with grace and awareness, illuminating the path to self-discovery and the cultivation of lasting beauty that time cannot erode.",
    //         "id": 66,
    //         "name": "Genshōhikari"
    //       },
    //       "previews": [
    //         {
    //           "resolution": "5x5",
    //           "url": "https://cache.tonapi.io/imgproxy/BKSPHNIsdj0RziSB9QAWT9QO8D7se3cZTNpm_4tFO98/rs:fill:5:5:1/g:no/aHR0cHM6Ly9uZnQudG9uLmRpYW1vbmRzL2FubmloaWxhdGlvbi1taXJhZ2UvbmZ0LzY2LzY2LmpwZw.webp"
    //         },
    //         {
    //           "resolution": "100x100",
    //           "url": "https://cache.tonapi.io/imgproxy/ZWSvTxjXKY0lzR4CZFOACY6dUTGWr_RTQEsa841hbYA/rs:fill:100:100:1/g:no/aHR0cHM6Ly9uZnQudG9uLmRpYW1vbmRzL2FubmloaWxhdGlvbi1taXJhZ2UvbmZ0LzY2LzY2LmpwZw.webp"
    //         },
    //         {
    //           "resolution": "500x500",
    //           "url": "https://cache.tonapi.io/imgproxy/S2XZ7Qmd_DOzzVz80-gPiyx6Ft_vFmPPOeBJrSsxbFk/rs:fill:500:500:1/g:no/aHR0cHM6Ly9uZnQudG9uLmRpYW1vbmRzL2FubmloaWxhdGlvbi1taXJhZ2UvbmZ0LzY2LzY2LmpwZw.webp"
    //         },
    //         {
    //           "resolution": "1500x1500",
    //           "url": "https://cache.tonapi.io/imgproxy/zbzcUTE0TyBT16JLgqZ1-19Qo_pAKcPYG41k8zZt-tU/rs:fill:1500:1500:1/g:no/aHR0cHM6Ly9uZnQudG9uLmRpYW1vbmRzL2FubmloaWxhdGlvbi1taXJhZ2UvbmZ0LzY2LzY2LmpwZw.webp"
    //         }
    //       ],
    //       "approved_by": [
    //         "getgems"
    //       ]
    //     },
    //     "seller": {
    //       "address": "0:4e4ddcf8a346a61b046994cb2c035c133305bed6e3725c1dac506ae80e1e916f",
    //       "name": "toncoin-scam.ton",
    //       "is_scam": false,
    //       "is_wallet": true
    //     },
    //     "buyer": {
    //       "address": "0:48a045e928af0afa3882bbe3888c6e72de4caef28bf3b98ab6224d16907d6af2",
    //       "name": "paulo.ton",
    //       "is_scam": false,
    //       "is_wallet": true
    //     }
    //   },
    //   "simple_preview": {
    //     "name": "NFT Purchase",
    //     "description": "Purchase Genshōhikari",
    //     "value": "400 TON",
    //     "value_image": "https://cache.tonapi.io/imgproxy/BKSPHNIsdj0RziSB9QAWT9QO8D7se3cZTNpm_4tFO98/rs:fill:5:5:1/g:no/aHR0cHM6Ly9uZnQudG9uLmRpYW1vbmRzL2FubmloaWxhdGlvbi1taXJhZ2UvbmZ0LzY2LzY2LmpwZw.webp",
    //     "accounts": [
    //       {
    //         "address": "0:dabcdf9103a4b608a941f3dd0833fd334c938270b24bfa940830e87d2210e08e",
    //         "is_scam": false,
    //         "is_wallet": false
    //       }
    //     ]
    //   }
    // }

    useEffect(() => {
        (async () => {
            const events = await TonApiCall.getEvents(wallet.account.address);
            console.log('events', events);

            const allCollections = new Set<string>();
            const groupedEvents = events.reduce((result, event) => {
                event.actions.forEach((action) => {
                    if (action.type !== 'NftPurchase') {
                        return;
                    }

                    const nft = String(action.NftPurchase?.nft.address);
                    if (!nft) {
                        return;
                    }

                    const nftAction = result.get(nft);
                    if (!nftAction) {
                        result.set(nft, action);

                        if (action.NftPurchase?.nft.collection?.address) {
                            allCollections.add(action.NftPurchase.nft.collection.address);
                        }
                    }
                });

                return result;
            }, new Map<string, Action>());
            console.log('groupedEvents', groupedEvents);
            setActionsList(groupedEvents);

            console.log('allCollections', allCollections);
            const collections = Array.from(allCollections);
            for (const collection of collections) {
                const floor = await TonApiCall.getCollectionFloor(collection);
                console.log('floor', floor);
            }

            // const nfts = await TonApiCall.getNfts(wallet.account.address);
            // console.log('nfts', nfts);
            // setNftsList(nfts);

            // const floor = await TonApiCall.getCollectionFloor(TEST_COLLECTION);
            // console.log('floor', floor);
        })();
    }, []);

    function NftRow(nft, key) {
        const image = nft.previews?.find((preview) => preview.resolution === '100x100')?.url;
        const action = actionsList.get(nft.address) || {};

        // return (
        //     <Table.Tr key={key}>
        //         <Table.Td>
        //             <Group gap="sm">
        //                 <Avatar size={40} src={image} radius="sm" />
        //                 <div>
        //                     <Text fz="sm" fw={500}>
        //                         {nft.metadata.name}
        //                     </Text>
        //                     {/* <Text fz="xs" c="dimmed"> */}
        //                     {/*     {'item.email'} */}
        //                     {/* </Text> */}
        //                     <pre style={{ fontSize: 8 }}>{JSON.stringify(actions, null, 2)}</pre>
        //                 </div>
        //             </Group>
        //         </Table.Td>
        //     </Table.Tr>
        // );

        return (
            <div key={key}>
                <div>
                    <img src={image} alt={key} style={{ width: 15 }} />
                    <p style={{ fontSize: 8, display: 'inline' }}>{nft.metadata.name}</p>
                    <p style={{ fontSize: 6 }}>{nft.address}</p>
                </div>
                <div>
                    <pre style={{ fontSize: 4 }}>{JSON.stringify(action, null, 2)}</pre>
                </div>
            </div>
        );
    }

    if (nftsList.length) {
        return nftsList.map(NftRow);
    }

    return <div>test</div>;
}
