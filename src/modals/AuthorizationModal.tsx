import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import { Avatar, Button, Cell, Divider, Input, List, Modal, Section } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { useEffect, useState } from 'react';
// import AnimatedSticker3 from '~/assets/animatedStickers/3.json';
// import AnimatedSticker4 from '~/assets/animatedStickers/4.json';
// import AnimatedSticker5 from '~/assets/animatedStickers/5.json';
// import AnimatedHeader from "../AnimatedHeader/AnimatedHeader";

import { useThemeParams } from '@tma.js/sdk-react';
// import './AuthorizationModal.scss';

enum IAuthType {
    API,
    TON
}

interface IProps {
    authType?: IAuthType | null;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}

function AuthorizationModal(props: IProps) {
    const { authType, open, onOpenChange } = props;

    const [activeAuth, setActiveAuth] = useState<IAuthType | null>(authType ? authType : null);
    const [selectingCountry, setSelectingCountry] = useState<boolean>(false);
    const [waitingCode, setWaitingCode] = useState<boolean>(false);
    const [waitingPassword, setWaitingPassword] = useState<boolean>(false);
    const [passwordValue, setPasswordValue] = useState<string>('');

    const themeParams = useThemeParams();

    useEffect(() => {
        setSelectingCountry(false);
    }, [activeAuth]);

    function onChange(e: React.FormEvent<HTMLInputElement>) {
        if (e.currentTarget.classList.contains('last')) {
            setWaitingPassword(true);
            return;
        }

        const nextElement = e.currentTarget.nextElementSibling as HTMLInputElement;

        if (nextElement) nextElement.focus();
    }

    useEffect(() => {
        if (activeAuth === null) {
            setSelectingCountry(false);
            setWaitingCode(false);
            setWaitingPassword(false);
        }
    }, [activeAuth]);

    return (
        <div>
            {open && (
                <>
                    <Modal
                        header={<ModalHeader>Accounts</ModalHeader>}
                        open={open}
                        onOpenChange={onOpenChange && onOpenChange}
                        className="AuthorizationModal"
                    >
                        {activeAuth === null && (
                            <div style={{ paddingBottom: 16 }}>
                                {/* <Cell
                    before={<Avatar src="https://unsplash.com/photos/v2aKnjMbP_k/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzE1ODE1NDc2fA&force=true&w=640" />}
                    description="@meowmeow"
                    after={<IconTrash size={28} className="accent-color" />}
                    >
                    Andrea Harinson
                </Cell> */}
                                <Cell
                                    before={
                                        <Avatar>
                                            <IconUserPlus size={20} />
                                        </Avatar>
                                    }
                                    description="Press to log in"
                                    onClick={() => setActiveAuth(IAuthType.API)}
                                >
                                    Add new account
                                </Cell>
                                <Cell
                                    before={<Avatar src="https://ton.org/download/ton_symbol.svg" />}
                                    description="Press to log in"
                                    onClick={() => {}}
                                >
                                    TON
                                </Cell>
                            </div>
                        )}

                        {activeAuth === IAuthType.API && (
                            <List style={{ padding: 16, paddingBottom: 32 }}>
                                {/* <AnimatedHeader */}
                                {/*     animationData={AnimatedSticker3} */}
                                {/*     title="Authorization" */}
                                {/*     subtitle="To be able to work with Telegram API, you need to log in to your account. Don't worry, the data is not transferred anywhere and the session is stored on your device." */}
                                {/* /> */}

                                <Cell
                                    before={<img src={'https://flagcdn.com/ua.svg'} width={30} />}
                                    onClick={() => setSelectingCountry(true)}
                                >
                                    Ukraine
                                </Cell>
                                <Divider className="tgui-divider" style={{ margin: 0 }} />
                                <Input before="+380" placeholder="000 000 000" />

                                <Button size="l" stretched onClick={() => setWaitingCode(true)}>
                                    Next
                                </Button>
                            </List>
                        )}
                    </Modal>

                    {activeAuth !== null && (
                        <>
                            {(waitingCode || waitingPassword) && (
                                <Modal
                                    header={<ModalHeader>Authorization</ModalHeader>}
                                    open={waitingCode}
                                    onOpenChange={(open) => !open && setWaitingCode(false)}
                                    style={{ height: '100%' }}
                                    className="AuthorizationModal"
                                >
                                    <div style={{ padding: '32px 16px' }}>
                                        {waitingCode && !waitingPassword && (
                                            <>
                                                {/* <AnimatedHeader */}
                                                {/*     animationData={AnimatedSticker4} */}
                                                {/*     title="Enter a code" */}
                                                {/*     subtitle="We are send activation code. It should come to the service cacount with +42777 number" */}
                                                {/* /> */}

                                                <form
                                                    className="code-section"
                                                    style={themeParams.isDark ? { color: '#FFFFFF' } : {}}
                                                >
                                                    <input
                                                        autoFocus
                                                        type="num"
                                                        inputMode="numeric"
                                                        onChange={onChange}
                                                    />
                                                    <input type="num" inputMode="numeric" onChange={onChange} />
                                                    <input type="num" inputMode="numeric" onChange={onChange} />
                                                    <input type="num" inputMode="numeric" onChange={onChange} />
                                                    <input type="num" inputMode="numeric" onChange={onChange} />
                                                    <input
                                                        type="num"
                                                        inputMode="numeric"
                                                        onChange={onChange}
                                                        className="last"
                                                    />
                                                </form>
                                            </>
                                        )}

                                        {waitingPassword && (
                                            <>
                                                {/* <AnimatedHeader */}
                                                {/*     animationData={AnimatedSticker5} */}
                                                {/*     title="Enter a password" */}
                                                {/*     subtitle="Please enter your 2fa password" */}
                                                {/* /> */}

                                                <Input
                                                    type="password"
                                                    value={passwordValue}
                                                    onChange={(e) => setPasswordValue(e.currentTarget.value)}
                                                    className="password-input"
                                                />

                                                <Button
                                                    stretched
                                                    size="l"
                                                    disabled={passwordValue.length === 0}
                                                    onClick={() => setActiveAuth(null)}
                                                >
                                                    Continue
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Modal>
                            )}

                            {selectingCountry && (
                                <Modal
                                    header={<ModalHeader>Countries</ModalHeader>}
                                    open={selectingCountry}
                                    onOpenChange={(open) => !open && setSelectingCountry(false)}
                                    className="AuthorizationModal"
                                >
                                    <List>
                                        <Input before={<IconSearch opacity={0.5} />} size={28} placeholder="Search" />

                                        <Divider className="tgui-divider" />

                                        <Section>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ua.svg'} width={30} />}
                                                after="+380"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Ukraine
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/gb.svg'} width={30} />}
                                                after="+44"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                United Kingdom
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/us.svg'} width={30} />}
                                                after="+1"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                United States
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ad.svg'} width={30} />}
                                                after="+376"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Andorra
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ae.svg'} width={30} />}
                                                after="+971"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                United Arab Emirates
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/af.svg'} width={30} />}
                                                after="+93"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Afghanistan
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ag.svg'} width={30} />}
                                                after="+1268"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Antigua and Barbuda
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ai.svg'} width={30} />}
                                                after="+1264"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Anguilla
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/al.svg'} width={30} />}
                                                after="+355"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Albania
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/am.svg'} width={30} />}
                                                after="+374"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Armenia
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ao.svg'} width={30} />}
                                                after="+244"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Angola
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/aq.svg'} width={30} />}
                                                after="+672"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Antarctica
                                            </Cell>
                                            <Cell
                                                before={<img src={'https://flagcdn.com/ar.svg'} width={30} />}
                                                after="+54"
                                                onClick={() => setSelectingCountry(false)}
                                            >
                                                Argentina
                                            </Cell>
                                        </Section>
                                    </List>
                                </Modal>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default AuthorizationModal;
