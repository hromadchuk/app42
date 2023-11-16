import { ActionIcon, AppShell, Center, Group, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import ReactGA from 'react-ga4';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { isDev } from '../lib/helpers.ts';

import { OwnerAvatar } from './OwnerAvatar.tsx';
import LogoLottie from '../assets/logo_lottie.json';

import { AppContext } from '../contexts/AppContext.tsx';

// @ts-ignore
import classes from '../styles/AppHeader.module.css';

interface IAppHeader {
    user: null | Api.User;
}

const excludeBackButton = ['/', '/menu'];

export function AppHeader({ user }: IAppHeader) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAppLoading } = useContext(AppContext);

    const logoRef = useRef<LottieRefCurrentProps>(null);

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

    useEffect(() => {
        if (isAppLoading) {
            logoRef.current?.play();
        } else {
            logoRef.current?.stop();
        }
    }, [isAppLoading]);

    const LeftSide = () => {
        if (excludeBackButton.includes(location.pathname)) {
            return null;
        }

        return (
            <ActionIcon
                variant="transparent"
                size="xl"
                onClick={() => {
                    navigate('/menu');

                    if (isAppLoading) {
                        // need for stop all requests
                        window.location.reload();
                    }
                }}
            >
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
            <Center mx="auto" className={classes.logoBlock}>
                <Lottie lottieRef={logoRef} animationData={LogoLottie} className={classes.logo} autoplay={false} />
            </Center>

            <Group h="100%" px="md">
                <LeftSide />

                <Center mx="auto" />

                <RightSide />
            </Group>
        </AppShell.Header>
    );
}
