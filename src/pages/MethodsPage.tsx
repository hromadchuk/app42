import { Cell, List, Section } from '@telegram-apps/telegram-ui';
import { useParams } from 'react-router-dom';
import { getCardById, getMethodsByCardId } from '../cards.ts';
import { PageHeader } from '../components/PageHeader.tsx';
import { wrapCall } from '../lib/helpers.ts';
import { IMethod, MethodCategory } from '../routes.tsx';
import { t } from '../lib/lang.ts';

import classes from '../styles/MenuPage.module.css';

export function MethodRow(method: IMethod) {
    return (
        <Cell
            key={method.id}
            before={<method.icon size={28} stroke={1.2} />}
            onClick={() => {
                // navigate(`/category/${card.id}`);
                // wrapCall(() => miniApp.setHeaderColor(card.color));
            }}
        >
            {method.name}
        </Cell>
    );
}

export default function MethodsPage() {
    const categoryId = useParams().categoryId as MethodCategory;
    const card = getCardById(categoryId);
    const methodsList = getMethodsByCardId(categoryId);

    console.log('categoryId', categoryId);
    console.log('methodsList', methodsList);

    return (
        <>
            <PageHeader header={t(`menu.cards.${categoryId}`)} color={card.color} />

            <List style={{ padding: 16 }}>
                <Section className={classes.categories}>{methodsList.map(MethodRow)}</Section>
            </List>
        </>
    );
}
