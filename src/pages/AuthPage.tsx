import { IconBook2 } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { Avatar, Button, Center, Container, Divider, Loader, TextInput, UnstyledButton } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { computeCheck } from 'telegram/Password';
import Logo from '../components/Logo.tsx';
import { CallAPI, getDocLink } from '../lib/helpers.tsx';
import { t } from '../lib/lang.tsx';

import { Constants } from '../constants.tsx';
import { AppContext } from '../components/AppContext.tsx';

// @ts-ignore
import classes from '../styles/MenuPage.module.css';

enum AuthState {
    loading = 'loading',
    number = 'number',
    code = 'code',
    password = 'password'
}

interface IInputItemRow {
    visibleStates: AuthState[];
    disabledStates?: AuthState[];
    error?: string;
    setValue: (value: string) => void;
    type?: string;
    label?: string;
}

interface IButtonItemRow {
    visibleStates: AuthState[];
    disabledValue?: string;
    onClick?: () => void;
    name?: string;
}

const AuthPage = () => {
    const { setUser } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [state, setSate] = useState(AuthState.loading);
    const [isLoading, setLoading] = useState(true);

    const [number, setNumber] = useState('');
    const [numberError, setNumberError] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        (async () => {
            const session = localStorage.getItem(Constants.SESSION_KEY);

            await window.TelegramClient.connect();

            if (!session) {
                setSate(AuthState.number);
                setLoading(false);
            } else {
                await getCurrentUser();
            }
        })();
    }, []);

    async function getCurrentUser() {
        try {
            const query = new URLSearchParams(location.search);
            const [user] = await CallAPI(
                new Api.users.GetUsers({
                    id: [new Api.InputUserSelf()]
                }),
                { hideErrorAlert: true }
            );

            window.userId = user.id.valueOf();

            setUser(user as Api.User);
            setLoading(false);
            navigate(query.get('to') || '/menu');
        } catch (error) {
            setSate(AuthState.number);
            setLoading(false);
        }
    }

    async function confirmNumber() {
        setLoading(true);
        setNumberError('');

        try {
            const result = (await CallAPI(
                new Api.auth.SendCode({
                    phoneNumber: number.trim(),
                    apiId: Constants.API_ID,
                    apiHash: Constants.API_HASH,
                    settings: new Api.CodeSettings({
                        allowFlashcall: true,
                        currentNumber: true,
                        allowAppHash: true,
                        allowMissedCall: true
                    })
                }),
                { hideErrorAlert: true }
            )) as Api.auth.SentCode;

            setPhoneCodeHash(result.phoneCodeHash);
            setSate(AuthState.code);
        } catch (error) {
            // @ts-ignore
            setNumberError(error?.message);
        }

        setLoading(false);
    }

    async function confirmCode() {
        setLoading(true);
        setCodeError('');

        try {
            await CallAPI(
                new Api.auth.SignIn({
                    phoneNumber: number.trim(),
                    phoneCodeHash,
                    phoneCode: code
                }),
                { hideErrorAlert: true }
            );

            localStorage.setItem(Constants.SESSION_KEY, `${window.TelegramClient.session.save()}`);

            await getCurrentUser();
        } catch (error) {
            // @ts-ignore
            if (error?.message.includes('SESSION_PASSWORD_NEEDED')) {
                setSate(AuthState.password);
                setLoading(false);
            } else {
                // @ts-ignore
                setCodeError(error.message);
            }
        }

        setLoading(false);
    }

    async function confirmPassword() {
        setLoading(true);
        setPasswordError('');

        try {
            const dataLogin = await CallAPI(new Api.account.GetPassword());

            await CallAPI(new Api.auth.CheckPassword({ password: await computeCheck(dataLogin, password) }), {
                hideErrorAlert: true
            });

            localStorage.setItem(Constants.SESSION_KEY, `${window.TelegramClient.session.save()}`);

            await getCurrentUser();
        } catch (error) {
            // @ts-ignore
            setPasswordError(error.message);
        }
        setLoading(false);
    }

    async function submitForm() {
        switch (state) {
            case AuthState.number:
                await confirmNumber();
                break;
            case AuthState.code:
                await confirmCode();
                break;
            case AuthState.password:
                await confirmPassword();
                break;
        }
    }

    const InputItemRow = ({ visibleStates = [], disabledStates = [], error, setValue, type, label }: IInputItemRow) => {
        if (!visibleStates.includes(state)) {
            return null;
        }

        return (
            <TextInput
                type={type}
                label={label}
                error={error}
                disabled={disabledStates.includes(state)}
                onChange={(e) => setValue(e.target.value)}
            />
        );
    };

    const ButtonItemRow = ({ visibleStates = [], disabledValue = '', name }: IButtonItemRow) => {
        if (!visibleStates.includes(state)) {
            return null;
        }

        return (
            <Button
                fullWidth
                variant="outline"
                mt="xs"
                type="submit"
                disabled={(disabledValue || '').length === 0 || isLoading}
            >
                {name}
            </Button>
        );
    };

    if (state === AuthState.loading) {
        return (
            <Center h={100} mx="auto">
                <Loader />
            </Center>
        );
    }

    return (
        <Container>
            <Center py={10}>{t('auth_page.description')}</Center>
            <form onSubmit={submitForm}>
                {InputItemRow({
                    label: t('auth_page.input_number'),
                    visibleStates: [AuthState.number, AuthState.code, AuthState.password],
                    disabledStates: [AuthState.code, AuthState.password],
                    error: numberError,
                    setValue: setNumber
                })}
                {InputItemRow({
                    label: t('auth_page.input_code'),
                    visibleStates: [AuthState.code, AuthState.password],
                    disabledStates: [AuthState.password],
                    error: codeError,
                    setValue: setCode
                })}
                {InputItemRow({
                    label: t('auth_page.input_password'),
                    visibleStates: [AuthState.password],
                    disabledStates: [],
                    type: 'password',
                    error: passwordError,
                    setValue: setPassword
                })}
                {ButtonItemRow({
                    visibleStates: [AuthState.number],
                    disabledValue: number,
                    name: t('auth_page.button_send_code')
                })}
                {ButtonItemRow({
                    visibleStates: [AuthState.code],
                    disabledValue: code,
                    name: t('auth_page.button_confirm_code')
                })}
                {ButtonItemRow({
                    visibleStates: [AuthState.password],
                    disabledValue: password,
                    name: t('auth_page.button_confirm_password')
                })}
            </form>

            {state === AuthState.number && (
                <>
                    <Divider my="sm" />

                    <UnstyledButton className={classes.link} component="a" href={getDocLink('')} target="_blank">
                        <IconBook2 className={classes.linkIcon} stroke={1.5} />
                        <span>{t('menu.documentation')}</span>
                    </UnstyledButton>

                    <UnstyledButton
                        className={classes.link}
                        component="a"
                        href="https://t.me/kit42_app"
                        target="_blank"
                    >
                        <Avatar size="sm" color="blue" radius="xl" mr="xs">
                            <Logo size={14} />
                        </Avatar>
                        <span>{t('menu.telegram_channel')}</span>
                    </UnstyledButton>
                </>
            )}
        </Container>
    );
};

export default AuthPage;
