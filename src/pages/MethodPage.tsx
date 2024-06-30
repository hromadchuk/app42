import { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCardById } from '../cards.ts';
import { PageHeader } from '../components/PageHeader.tsx';
import { Constants } from '../constants.ts';
import { getCache, removeCache } from '../lib/cache.ts';
import { t } from '../lib/lang.ts';
import { AuthType, getMethodById, MethodCategory } from '../routes.tsx';

import { AppContext } from '../contexts/AppContext.tsx';
import AuthTgPage from './AuthTgPage.tsx';
import AbstractMethod from '../methods/AbstractMethod.tsx';

export default function MethodPage() {
    const { user } = useContext(AppContext);

    const categoryId = useParams().categoryId as MethodCategory;
    const methodId = useParams().methodId as string;
    const card = getCardById(categoryId);
    const method = getMethodById(methodId);

    useEffect(() => {
        if (method.authType === AuthType.TG && user) {
            getCache(Constants.AUTH_STATE_METHOD_KEY).then((value) => {
                if (value) {
                    removeCache(Constants.AUTH_STATE_METHOD_KEY);
                }
            });
        }
    }, [user]);

    function Content() {
        if (method.authType === AuthType.TG && !user) {
            return <AuthTgPage />;
        }

        return <AbstractMethod />;
    }

    return (
        <>
            <PageHeader header={method.name} subheader={t(`menu.cards.${categoryId}`)} color={card.color} />

            {Content()}
        </>
    );
}
