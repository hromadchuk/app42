import { Notifications } from '@mantine/notifications';

// @ts-ignore
import classes from '../styles/AppNotifications.module.css';

export function AppNotifications() {
    return <Notifications position="bottom-center" className={classes.notifications} />;
}
