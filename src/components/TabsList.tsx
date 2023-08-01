import { JSX, useRef } from 'react';
import { ScrollArea, Tabs } from '@mantine/core';
import { TablerIconsProps } from '@tabler/icons-react';

export interface ITabItem {
    id: string;
    name: string;
    icon: (props: TablerIconsProps) => JSX.Element;
}

export interface ITabsList {
    tabs: ITabItem[];
    onChange: (tabId: string) => void;
}

export function TabsList({ tabs, onChange }: ITabsList) {
    const defaultTabId = tabs[0].id;
    const viewportRef = useRef<HTMLDivElement>(null);

    const handleTabChange = (tabId: string) => {
        onChange(tabId);

        setTimeout(() => {
            const scrollArea = viewportRef.current as HTMLDivElement;
            const activeTab = scrollArea.querySelector('[data-active="true"]') as HTMLDivElement;
            const scrollOffset = activeTab.offsetLeft - scrollArea.offsetWidth / 2 + activeTab.offsetWidth / 2;

            scrollArea.scrollTo({ left: scrollOffset, behavior: 'smooth' });
        });
    };

    return (
        <ScrollArea type="never" viewportRef={viewportRef} mb="xs">
            <Tabs defaultValue={defaultTabId} onTabChange={handleTabChange} w={'max-content'}>
                <Tabs.List>
                    {tabs.map((tab) => (
                        <Tabs.Tab key={tab.id} icon={<tab.icon size={14} />} value={tab.id}>
                            {tab.name}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>
        </ScrollArea>
    );
}
