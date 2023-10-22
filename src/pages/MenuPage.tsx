import { Avatar, Container, Divider, Notification, UnstyledButton } from '@mantine/core';
import { IconBook2 } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Api } from 'telegram';
import { Link } from 'react-router-dom';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { CallAPI, getDocLink } from '../lib/helpers.tsx';
import { routers } from '../routes.tsx';
import Logo from '../components/Logo.tsx';
import { t } from '../lib/lang.tsx';

// @ts-ignore
import classes from '../styles/MenuPage.module.css';

const MenuPage = () => {
    const [developer, setDeveloper] = useState<null | Api.User>(null);

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
            <Container p={5}>
                {links}

                <Divider my="sm" />

                <UnstyledButton className={classes.link} component="a" href={getDocLink('')} target="_blank">
                    <IconBook2 className={classes.linkIcon} stroke={1.5} />
                    <span>{t('menu.documentation')}</span>
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
