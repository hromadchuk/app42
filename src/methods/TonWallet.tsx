import { useContext, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { Api } from 'telegram';

import { MethodContext, TDialogWithoutUser } from '../contexts/MethodContext.tsx';
import { TOwnerType } from '../lib/helpers.ts';

export const TonWallet = () => {
    const { mt, needHideContent, setFinishBlock, getDialogs } = useContext(MethodContext);

    useEffect(() => {

    }, []);

    if (needHideContent()) return null;

    return <Text>test</Text>;
};

export default TonWallet;
