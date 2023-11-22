import { useContext, useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Center,
    Combobox,
    Container,
    Divider,
    Flex,
    Input,
    Loader,
    Notification,
    PasswordInput,
    PinInput,
    ScrollArea,
    Text,
    UnstyledButton,
    useCombobox
} from '@mantine/core';
import { IconBook2, IconSelector } from '@tabler/icons-react';
import { IMaskInput } from 'react-imask';
import { useLocation, useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { computeCheck } from 'telegram/Password';
import { CountryFlag } from '../components/CountryFlag.tsx';
import Logo from '../components/Logo.tsx';
import { getCache, removeCache, setCache } from '../lib/cache.ts';
import { CallAPI, getDocLink } from '../lib/helpers.ts';
import { getAppLangCode, t } from '../lib/lang.ts';

import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';

// @ts-ignore
import menuClasses from '../styles/MenuPage.module.css';
// @ts-ignore
import authClasses from '../styles/AuthPage.module.css';

enum AuthState {
    loading = 'loading',
    number = 'number',
    code = 'code',
    password = 'password'
}

interface IButtonItemRow {
    visibleStates: AuthState[];
    disabledValue?: string;
    onClick: () => void;
    name: string;
}

interface IInputCountry {
    name: string;
    code: string;
    prefix: number;
    pattern?: string;
}

interface IAuthStateNumber {
    countryCode: string;
    numberSuffix: string;
    phoneCodeHash: string;
    phoneCode: number;
}

const AuthPage = () => {
    const { setUser, setAppLoading } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [searchCountry, setSearchCountry] = useState('');
    const [inputCountries, setInputCountries] = useState<IInputCountry[]>([]);

    const [state, setSate] = useState(AuthState.loading);
    const [dataLogin, setDataLogin] = useState<Api.account.Password | null>(null);
    const [isLoading, setLoading] = useState(true);

    const [number, setNumber] = useState('');
    const [numberError, setNumberError] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');

    const [code, setCode] = useState('');
    const [codeLength, setCodeLength] = useState(5);
    const [codeError, setCodeError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            setSearchCountry('');
        },
        onDropdownOpen: () => {
            combobox.focusSearchInput();
        }
    });

    const save = () => localStorage.setItem(Constants.SESSION_KEY, `${window.TelegramClient.session.save()}`);

    useEffect(() => {
        setAppLoading(true);

        (async () => {
            const session = localStorage.getItem(Constants.SESSION_KEY);

            await window.TelegramClient.connect();

            const authStateNumber = (await getCache(Constants.AUTH_STATE_NUMBER_KEY)) as IAuthStateNumber;
            if (authStateNumber) {
                await getAuthData();
                setSelectedCountry(authStateNumber.countryCode);
                setPhoneCodeHash(authStateNumber.phoneCodeHash);
                setCodeLength(authStateNumber.phoneCode);
                setNumber(authStateNumber.numberSuffix);
                setSate(AuthState.code);
                setLoading(false);
                setAppLoading(false);
            } else if (!session) {
                await getAuthData();
                setSate(AuthState.number);
                setLoading(false);
                setAppLoading(false);
            } else {
                await getCurrentUser();
            }
        })();
    }, []);

    async function getCurrentUser() {
        try {
            const query = new URLSearchParams(location.search);
            const [user] = (await CallAPI(
                new Api.users.GetUsers({
                    id: [new Api.InputUserSelf()]
                }),
                { hideErrorAlert: true }
            )) as Api.User[];

            window.userId = user.id.valueOf();

            setUser(user as Api.User);
            setLoading(false);
            setAppLoading(false);
            navigate(query.get('to') || '/menu');
        } catch (error) {
            await getAuthData();
            setSate(AuthState.number);
            setLoading(false);
            setAppLoading(false);
        }
    }

    async function getAuthData() {
        const config = await CallAPI(new Api.help.GetNearestDc());
        setSelectedCountry(config.country);

        const { countries } = (await CallAPI(
            new Api.help.GetCountriesList({
                langCode: getAppLangCode()
            })
        )) as Api.help.CountriesList;

        const initInputCountries: IInputCountry[] = [];

        countries.forEach((country) => {
            country.countryCodes.forEach((countryCode) => {
                const data: IInputCountry = {
                    name: country.name || country.defaultName,
                    code: country.iso2,
                    prefix: Number(countryCode.countryCode)
                };

                if (countryCode.patterns?.length) {
                    data.pattern = countryCode.patterns.pop();
                }

                initInputCountries.push(data);
            });
        });

        const anonymousNumberCountry = initInputCountries.find((country) => country.prefix === 888);
        // skip some strange codes with problems
        const ignorePrefixes = [
            888, // Anonymous number
            881, // International network
            882, // International network
            883, // International network
            42 // Y-land ??
        ];
        const otherCountries = initInputCountries
            .filter((country) => !ignorePrefixes.includes(country.prefix))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (anonymousNumberCountry) {
            otherCountries.unshift(anonymousNumberCountry);
        }

        setInputCountries(otherCountries);
    }

    async function confirmNumber() {
        setLoading(true);
        setAppLoading(true);
        setNumberError('');

        const country = getSelectCountry();
        const phoneNumber = `+${country.prefix}${number}`.replace(/\s/g, '');

        try {
            const result = (await CallAPI(
                new Api.auth.SendCode({
                    phoneNumber,
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

            const phoneCodeHashResult = result.phoneCodeHash as string;
            // @ts-ignore
            const phoneCodeLengthResult = result.type?.length;

            const setData: IAuthStateNumber = {
                countryCode: country.code,
                numberSuffix: number,
                phoneCodeHash: phoneCodeHashResult,
                phoneCode: phoneCodeLengthResult
            };

            await setCache(Constants.AUTH_STATE_NUMBER_KEY, setData, 15);
            save();

            setPhoneCodeHash(phoneCodeHashResult);
            setCodeLength(phoneCodeLengthResult);
            setSate(AuthState.code);
        } catch (error) {
            // @ts-ignore
            setNumberError(error?.message);
        }

        setLoading(false);
        setAppLoading(false);
    }

    async function confirmCode() {
        setLoading(true);
        setAppLoading(true);
        setCodeError('');

        const country = getSelectCountry();
        const phoneNumber = `+${country.prefix}${number}`.replace(/\s/g, '');

        try {
            await CallAPI(
                new Api.auth.SignIn({
                    phoneNumber,
                    phoneCodeHash,
                    phoneCode: code
                }),
                { hideErrorAlert: true }
            );

            save();

            await getCurrentUser();
        } catch (error) {
            // @ts-ignore
            if (error?.message.includes('SESSION_PASSWORD_NEEDED')) {
                setDataLogin(await CallAPI(new Api.account.GetPassword()));
                setSate(AuthState.password);
                setLoading(false);
                setAppLoading(false);
            } else {
                // @ts-ignore
                setCodeError(error.message);
            }
        }

        await removeCache(Constants.AUTH_STATE_NUMBER_KEY);

        setLoading(false);
        setAppLoading(false);
    }

    async function confirmPassword() {
        setLoading(true);
        setAppLoading(true);
        setPasswordError('');

        if (!dataLogin) {
            return;
        }

        try {
            await CallAPI(new Api.auth.CheckPassword({ password: await computeCheck(dataLogin, password) }), {
                hideErrorAlert: true
            });

            save();

            await getCurrentUser();
        } catch (error) {
            // @ts-ignore
            setPasswordError(error.message);
        }
        setLoading(false);
        setAppLoading(false);
    }

    function hasState(states: AuthState[]) {
        return states.includes(state);
    }

    function getSelectCountry(): IInputCountry {
        if (selectedCountry) {
            return inputCountries.find((findCountry) => findCountry.code === selectedCountry) as IInputCountry;
        }

        return inputCountries[0];
    }

    function getInputMask(): string | undefined {
        const country = getSelectCountry();

        if (country?.pattern) {
            return country.pattern.replace(/X/g, '0');
        }

        return undefined;
    }

    function getInputMasks(): (string | NumberConstructor)[] {
        const result = [];

        const mask = getInputMask();
        if (mask) {
            result.push(mask);
        }

        result.push(Number);

        return result;
    }

    function NumberInputRow() {
        if (!hasState([AuthState.number, AuthState.code, AuthState.password])) {
            return null;
        }

        const country = getSelectCountry();
        const options = inputCountries
            .filter((item) => {
                if (!searchCountry) {
                    return true;
                }

                return item.name.toLowerCase().includes(searchCountry.toLowerCase());
            })
            .map((item, key) => (
                <Combobox.Option value={item.code} key={item.code + key}>
                    <Flex gap="md" p={5} justify="flex-start" align="center" direction="row" wrap="nowrap">
                        <CountryFlag code={item.code} size={20} />
                        <Text size="sm">{item.name}</Text>
                        <Container p={0} mr={0} w={55} ta="end">
                            <Text c="dimmed" size="sm">
                                +{item.prefix}
                            </Text>
                        </Container>
                    </Flex>
                </Combobox.Option>
            ));

        return (
            <Input.Wrapper label={t('auth_page.input_number')} error={numberError}>
                <Button.Group>
                    <Combobox
                        store={combobox}
                        width={300}
                        position="bottom-start"
                        withArrow
                        onOptionSubmit={(val) => {
                            setSelectedCountry(val);
                            setNumber('');
                            combobox.closeDropdown();
                        }}
                    >
                        <Combobox.Target withAriaAttributes={false}>
                            <Button
                                onClick={() => combobox.toggleDropdown()}
                                leftSection={<CountryFlag code={country.code} size={20} />}
                                rightSection={<IconSelector size={14} color="var(--mantine-color-gray-6)" />}
                                variant="default"
                                className={authClasses.selectCountryButton}
                                disabled={hasState([AuthState.code, AuthState.password])}
                            >{`+${country.prefix}`}</Button>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                            <Combobox.Search
                                value={searchCountry}
                                onChange={(event) => setSearchCountry(event.currentTarget.value)}
                                placeholder={t('auth_page.search_placeholder')}
                            />
                            <Combobox.Options>
                                <ScrollArea h={250}>
                                    {options.length > 0 ? options : <Combobox.Empty>Nothing found</Combobox.Empty>}
                                </ScrollArea>
                            </Combobox.Options>
                        </Combobox.Dropdown>
                    </Combobox>
                    <Input
                        component={IMaskInput}
                        mask={getInputMasks()}
                        placeholder={getInputMask() || '000 000 0000'}
                        className={authClasses.selectCountryInput}
                        disabled={hasState([AuthState.code, AuthState.password])}
                        value={number}
                        // @ts-ignore
                        onChange={(e) => setNumber(e.target.value)}
                    />
                </Button.Group>
            </Input.Wrapper>
        );
    }

    function CodeInputRow() {
        if (!hasState([AuthState.code, AuthState.password])) {
            return null;
        }

        return (
            <Input.Wrapper label={t('auth_page.input_code')} error={codeError}>
                <PinInput
                    styles={{
                        root: { justifyContent: 'space-between' }
                    }}
                    length={codeLength}
                    type="number"
                    onChange={setCode}
                    disabled={hasState([AuthState.password])}
                />
            </Input.Wrapper>
        );
    }

    function PasswordInputRow() {
        if (!hasState([AuthState.password])) {
            return null;
        }

        const passwordHint = dataLogin?.hint;

        return (
            <Input.Wrapper
                label={t('auth_page.input_password') + (passwordHint ? ` (${passwordHint})` : '')}
                error={passwordError}
            >
                <PasswordInput onChange={(e) => setPassword(e.currentTarget.value)} />
            </Input.Wrapper>
        );
    }

    function WarningCodeRow() {
        if (!hasState([AuthState.code])) {
            return null;
        }

        return (
            <>
                <Notification mt="xs" withCloseButton={false} color="yellow">
                    {t('auth_page.code_description')}
                </Notification>

                <Button fullWidth mt="xs" component="a" href="https://t.me/+42777" target="_blank">
                    {t('auth_page.code_account_button')}
                </Button>
            </>
        );
    }

    function ResetAuthRow() {
        if (!hasState([AuthState.code, AuthState.password])) {
            return null;
        }

        return (
            <Button
                fullWidth
                variant="transparent"
                mt="xs"
                onClick={async () => {
                    await removeCache(Constants.AUTH_STATE_NUMBER_KEY);
                    window.location.reload();
                }}
            >
                {t('auth_page.reset_auth_button')}
            </Button>
        );
    }

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

            {NumberInputRow()}
            {CodeInputRow()}
            {PasswordInputRow()}

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

            {WarningCodeRow()}
            {ResetAuthRow()}

            {state === AuthState.number && (
                <>
                    <Divider my="sm" />

                    <UnstyledButton className={menuClasses.link} component="a" href={getDocLink('')} target="_blank">
                        <IconBook2 className={menuClasses.linkIcon} stroke={1.5} />
                        <span>{t('menu.documentation')}</span>
                    </UnstyledButton>

                    <UnstyledButton
                        className={menuClasses.link}
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
