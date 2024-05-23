import { useParams } from 'react-router-dom';
import { getCardById } from '../cards.ts';
import { PageHeader } from '../components/PageHeader.tsx';
import { t } from '../lib/lang.ts';
import { getMethodById, MethodCategory } from '../routes.tsx';

export default function AbstractMethod() {
    const categoryId = useParams().categoryId as MethodCategory;
    const methodId = useParams().methodId as string;
    const card = getCardById(categoryId);
    const method = getMethodById(methodId);

    console.log({ categoryId, methodId });

    return (
        <>
            <PageHeader header={method.name} subheader={t(`menu.cards.${categoryId}`)} color={card.color} />

            <div>AbstractMethod</div>
            <div>categoryId: {categoryId}</div>
            <div>methodId: {methodId}</div>
        </>
    );
}
