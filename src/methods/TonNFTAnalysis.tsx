import { IconArrowRight } from '@tabler/icons-react';
import { Blockquote, Caption, Image, Section } from '@telegram-apps/telegram-ui';
import { useTonConnectUI } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { TrustType } from 'tonapi-sdk-js';
import { WrappedCell } from '../components/Helpers.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { formatNumberFloat, Server } from '../lib/helpers.ts';
import { TonApiCall } from '../lib/TonApi.ts';

import commonClasses from '../styles/Common.module.css';

interface INft {
    name: string;
    image?: string;
    tonViewerUrl: string;
    collectionAddress: string;
    bought: {
        price: number;
        priceUsd: number;
        date: number;
    };
}

export default function TonNFTAnalysis() {
    const { mt, needHideContent, setProgress, setFinishBlock } = useContext(MethodContext);

    const [nftsList, setNftsList] = useState<INft[]>([]);
    const [floorCollections, setfloorCollections] = useState<Map<string, number>>(new Map());
    const [usdRate, setUsdRate] = useState<number>(0);

    const [wallet] = useTonConnectUI();
    const userWallet = wallet.account?.address as string;

    useEffect(() => {
        (async () => {
            setProgress({});

            const nfts = (await TonApiCall.getNfts(userWallet)).filter(
                (nft) => Boolean(nft.collection?.address) && nft.trust === TrustType.Whitelist
            );

            if (!nfts.length) {
                setFinishBlock({ state: 'error', text: mt('no_nfts') });
                return;
            }

            setProgress({ text: mt('loading_nft_info'), total: nfts.length });

            const nftCollections: string[] = [];
            const list: INft[] = [];

            for (const nft of nfts) {
                const history = await TonApiCall.getNftHistory(nft.address);
                const findTransferEvent = history.events.find((event) => {
                    return event.actions.find(
                        (action) =>
                            action.type === 'NftItemTransfer' &&
                            action.NftItemTransfer?.recipient?.address === userWallet
                    );
                });

                if (findTransferEvent) {
                    const event = await TonApiCall.getEvent(findTransferEvent.event_id);
                    const findAction = event.actions.find((action) => {
                        return action.type === 'NftPurchase' && action.NftPurchase?.buyer?.address === userWallet;
                    });

                    if (findAction) {
                        const image = nft.previews?.find((preview) => preview.resolution === '100x100')?.url;
                        const boughtPrice = findAction.NftPurchase?.amount
                            ? Number(findAction.NftPurchase.amount.value) / 1e9
                            : 0;
                        const tonViewerUrl = `https://tonviewer.com/${nft.address}?section=nft`;
                        const usdRateForDate = await TonApiCall.getRateForDate(findTransferEvent.timestamp);

                        list.push({
                            name: nft.metadata.name,
                            image,
                            tonViewerUrl,
                            collectionAddress: String(nft.collection?.address),
                            bought: {
                                price: boughtPrice,
                                priceUsd: boughtPrice * usdRateForDate,
                                date: findTransferEvent.timestamp
                            }
                        });

                        if (nft?.collection?.address && !nftCollections.includes(nft.collection.address)) {
                            nftCollections.push(nft.collection.address);
                        }
                    }
                }

                setProgress({ addCount: 1 });
            }

            if (!list.length) {
                setFinishBlock({ state: 'error', text: mt('no_nfts') });
                return;
            }

            setProgress({});

            setUsdRate(await TonApiCall.getRate());

            if (nftCollections.length) {
                const result = new Map<string, number>();
                const data = await Server<{ [key: string]: number }>('get-collections-floor', {
                    addresses: nftCollections
                });

                for (const address in data) {
                    result.set(address, data[address]);
                }

                setfloorCollections(result);
            }

            setNftsList(list);
            setProgress(null);
        })();
    }, []);

    if (needHideContent()) return null;

    if (nftsList.length) {
        return nftsList.map((nft, key) => {
            let collectionFloorPrice = null;
            const collectionFloor = floorCollections.get(nft.collectionAddress) || 0;

            if (collectionFloor && usdRate) {
                const color =
                    nft.bought.priceUsd && collectionFloor * usdRate > nft.bought.priceUsd
                        ? 'var(--tgui--green)'
                        : undefined;
                collectionFloorPrice = (
                    <span style={{ marginLeft: 5 }}>
                        (~ <span style={{ color }}>{formatNumberFloat(collectionFloor * usdRate)}</span> $)
                    </span>
                );
            }

            const amountNowColor =
                nft.bought.price * usdRate < nft.bought.priceUsd
                    ? 'var(--tgui--destructive_text_color)'
                    : 'var(--tgui--green)';

            return (
                <Section className={commonClasses.sectionBox} key={key}>
                    <WrappedCell
                        before={nft.image && <Image size={48} src={nft.image} />}
                        description={`${formatNumberFloat(nft.bought.price)} TON`}
                    >
                        {nft.name}
                    </WrappedCell>

                    <div
                        style={{
                            padding: '0 24px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            justifyContent: 'space-around'
                        }}
                    >
                        {nft.bought.priceUsd > 0 &&
                            Block(nft.bought.priceUsd, dayjs(nft.bought.date * 1000).format('LL'))}
                        {nft.bought.priceUsd > 0 && <IconArrowRight />}
                        {Block(nft.bought.price * usdRate, mt('now'), amountNowColor)}
                    </div>

                    {collectionFloor > 0 && (
                        <Blockquote
                            style={{
                                borderLeft: 0,
                                borderRadius: 0,
                                textAlign: 'center',
                                padding: 3,
                                paddingBottom: 5
                            }}
                            topRightIcon={null}
                        >
                            <Caption>
                                {mt('collection_floor_price').replace('{price}', formatNumberFloat(collectionFloor))}
                                {collectionFloorPrice}
                            </Caption>
                        </Blockquote>
                    )}
                </Section>
            );
        });
    }
}

function Block(amount: number, description: string, color?: string) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ color }}>~ {formatNumberFloat(amount)} $</div>
            <Caption style={{ color: 'var(--tgui--secondary_hint_color)' }}>{description}</Caption>
        </div>
    );
}
