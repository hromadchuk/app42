import { List, Section } from '@telegram-apps/telegram-ui';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getCardById, getMethodsByCardId } from '../cards.ts';
import { WrappedCell } from '../components/Helpers.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { IMethod, MethodCategory } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import { AppContext } from '../contexts/AppContext.tsx';

import classes from '../styles/MenuPage.module.css';

export function MethodRow(method: IMethod) {
    const { openMethod } = useContext(AppContext);
    const categoryId = useParams().categoryId as MethodCategory;

    return (
        <WrappedCell
            key={method.id}
            before={<method.icon size={28} stroke={1.2} />}
            onClick={() => openMethod(method, categoryId)}
        >
            {method.name}
        </WrappedCell>
    );
}

export default function MethodsPage() {
    const categoryId = useParams().categoryId as MethodCategory;
    const card = getCardById(categoryId);
    const methodsList = getMethodsByCardId(categoryId);

    return (
        <>
            <PageHeader header={t(`menu.cards.${categoryId}`)} color={card.color} />

            <List style={{ padding: 16 }}>
                <Section className={classes.categories}>{methodsList.map(MethodRow)}</Section>
            </List>
        </>
    );
}
