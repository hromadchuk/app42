import { ForwardRefExoticComponent, RefAttributes, useRef, useState } from 'react';
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem';
import { Icon, IconProps } from '@tabler/icons-react';
import { classNames } from '../lib/helpers.ts';

import classes from '../styles/TabsList.module.css';

export interface ITabItem {
    id: string;
    name: string;
    icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}

export interface ITabsList {
    tabs: ITabItem[];
    onChange: (tabId: string) => void;
}

export function TabsList({ tabs, onChange }: ITabsList) {
    const defaultTabId = tabs[0].id;
    const [selectedTab, setSelectedTab] = useState<string>(defaultTabId);
    const viewportRef = useRef<HTMLDivElement>(null);

    const handleTabChange = () => {
        setTimeout(() => {
            const scrollArea = viewportRef.current as HTMLDivElement;
            const activeTab = scrollArea.querySelector('[data-active="true"]') as HTMLDivElement;
            const scrollOffset = activeTab.offsetLeft - scrollArea.offsetWidth / 2 + activeTab.offsetWidth / 2;

            scrollArea.scrollTo({ left: scrollOffset, behavior: 'smooth' });
        });
    };

    return (
        <div className={classes.block} ref={viewportRef}>
            {tabs.map((tab, key) => (
                <TabsItem
                    key={key}
                    selected={tab.id === selectedTab}
                    data-active={tab.id === selectedTab}
                    className={classNames({
                        [classes.firstButton]: key === 0,
                        [classes.lastButton]: key === tabs.length - 1,
                        [classes.selected]: tab.id === selectedTab
                    })}
                    onClick={() => {
                        onChange(tab.id);
                        setSelectedTab(tab.id);
                        handleTabChange();
                    }}
                >
                    {tab.icon ? (
                        <div className={classes.icon}>
                            <tab.icon size={14} />
                        </div>
                    ) : (
                        ''
                    )}{' '}
                    {tab.name}
                </TabsItem>
            ))}
        </div>
    );
}
