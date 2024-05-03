import { useContext, useEffect, useState } from 'react';
import { IconEye, IconHeart, IconMapPin, IconPhoto, IconThumbUp, IconVideo } from '@tabler/icons-react';
import { Api } from 'telegram';
import { ActivityChart } from '../components/charts/Activity.tsx';
import { CalculateActivityTime } from '../components/charts/chart_helpers.ts';
import { InfoRow } from '../components/InfoRow.tsx';
import { ITabItem, TabsList } from '../components/TabsList.tsx';

import { MethodContext } from '../contexts/MethodContext.tsx';
import { CallAPI } from '../lib/helpers.ts';
import { StoriesCarousel } from '../components/StoriesCarousel.tsx';
import { ReactionsList } from '../components/ReactionsList.tsx';

enum ETabId {
    views = 'views',
    reactions = 'reactions'
}

export interface IStoryStat {
    views: number;
    reactions: number;
}

export interface IStoryTop {
    story: Api.StoryItem;
    count: number;
}

type TReactionMap = Map<string, number>;

type TStoriesReactions = Map<number, TReactionMap>;

type TStoriesStat = Map<number, IStoryStat>;

interface IGetStoriesReactionsResult {
    total: TReactionMap;
    stories: TStoriesReactions;
}

interface IStatResult {
    activity: number[][];
    reactions?: IGetStoriesReactionsResult;
    counts: {
        views: number;
        reactions: number;
        videos: number;
        photos: number;
        geoMediaAreas: number;
        reactionMediaAreas: number;
    };
    tops: {
        [key: string]: IStoryTop[];
        views: IStoryTop[];
        reactions: IStoryTop[];
    };
}

export default function CallsStat() {
    const { mt, needHideContent, setFinishBlock, setProgress } = useContext(MethodContext);

    const [stat, setStat] = useState<IStatResult | null>(null);
    const [selectedTab, setSelectedTab] = useState<ETabId>(ETabId.views);

    useEffect(() => {
        (async () => {
            setProgress({ text: mt('get_stories_list') });

            const storiesByIds = new Map<number, Api.StoryItem>();
            const storiesStat = new Map<number, IStoryStat>() as TStoriesStat;
            const storiesPeer = new Api.InputPeerSelf();
            const stories = await getValidStories(storiesPeer);

            if (!stories.length) {
                setFinishBlock({ text: mt('no_stories'), state: 'error' });
                setProgress(null);
                return;
            }

            const storyActionByCreationDate = new CalculateActivityTime();
            const storiesWithReactions: number[] = [];

            stories.forEach((story) => {
                const storyId = story.id.valueOf();
                storiesByIds.set(storyId, story);

                storyActionByCreationDate.add(0, story.date);

                const storiesReactionsCount = story.views?.reactionsCount || 0;
                if (storiesReactionsCount > 0) {
                    storiesWithReactions.push(story.id);
                }

                storiesStat.set(storyId, {
                    views: story.views?.viewsCount || 0,
                    reactions: storiesReactionsCount
                });
            });

            let storiesReactions: IGetStoriesReactionsResult | undefined;
            if (storiesWithReactions.length > 0) {
                setProgress({ text: mt('get_stories_reactions'), count: 0, total: storiesWithReactions.length });
                storiesReactions = await getStoriesReactions(storiesPeer, storiesWithReactions);
            }

            // totals
            const totalViews = Array.from(storiesStat.values()).reduce((res, story) => res + story.views, 0);
            const totalReactions = Array.from(storiesStat.values()).reduce((res, story) => res + story.reactions, 0);
            const totalPhotos = stories.reduce(
                (res, story) => (story.media instanceof Api.MessageMediaPhoto ? res + 1 : res),
                0
            );
            const totalVideos = stories.length - totalPhotos;

            // Media areas
            const storiesMediaAreas = stories.flatMap((story) => story.mediaAreas);
            const totalGeoMediaAreas = storiesMediaAreas.reduce(
                (res, mediaArea) =>
                    mediaArea instanceof Api.MediaAreaGeoPoint ||
                    mediaArea instanceof Api.MediaAreaVenue ||
                    mediaArea instanceof Api.InputMediaAreaVenue
                        ? res + 1
                        : res,
                0
            );
            const totalReactionMediaAreas = storiesMediaAreas.reduce(
                (res, mediaArea) => (mediaArea instanceof Api.MediaAreaSuggestedReaction ? res + 1 : res),
                0
            );

            // tops
            const getTopStory = (storiesStats: TStoriesStat, statKey: keyof IStoryStat): IStoryTop[] => {
                return Array.from(storiesStats.entries())
                    .sort((a, b) => b[1][statKey] - a[1][statKey])
                    .map(
                        ([storyId, story]) =>
                            ({
                                story: storiesByIds.get(storyId) as Api.StoryItem,
                                count: story[statKey]
                            }) as IStoryTop
                    );
            };

            const topByViews = getTopStory(storiesStat, 'views');
            const topByReactions = getTopStory(storiesStat, 'reactions');

            const result: IStatResult = {
                activity: storyActionByCreationDate.get(0),
                reactions: storiesReactions,
                counts: {
                    views: totalViews,
                    reactions: totalReactions,
                    photos: totalPhotos,
                    videos: totalVideos,
                    geoMediaAreas: totalGeoMediaAreas,
                    reactionMediaAreas: totalReactionMediaAreas
                },
                tops: {
                    views: topByViews,
                    reactions: topByReactions
                }
            };

            if (storiesReactions) {
                Array.from(storiesReactions?.total.keys() || []).forEach((emoji) => {
                    result.tops[emoji] = Array.from(storiesReactions?.stories.entries() || [])
                        .map(
                            (storyReactions) =>
                                ({
                                    story: storiesByIds.get(storyReactions[0]),
                                    count: storyReactions[1].get(emoji) || 0
                                }) as IStoryTop
                        )
                        .filter((reaction) => reaction.count !== 0)
                        .sort((a, b) => b.count - a.count);
                });
            }
            // result.tops[]

            setStat(result);
            setProgress(null);
        })();
    }, []);

    async function getValidStories(peer: Api.TypeEntityLike): Promise<Api.StoryItem[]> {
        const stories: Api.TypeStoryItem[] = await getArchivedStories(peer);

        stories.filter((story) => !(story instanceof Api.StoryItemDeleted));

        const invalidStoriesIds: number[] = [];
        const validStories: Api.StoryItem[] = [];
        for (const story of stories) {
            if (story instanceof Api.StoryItemDeleted) {
                continue;
            }

            if (story instanceof Api.StoryItemSkipped) {
                invalidStoriesIds.push(story.id.valueOf());

                continue;
            }

            validStories.push(story);
        }

        if (invalidStoriesIds.length > 0) {
            validStories.push(
                ...((
                    await CallAPI(
                        new Api.stories.GetStoriesByID({
                            peer,
                            id: invalidStoriesIds
                        })
                    )
                ).stories as Api.StoryItem[])
            );
        }

        return validStories;
    }

    async function getArchivedStories(peer: Api.TypeEntityLike, offsetId = 0): Promise<Api.TypeStoryItem[]> {
        const stories: Api.TypeStoryItem[] = (
            await CallAPI(
                new Api.stories.GetStoriesArchive({
                    peer,
                    offsetId
                })
            )
        ).stories;

        const storiesCount = stories.length;
        const lastStory: Api.TypeStoryItem = stories[storiesCount - 1];
        if (storiesCount > 0 && lastStory.id.valueOf() !== 1) {
            stories.push(...(await getArchivedStories(peer, lastStory.id.valueOf())));
        }

        return stories;
    }

    async function getStoriesReactions(
        peer: Api.TypeEntityLike,
        storiesIds: number[]
    ): Promise<IGetStoriesReactionsResult> {
        // map(storyId => map(reactionEmoticon => reactionsCount, ...))
        const totalStoriesReactions = new Map<string, number>() as TReactionMap;
        const storiesReactions = new Map<number, TReactionMap>() as TStoriesReactions;

        for (const storyId of storiesIds) {
            setProgress({ addCount: 1 });
            let nextOffset = '';
            const storyReactions = new Map<string, number>() as TReactionMap;
            do {
                const storyViewsList = await getStoryViewsList(peer, storyId, nextOffset);
                nextOffset = storyViewsList.nextOffset || '';

                for (const viewer of storyViewsList.views) {
                    if (!(viewer instanceof Api.StoryView)) {
                        continue;
                    }

                    const reaction = viewer.reaction;

                    if (!reaction) {
                        break;
                    }

                    if (reaction instanceof Api.ReactionEmoji) {
                        const reactionEmoji = reaction.emoticon;
                        storyReactions.set(reactionEmoji, (storyReactions.get(reactionEmoji) || 0) + 1);
                        totalStoriesReactions.set(reactionEmoji, (totalStoriesReactions.get(reactionEmoji) || 0) + 1);
                    }
                }
            } while (nextOffset);

            if (storyReactions.size > 0) {
                storiesReactions.set(storyId, storyReactions);
            }
        }

        return {
            total: totalStoriesReactions,
            stories: storiesReactions
        } as unknown as IGetStoriesReactionsResult;
    }

    async function getStoryViewsList(peer: Api.TypeEntityLike, storyId: number, offset: string) {
        return await CallAPI(
            new Api.stories.GetStoryViewsList({
                peer,
                id: storyId,
                limit: 0,
                offset,
                reactionsFirst: true
            })
        );
    }

    function TopStoriesContent() {
        if (!stat) return null;

        const topStories = stat.tops[selectedTab];

        return <StoriesCarousel storiesStats={topStories} />;
    }

    if (needHideContent()) return null;

    if (stat) {
        const tabsList: ITabItem[] = [
            {
                id: ETabId.views,
                name: mt('tops.views'),
                icon: IconEye
            },
            {
                id: ETabId.reactions,
                name: mt('tops.reaction'),
                icon: IconThumbUp
            }
        ];

        const emojiTabs: ITabItem[] = [];
        emojiTabs.push(
            ...Array.from(stat.reactions?.total.keys() || []).map((emoji) => ({
                id: emoji,
                name: emoji
            }))
        );

        tabsList.push(...emojiTabs);

        return (
            <>
                <InfoRow title={mt('counts.photos')} count={stat.counts.photos} icon={IconPhoto} />
                <InfoRow title={mt('counts.videos')} count={stat.counts.videos} icon={IconVideo} />
                <InfoRow title={mt('counts.views')} count={stat.counts.views} icon={IconEye} />
                <InfoRow title={mt('counts.reactions')} count={stat.counts.reactions} icon={IconHeart} />
                <InfoRow title={mt('counts.geo_media_areas')} count={stat.counts.geoMediaAreas} icon={IconMapPin} />
                <InfoRow
                    title={mt('counts.reaction_media_areas')}
                    count={stat.counts.reactionMediaAreas}
                    icon={IconThumbUp}
                />
                <ReactionsList reactions={stat.reactions?.total} />
                <ActivityChart data={stat.activity} />

                <TabsList tabs={tabsList} onChange={(tabId) => setSelectedTab(tabId as ETabId)} />
                <TopStoriesContent />
            </>
        );
    }

    return null;
};
