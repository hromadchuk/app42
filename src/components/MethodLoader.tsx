import { Blockquote, Caption, Progress, Spinner } from '@telegram-apps/telegram-ui';
import Lottie from 'lottie-react';
import { IProgress } from '../contexts/MethodContext.tsx';
import { formatNumber } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

import AnimatedDuckCountDucks from '../assets/animated_stickers/duck_count_ducks.json';
import AnimatedDuckSearchFolders from '../assets/animated_stickers/duck_search_folders.json';

import classes from '../styles/MethodLoader.module.css';

enum ELoadType {
    SPINNER = 'spinner',
    COUNT = 'count'
}

export function MethodLoader(progress: IProgress) {
    if (!progress) {
        return null;
    }

    function getImageType() {
        if (progress.count === undefined && progress.total === undefined) {
            return ELoadType.SPINNER;
        }

        return ELoadType.COUNT;
    }

    function LoadingRow() {
        let percent = 100;
        const counts: number[] = [];
        const state = { ...progress };

        if (state.count !== undefined) {
            counts.push(state.count);
        }

        if (state.total !== undefined) {
            if (state.count === undefined) {
                state.count = 0;
                counts.push(state.count);
            }

            counts.push(state.total);
            percent = Math.floor((state.count / state.total) * 100);
        }

        return (
            <>
                {progress.warningText && <Blockquote type="text">{progress.warningText}</Blockquote>}
                <Progress value={percent} />
                <Caption level="1" weight="3">
                    {progress.text || t('common.progress')}
                    {counts.length > 0 && ` (${counts.map(formatNumber).join(' / ')})`}
                </Caption>
            </>
        );
    }

    function SpinnerRow() {
        return (
            <>
                <Spinner size="m" />

                {progress.text && (
                    <Caption level="1" weight="3">
                        {progress.text}
                    </Caption>
                )}
            </>
        );
    }

    return (
        <>
            <div className={classes.animationSection}>
                <Lottie
                    animationData={
                        getImageType() === ELoadType.COUNT ? AnimatedDuckCountDucks : AnimatedDuckSearchFolders
                    }
                    loop
                />
            </div>

            <div className={classes.progressSection}>
                {getImageType() === ELoadType.COUNT ? LoadingRow() : SpinnerRow()}
            </div>
        </>
    );
}
