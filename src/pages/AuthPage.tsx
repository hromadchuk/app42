import { useContext, useEffect, useState } from 'react';
import { Button, Center, Container, Loader, TextInput } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { Api, TelegramClient } from 'telegram';
import { computeCheck } from 'telegram/Password';
import { StringSession } from 'telegram/sessions';

import { Constants } from '../constants.tsx';
import { AppContext } from '../components/AppContext.tsx';
import { t } from '../lib/lang.tsx';

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

const sessionStorageKey = 'kit42Session';

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
            const session = localStorage.getItem(sessionStorageKey);

            window.TelegramClient = new TelegramClient(
                new StringSession(session || ''),
                Constants.API_ID,
                Constants.API_HASH,
                {
                    connectionRetries: 5,
                    useWSS: true
                }
            );

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
            const [user] = await window.TelegramClient.invoke(
                new Api.users.GetUsers({
                    id: [new Api.InputUserSelf()]
                })
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
            const result = (await window.TelegramClient.invoke(
                new Api.auth.SendCode({
                    phoneNumber: number,
                    apiId: Constants.API_ID,
                    apiHash: Constants.API_HASH,
                    settings: new Api.CodeSettings({
                        allowFlashcall: true,
                        currentNumber: true,
                        allowAppHash: true,
                        allowMissedCall: true
                    })
                })
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
            await window.TelegramClient.invoke(
                new Api.auth.SignIn({
                    phoneNumber: number,
                    phoneCodeHash,
                    phoneCode: code
                })
            );

            localStorage.setItem(sessionStorageKey, `${window.TelegramClient.session.save()}`);

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
            const dataLogin = await window.TelegramClient.invoke(new Api.account.GetPassword());

            await window.TelegramClient.invoke(
                new Api.auth.CheckPassword({ password: await computeCheck(dataLogin, password) })
            );

            localStorage.setItem(sessionStorageKey, `${window.TelegramClient.session.save()}`);

            await getCurrentUser();
        } catch (error) {
            // @ts-ignore
            setPasswordError(error.message);
        }
        setLoading(false);
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

    const ButtonItemRow = ({ visibleStates = [], disabledValue = '', onClick, name }: IButtonItemRow) => {
        if (!visibleStates.includes(state)) {
            return null;
        }

        return (
            <Button
                fullWidth
                variant="outline"
                mt="xs"
                onClick={onClick}
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
                onClick: confirmNumber,
                name: t('auth_page.button_send_code')
            })}
            {ButtonItemRow({
                visibleStates: [AuthState.code],
                disabledValue: code,
                onClick: confirmCode,
                name: t('auth_page.button_confirm_code')
            })}
            {ButtonItemRow({
                visibleStates: [AuthState.password],
                disabledValue: password,
                onClick: confirmPassword,
                name: t('auth_page.button_confirm_password')
            })}
        </Container>
    );
};

export default AuthPage;
