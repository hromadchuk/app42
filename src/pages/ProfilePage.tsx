import { Button, Container } from '@mantine/core';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { AppContext } from '../components/AppContext.tsx';
import { OwnerRow } from '../components/OwnerRow.tsx';
import { t } from '../lib/lang.tsx';

const ProfilePage = () => {
    const { user, setUser } = useContext(AppContext);
    const navigate = useNavigate();

    const logout = async () => {
        await window.TelegramClient.invoke(new Api.auth.LogOut());

        setUser(null);
        navigate('/');
    };

    const getUserDescription = (): string => {
        if (user?.username) {
            return `@${user.username}`;
        }

        return '';
    };

    return (
        <Container my="xs">
            <OwnerRow owner={user} description={getUserDescription()} />

            <Button fullWidth onClick={logout} mt="xs">
                {t('profile.button_logout')}
            </Button>
        </Container>
    );
};

export default ProfilePage;
