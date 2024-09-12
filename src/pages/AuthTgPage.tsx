import { FormEvent, useContext, useEffect, useState } from 'react';
import {
    Button,
    Caption,
    Divider,
    Input,
    List,
    Modal,
    Placeholder,
    Section,
    Spinner
} from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { IconSearch } from '@tabler/icons-react';
import { useCloudStorage } from '@telegram-apps/sdk-react';
import { useNavigate } from 'react-router-dom';
import { Api } from 'telegram';
import { computeCheck } from 'telegram/Password';
import { WrappedCell } from '../components/Helpers.tsx';
import { getCache, removeCache, setCache } from '../lib/cache.ts';
import { CountryFlag } from '../components/CountryFlag.tsx';
import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { CallAPI, classNames, getCurrentUser } from '../lib/helpers.ts';
import { getAppLangCode, t } from '../lib/lang.ts';
import { AnimatedHeader } from '../components/AnimatedHeader.tsx';
import { encodeString, isDev, wrapCallMAMethod } from '../lib/utils.ts';

import AnimatedPhone from '../assets/animated_stickers/phone.json';
import AnimatedCloud from '../assets/animated_stickers/cloud.json';
import AnimatedMonkey from '../assets/animated_stickers/monkey.json';

import classes from '../styles/AuthorizationPage.module.css';
import commonClasses from '../styles/Common.module.css';

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

export default function AuthTgPage() {
    const { user, setUser, isUserChecked } = useContext(AppContext);

    const storage = useCloudStorage();
    const navigate = useNavigate();

    const [isSelectingCountry, setSelectingCountry] = useState<boolean>(false);
    const [isWaitingCode, setWaitingCode] = useState<boolean>(false);
    const [isWaitingPassword, setWaitingPassword] = useState<boolean>(false);

    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
    const [searchCountry, setSearchCountry] = useState('');
    const [inputCountries, setInputCountries] = useState<IInputCountry[]>([]);

    const [dataLogin, setDataLogin] = useState<Api.account.Password | null>(null);
    const [isButtonLoading, setButtonLoading] = useState(false);

    const [number, setNumber] = useState('');
    const [numberError, setNumberError] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');

    const [codeLength, setCodeLength] = useState(5);
    const [codeError, setCodeError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        (async () => {
            const authStateNumber = (await getCache(Constants.AUTH_STATE_NUMBER_KEY)) as IAuthStateNumber;
            if (authStateNumber || (isUserChecked && !user)) {
                await getAuthData();
            }

            if (authStateNumber) {
                setSelectedCountryCode(authStateNumber.countryCode);
                setPhoneCodeHash(authStateNumber.phoneCodeHash);
                setCodeLength(authStateNumber.phoneCode);
                setNumber(authStateNumber.numberSuffix);
                setWaitingCode(true);
                setButtonLoading(false);
            }
        })();
    }, [isUserChecked]);

    useEffect(() => {
        if (user) {
            onAuthComplete();
        }
    }, [user]);

    function onAuthComplete() {
        getCache(Constants.AUTH_STATE_METHOD_KEY).then((value) => {
            if (value) {
                const { methodPath } = value as { methodPath: string };

                window.alreadyVisitedRefLink = true;
                navigate(methodPath);
                removeCache(Constants.AUTH_STATE_METHOD_KEY);
            }
        });
    }

    async function checkCurrentSession() {
        const currentUser = await getCurrentUser();
        if (currentUser instanceof Api.User) {
            setUser(currentUser);
            setButtonLoading(false);
            setWaitingPassword(false);
            setWaitingCode(false);
            onAuthComplete();
        } else {
            await getAuthData();
            setButtonLoading(false);
        }
    }

    async function getAuthData() {
        const config = await CallAPI(new Api.help.GetNearestDc());
        setSelectedCountryCode(config.country);

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
        setButtonLoading(true);
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
            await save();

            setPhoneCodeHash(phoneCodeHashResult);
            setCodeLength(phoneCodeLengthResult);
            setWaitingCode(true);
        } catch (error) {
            // @ts-ignore
            setNumberError(error?.message);
        }

        setButtonLoading(false);
    }

    async function confirmCode() {
        setButtonLoading(true);
        setCodeError('');

        const country = getSelectCountry();
        const phoneNumber = `+${country.prefix}${number}`.replace(/\s/g, '');

        try {
            await CallAPI(
                new Api.auth.SignIn({
                    phoneNumber,
                    phoneCodeHash,
                    phoneCode: getCode()
                }),
                { hideErrorAlert: true }
            );

            await save();
            await checkCurrentSession();
        } catch (error) {
            // @ts-ignore
            if (error?.message.includes('SESSION_PASSWORD_NEEDED')) {
                setDataLogin(await CallAPI(new Api.account.GetPassword()));
                setWaitingPassword(true);
                setButtonLoading(false);
            } else {
                // @ts-ignore
                setCodeError(error.message);
            }
        }

        await removeCache(Constants.AUTH_STATE_NUMBER_KEY);

        setButtonLoading(false);
    }

    async function confirmPassword() {
        setButtonLoading(true);
        setPasswordError('');

        if (!dataLogin) {
            return;
        }

        try {
            await CallAPI(new Api.auth.CheckPassword({ password: await computeCheck(dataLogin, password) }), {
                hideErrorAlert: true
            });

            await save();
            await checkCurrentSession();
        } catch (error) {
            // @ts-ignore
            setPasswordError(error.message);
        }

        setButtonLoading(false);
    }

    function getCode() {
        // @ts-ignore
        return [...document.getElementsByClassName(classes.pinInput)].map((el) => el.value).join('');
    }

    function getSelectCountry(): IInputCountry {
        if (selectedCountryCode) {
            return inputCountries.find((findCountry) => findCountry.code === selectedCountryCode) as IInputCountry;
        }

        return inputCountries[0];
    }

    function onCodeChange(e: FormEvent<HTMLInputElement>) {
        const inputEvent = e.nativeEvent as InputEvent;
        const isCorrectValue = Boolean((inputEvent.data || '').match(/[0-9]/));
        // @ts-ignore
        const key = e.target.dataset.key as string;

        e.currentTarget.value = String(isCorrectValue ? inputEvent.data : '');

        const nextElement = e.currentTarget.nextElementSibling as HTMLInputElement;
        if (nextElement && isCorrectValue) {
            nextElement.focus();
        }

        if (Number(key) === codeLength && isCorrectValue) {
            setTimeout(() => confirmCode());
        }
    }

    async function save() {
        if (isDev) {
            await setCache(
                Constants.SESSION_KEY,
                encodeString(`${window.TelegramClient.session.save()}`, window.initData.storageHash),
                60 * 24 * 365
            );
        } else {
            await wrapCallMAMethod(() => {
                storage.set(
                    Constants.SESSION_KEY,
                    encodeString(`${window.TelegramClient.session.save()}`, window.initData.storageHash)
                );
            });
        }
    }

    const selectedCountry = getSelectCountry();

    if (isWaitingCode || isWaitingPassword) {
        return (
            <div style={{ padding: '32px 16px' }}>
                {isWaitingCode && !isWaitingPassword && (
                    <>
                        <AnimatedHeader
                            animationData={AnimatedCloud}
                            title={t('auth_modal.code_title')}
                            subtitle={t('auth_modal.code_description')}
                        />

                        <Button
                            mode="plain"
                            size="s"
                            stretched
                            Component="a"
                            href="https://t.me/+42777"
                            target="_blank"
                        >
                            {t('auth_modal.code_account_button')}
                        </Button>

                        <form
                            className={classes.codeSection}
                            style={{
                                color: 'var(--tgui--text_color)',
                                marginBottom: codeError ? 20 : 50
                            }}
                        >
                            {new Array(codeLength).fill(0).map((_, key) => (
                                <input
                                    key={key}
                                    data-key={key + 1}
                                    autoFocus={key === 0}
                                    className={classNames(classes.pinInput, commonClasses.fixInput)}
                                    type="num"
                                    inputMode="numeric"
                                    onChange={onCodeChange}
                                />
                            ))}
                        </form>

                        {Boolean(codeError) && (
                            <Caption
                                level="1"
                                weight="1"
                                style={{
                                    color: 'var(--tgui--destructive_text_color)',
                                    display: 'block',
                                    textAlign: 'center',
                                    marginBottom: 20
                                }}
                            >
                                {codeError}
                            </Caption>
                        )}

                        <Button
                            size="l"
                            stretched
                            onClick={confirmCode}
                            disabled={isButtonLoading}
                            loading={isButtonLoading}
                        >
                            {t('auth_modal.button_confirm_code')}
                        </Button>
                    </>
                )}

                {isWaitingPassword && (
                    <>
                        <AnimatedHeader
                            animationData={AnimatedMonkey}
                            title={t('auth_modal.password_title')}
                            subtitle={t('auth_modal.password_description')}
                        />

                        <Input
                            type="password"
                            value={password}
                            status={passwordError ? 'error' : 'default'}
                            header={passwordError}
                            className={commonClasses.fixInput}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                        />

                        <Button
                            stretched
                            size="l"
                            disabled={isButtonLoading}
                            loading={isButtonLoading}
                            onClick={confirmPassword}
                        >
                            {t('auth_modal.button_confirm_password')}
                        </Button>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            {!selectedCountry ? (
                <Placeholder>
                    <Spinner size="m" />
                </Placeholder>
            ) : (
                <List style={{ padding: 16, paddingBottom: 32 }}>
                    <AnimatedHeader
                        animationData={AnimatedPhone}
                        title={t('auth_modal.phone_title')}
                        subtitle={t('auth_modal.description')}
                    />

                    <WrappedCell
                        before={<CountryFlag code={selectedCountry.code} size={30} />}
                        onClick={() => setSelectingCountry(true)}
                    >
                        {selectedCountry.name}
                    </WrappedCell>

                    <Divider style={{ margin: 0 }} />

                    <Input
                        type="num"
                        inputMode="numeric"
                        status={numberError ? 'error' : 'default'}
                        header={numberError}
                        before={`+${selectedCountry.prefix}`}
                        placeholder={selectedCountry.pattern}
                        onChange={(e) => setNumber(e.currentTarget.value)}
                        className={commonClasses.fixInput}
                    />

                    <Button
                        size="l"
                        stretched
                        onClick={confirmNumber}
                        disabled={isButtonLoading}
                        loading={isButtonLoading}
                    >
                        {t('auth_modal.button_send_code')}
                    </Button>
                </List>
            )}

            {isSelectingCountry && (
                <Modal
                    header={<ModalHeader>Countries</ModalHeader>}
                    open={isSelectingCountry}
                    onOpenChange={(open) => !open && setSelectingCountry(false)}
                >
                    <List>
                        <Input
                            before={<IconSearch opacity={0.3} />}
                            size={28}
                            placeholder={t('auth_modal.search_placeholder')}
                            onChange={(e) => setSearchCountry(e.target.value)}
                            className={commonClasses.fixInput}
                        />

                        <Divider />

                        <Section>
                            {inputCountries
                                .filter((item) => {
                                    if (!searchCountry) {
                                        return true;
                                    }

                                    if (String(item.prefix).includes(searchCountry)) {
                                        return true;
                                    }

                                    return item.name.toLowerCase().includes(searchCountry.toLowerCase());
                                })
                                .map((country, key) => (
                                    <WrappedCell
                                        key={key}
                                        before={<CountryFlag code={country.code} size={28} />}
                                        after={`+${country.prefix}`}
                                        onClick={() => {
                                            setSelectedCountryCode(country.code);
                                            setSelectingCountry(false);
                                            setSearchCountry('');
                                        }}
                                    >
                                        {country.name}
                                    </WrappedCell>
                                ))}
                        </Section>
                    </List>
                </Modal>
            )}
        </>
    );
}
