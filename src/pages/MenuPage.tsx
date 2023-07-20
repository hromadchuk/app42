import { createStyles, getStylesRef } from '@mantine/core';

import { Link } from 'react-router-dom';
import { routers } from '../routes.tsx';

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

    const links = routers
        .filter((item) => item.isMethod)
        .map((item, key) => (
            <Link key={key} className={classes.link} to={item.path}>
                {item.icon && <item.icon className={classes.linkIcon} stroke={1.5} />}
                <span>{item.name}</span>
            </Link>
        ));

    return <>{links}</>;
};

export default MenuPage;
