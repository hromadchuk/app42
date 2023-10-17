import { ActionIcon, AppShell, Center, Group, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import ReactGA from 'react-ga4';
import { isDev } from '../lib/helpers.tsx';

import Logo from './Logo.tsx';
import { OwnerAvatar } from './OwnerAvatar.tsx';

interface IAppHeader {
    user: null | Api.User;
}

const excludeBackButton = ['/', '/menu'];

export function AppHeader({ user }: IAppHeader) {
    const location = useLocation();
    const navigate = useNavigate();

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
            <ActionIcon variant="transparent" size="xl" onClick={() => navigate('/menu')}>
                <IconArrowLeft />
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
        <AppShell.Header>
            <Group h="100%" px="md">
                <LeftSide />

                <Center mx="auto">
                    <Logo size={28} />
                </Center>

                <RightSide />
            </Group>
        </AppShell.Header>
    );
}
