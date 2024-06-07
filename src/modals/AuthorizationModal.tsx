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
import { useCloudStorage } from '@tma.js/sdk-react';
import { Api } from 'telegram';
import { computeCheck } from 'telegram/Password';
import { WrappedCell } from '../components/Helpers.tsx';
import { getCache, removeCache, setCache } from '../lib/cache.ts';
import { CountryFlag } from '../components/CountryFlag.tsx';
import { Constants } from '../constants.ts';
import { AppContext } from '../contexts/AppContext.tsx';
import { CallAPI, encodeString, getCurrentUser, isDev, wrapCallMAMethod } from '../lib/helpers.ts';
import { getAppLangCode, t } from '../lib/lang.ts';
import { AnimatedHeader } from '../components/AnimatedHeader.tsx';

import AnimatedPhone from '../assets/animated_stickers/phone.json';
import AnimatedCloud from '../assets/animated_stickers/cloud.json';
import AnimatedMonkey from '../assets/animated_stickers/monkey.json';

import classes from '../styles/AuthorizationModal.module.css';

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

interface IAuthorizationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAuthComplete: () => void;
}

export function AuthorizationModal({ isOpen, onOpenChange, onAuthComplete }: IAuthorizationModalProps) {
    const { user, setUser, initData, isUserChecked } = useContext(AppContext);

    const storage = useCloudStorage();

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
            if (!initData) {
                return;
            }

            const authStateNumber = (await getCache(Constants.AUTH_STATE_NUMBER_KEY)) as IAuthStateNumber;
            console.log('Auth.authStateNumber', authStateNumber);
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
                onOpenChange(true);
            }
        })();
    }, [initData, isUserChecked]);

    useEffect(() => {
        if (isOpen && user) {
            onAuthComplete();
            onOpenChange(false);
        }
    }, [isOpen, user]);

    async function checkCurrentSession() {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            setUser(currentUser as Api.User);
            setButtonLoading(false);
            setWaitingPassword(false);
            setWaitingCode(false);
            onOpenChange(false);
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
        return [...document.getElementsByClassName('smsCode')].map((el) => el.value).join('');
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

        e.currentTarget.value = String(isCorrectValue ? inputEvent.data : '');

        const nextElement = e.currentTarget.nextElementSibling as HTMLInputElement;
        if (nextElement && isCorrectValue) {
            nextElement.focus();
        }
    }

    async function save() {
        if (isDev) {
            await setCache(
                Constants.SESSION_KEY,
                encodeString(`${window.TelegramClient.session.save()}`, initData?.storageHash || ''),
                60 * 24 * 365
            );
        } else {
            await wrapCallMAMethod(() => {
                storage.set(
                    Constants.SESSION_KEY,
                    encodeString(`${window.TelegramClient.session.save()}`, initData?.storageHash || '')
                );
            });
        }
    }

    const selectedCountry = getSelectCountry();

    return (
        <div>
            {isOpen && (
                <>
                    <Modal header={<ModalHeader />} open={isOpen} onOpenChange={onOpenChange}>
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
                                    status={numberError ? 'error' : 'default'}
                                    header={numberError}
                                    before={`+${selectedCountry.prefix}`}
                                    placeholder={selectedCountry.pattern}
                                    onChange={(e) => setNumber(e.currentTarget.value)}
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
                    </Modal>

                    {(isWaitingCode || isWaitingPassword) && (
                        <Modal
                            header={<ModalHeader>Authorization</ModalHeader>}
                            open={isWaitingCode}
                            onOpenChange={(open) => !open && setWaitingCode(false)}
                        >
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
                                                    autoFocus={key === 0}
                                                    className="smsCode"
                                                    type="num"
                                                    key={key}
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
                        </Modal>
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
            )}
        </div>
    );
}
