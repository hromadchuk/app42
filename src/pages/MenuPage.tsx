import {
    Avatar,
    Container,
    Divider,
    getThemeColor,
    Modal,
    Notification,
    SimpleGrid,
    Text,
    UnstyledButton,
    useMantineTheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconAddressBook,
    IconBook2,
    IconMessages,
    IconPigMoney,
    IconUser,
    IconUsersGroup,
    TablerIconsProps
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Api } from 'telegram';
import { Link } from 'react-router-dom';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI, getDocLink } from '../lib/helpers.ts';
import { hexToRgba } from '../lib/theme.ts';
import { getMethods, IMethod, MethodCategory } from '../routes.tsx';
import Logo from '../components/Logo.tsx';
import { t } from '../lib/lang.ts';

// @ts-ignore
import classes from '../styles/MenuPage.module.css';

interface ICard {
    id: MethodCategory;
    icon: (props: TablerIconsProps) => JSX.Element;
    color: string;
}

const cards = [
    {
        id: MethodCategory.ACCOUNT,
        icon: IconUser,
        color: 'violet'
    },
    {
        id: MethodCategory.CONTACTS,
        icon: IconAddressBook,
        color: 'teal'
    },
    {
        id: MethodCategory.CHANNELS,
        icon: IconUsersGroup,
        color: 'yellow'
    },
    {
        id: MethodCategory.CHATS,
        icon: IconMessages,
        color: 'pink'
    }
];

const MenuPage = () => {
    const theme = useMantineTheme();
    const [isModalOpened, { open, close }] = useDisclosure(false);

    const [developer, setDeveloper] = useState<Api.User | null>(null);
    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);

    useEffect(() => {
        CallAPI(
            new Api.users.GetUsers({
                id: ['paulo']
            })
        ).then(([user]) => {
            if (user) {
                setDeveloper(user as Api.User);
            }
        });
    }, []);

    const methods = getMethods();

    function getMethodsList(category: MethodCategory) {
        return methods.filter((item) => item.categories.includes(category)).map(MethodRow);
    }

    function MethodRow(method: IMethod, key: number) {
        return (
            <Link key={key} className={classes.link} to={`/methods/${method.id}`}>
                <method.icon className={classes.linkIcon} stroke={1.5} />
                <span>{method.name}</span>
            </Link>
        );
    }

    function CategoryBlock(card: ICard, key: number) {
        const color = getThemeColor(card.color, theme);
        const cardStyle = {
            backgroundColor: hexToRgba(theme.colors[card.color][9], 0.1)
        };

        return (
            <UnstyledButton
                key={key}
                className={classes.item}
                style={cardStyle}
                onClick={() => {
                    setSelectedCard(card);
                    open();
                }}
            >
                <card.icon size={32} color={color} />
                <Text size="xs" mt={7}>
                    {t(`menu.cards.${card.id}`)}
                </Text>
            </UnstyledButton>
        );
    }

    return (
        <>
            <Modal opened={isModalOpened} onClose={close} title={selectedCard && t(`menu.cards.${selectedCard.id}`)}>
                {selectedCard && getMethodsList(selectedCard.id)}
            </Modal>

            <Container p={5}>
                <SimpleGrid cols={2} mt="md">
                    {cards.map(CategoryBlock)}
                </SimpleGrid>

                <Divider my="sm" />

                <UnstyledButton className={classes.link} component="a" href={getDocLink('')} target="_blank">
                    <IconBook2 className={classes.linkIcon} stroke={1.5} />
                    <span>{t('menu.documentation')}</span>
                </UnstyledButton>

                <UnstyledButton className={classes.link} component="a" href={getDocLink('donate')} target="_blank">
                    <IconPigMoney className={classes.linkIcon} stroke={1.5} />
                    <span>{t('menu.donate')}</span>
                </UnstyledButton>

                <UnstyledButton className={classes.link} component="a" href="https://t.me/kit42_app" target="_blank">
                    <Avatar size="sm" color="blue" radius="xl" mr="xs">
                        <Logo size={14} />
                    </Avatar>
                    <span>{t('menu.telegram_channel')}</span>
                </UnstyledButton>
            </Container>

            {developer && (
                <Notification withCloseButton={false} m="xs" color="gray">
                    {t('alpha.description')}
                    <OwnerRow owner={developer} description={t('alpha.user_description')} />
                </Notification>
            )}
        </>
    );
};

export default MenuPage;
