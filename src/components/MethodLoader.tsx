import { Blockquote, Caption, Progress, Spinner } from '@telegram-apps/telegram-ui';
import Lottie from 'lottie-react';
import { IProgress } from '../contexts/MethodContext.tsx';
import { formatNumber } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

import AnimatedDuckCountDucks from '../assets/animated_stickers/duck_count_ducks.json';
import AnimatedDuckSearchFolders from '../assets/animated_stickers/duck_search_folders.json';
import AnimatedDuckClean from '../assets/animated_stickers/duck_clean.json';

import classes from '../styles/MethodLoader.module.css';

enum ELoadType {
    SPINNER = 'spinner',
    COUNT = 'count'
}

const clearIconsLang = [
    t('methods.clear_blacklist.clearing_progress'),
    t('methods.clear_dialog_members.clearing_progress')
];

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

    function getImage() {
        if (getImageType() === ELoadType.COUNT) {
            if (clearIconsLang.includes(String(progress.text))) {
                return AnimatedDuckClean;
            }

            return AnimatedDuckCountDucks;
        }

        return AnimatedDuckSearchFolders;
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
                {progress.warningText && (
                    <Blockquote type="text" style={{ marginBottom: 10 }}>
                        {progress.warningText}
                    </Blockquote>
                )}

                <Caption>{t('common.do_not_leave')}</Caption>

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
                <Lottie animationData={getImage()} loop />
            </div>

            <div className={classes.progressSection}>
                {getImageType() === ELoadType.COUNT ? LoadingRow() : SpinnerRow()}
            </div>
        </>
    );
}
