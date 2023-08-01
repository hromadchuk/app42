import { createStyles, getStylesRef, Notification } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Api } from 'telegram';
import { Link } from 'react-router-dom';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { routers } from '../routes.tsx';
import { t } from '../lib/lang.tsx';

const useStyles = createStyles((theme) => ({
    link: {
        ...theme.fn.focusStyles(),
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderRadius: theme.radius.sm,
        fontWeight: 500,

        '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
            color: theme.colorScheme === 'dark' ? theme.white : theme.black,

            [`& .${getStylesRef('icon')}`]: {
                color: theme.colorScheme === 'dark' ? theme.white : theme.black
            }
        }
    },

    linkIcon: {
        ref: getStylesRef('icon'),
        color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
        marginRight: theme.spacing.sm
    }
}));

const MenuPage = () => {
    const { classes } = useStyles();
    const [developer, setDeveloper] = useState<null | Api.User>(null);

    useEffect(() => {
        window.TelegramClient.invoke(
            new Api.users.GetUsers({
                id: ['paulo']
            })
        ).then(([user]) => {
            if (user) {
                setDeveloper(user as Api.User);
            }
        });
    }, []);

    const links = routers
        .filter((item) => item.isMethod)
        .map((item, key) => (
            <Link key={key} className={classes.link} to={item.path}>
                {item.icon && <item.icon className={classes.linkIcon} stroke={1.5} />}
                <span>{item.name}</span>
            </Link>
        ));

    return (
        <>
            {links}

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
