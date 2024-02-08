import { Button } from '@mantine/core';
import { useCloudStorage } from '@tma.js/sdk-react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { SelectLanguage } from '../components/SelectLanguage.tsx';
import { CallAPI } from '../lib/helpers.ts';
import { t } from '../lib/lang.ts';

const ProfilePage = () => {
    const { setUser, markOnboardingAsCompleted } = useContext(AppContext);
    const navigate = useNavigate();
    const storage = useCloudStorage();

    const logout = async () => {
        await CallAPI(new Api.auth.LogOut());

        await storage.delete(Constants.SESSION_KEY);
        setUser(null);
        navigate('/');

        localStorage.clear();
        markOnboardingAsCompleted();
        location.reload();
    };

    return (
        <>
            <SelectLanguage />

            <Button fullWidth onClick={logout} mt="xs">
                {t('profile.button_logout')}
            </Button>
        </>
    );
};

export default ProfilePage;
