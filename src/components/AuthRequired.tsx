import { JSX, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext.tsx';

interface IAuthRequired {
    page: JSX.Element;
}

export default function AuthRequired({ page }: IAuthRequired) {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate(`/?to=${location.pathname}`);
        }
    }, []);

    if (!user) {
        return null;
    }

    return page;
}
