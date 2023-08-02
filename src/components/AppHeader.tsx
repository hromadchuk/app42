import { ActionIcon, Center, Container, createStyles, Header, rem, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import ReactGA from 'react-ga4';
import { isDev } from '../lib/helpers.tsx';

import Logo from './Logo.tsx';
import { OwnerAvatar } from './OwnerAvatar.tsx';

const useStyles = createStyles(() => ({
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: rem(56)
    }
}));

interface IAppHeader {
    user: null | Api.User;
}

const excludeBackButton = ['/', '/menu'];

export function AppHeader({ user }: IAppHeader) {
    const location = useLocation();
    const navigate = useNavigate();
    const { classes } = useStyles();

    useEffect(() => {
        if (!isDev) {
            ReactGA.initialize('G-T5H886J9RS');
        }
    }, []);

    useEffect(() => {
        if (!isDev) {
            ReactGA.send({ hitType: 'pageview', page: location.pathname });
        }
    }, [location]);

    const LeftSide = () => {
        if (excludeBackButton.includes(location.pathname)) {
            return null;
        }

        return (
            <ActionIcon onClick={() => navigate('/menu')}>
                <IconArrowLeft size={20} />
            </ActionIcon>
        );
    };

    const RightSide = () => {
        if (!user) {
            return null;
        }

        return (
            <UnstyledButton component={Link} to="/profile">
                <OwnerAvatar owner={user} />
            </UnstyledButton>
        );
    };

    return (
        <Header height={56}>
            <Container className={classes.container}>
                {LeftSide()}

                <Center mx="auto">
                    <Logo width={28} height={28} />
                </Center>

                {RightSide()}
            </Container>
        </Header>
    );
}
