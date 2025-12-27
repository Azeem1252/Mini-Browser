import { useState, useCallback, useRef } from 'react';
import type { TabInfo, TabGroup, TabGroupColor } from '../types';

interface UseTabsOptions {
    maxTabs?: number;
    onTabCreate?: (tab: TabInfo) => void;
    onTabClose?: (tabId: number) => void;
    onTabSwitch?: (tabId: number) => void;
}

interface UseTabsReturn {
    tabs: TabInfo[];
    activeTabId: number;
    activeTab: TabInfo | undefined;
    tabGroups: TabGroup[];
    
    // Tab operations
    createTab: (url?: string, options?: Partial<TabInfo>) => TabInfo;
    closeTab: (tabId: number) => void;
    switchTab: (tabId: number) => void;
    updateTab: (tabId: number, updates: Partial<TabInfo>) => void;
    duplicateTab: (tabId: number) => TabInfo | null;
    pinTab: (tabId: number) => void;
    unpinTab: (tabId: number) => void;
    muteTab: (tabId: number) => void;
    unmuteTab: (tabId: number) => void;
    moveTab: (tabId: number, newIndex: number) => void;
    
    // Tab group operations
    createGroup: (name: string, color: TabGroupColor, tabIds: number[]) => TabGroup;
    addToGroup: (tabId: number, groupId: string) => void;
    removeFromGroup: (tabId: number) => void;
    renameGroup: (groupId: string, name: string) => void;
    changeGroupColor: (groupId: string, color: TabGroupColor) => void;
    toggleGroupCollapse: (groupId: string) => void;
    deleteGroup: (groupId: string, closeTabs?: boolean) => void;
    
    // Bulk operations
    closeAllTabs: () => void;
    closeOtherTabs: (exceptTabId: number) => void;
    closeTabsToRight: (tabId: number) => void;
    closeTabsToLeft: (tabId: number) => void;
    
    // History
    closedTabs: TabInfo[];
    reopenClosedTab: () => TabInfo | null;
}

const DEFAULT_TAB: Omit<TabInfo, 'id'> = {
    title: 'New Tab',
    url: 'about:blank',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isPinned: false,
    isMuted: false,
    lastAccessed: Date.now(),
};

/**
 * Custom hook for comprehensive tab management
 * Supports tab groups, pinned tabs, and tab history
 */
export function useTabs(options: UseTabsOptions = {}): UseTabsReturn {
    const { maxTabs = 100, onTabCreate, onTabClose, onTabSwitch } = options;
    
    const nextIdRef = useRef(1);
    const [tabs, setTabs] = useState<TabInfo[]>(() => [{
        ...DEFAULT_TAB,
        id: nextIdRef.current++,
    }]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
    const [closedTabs, setClosedTabs] = useState<TabInfo[]>([]);

    const activeTab = tabs.find(tab => tab.id === activeTabId);

    // Create a new tab
    const createTab = useCallback((url?: string, tabOptions?: Partial<TabInfo>): TabInfo => {
        if (tabs.length >= maxTabs) {
            console.warn(`Maximum number of tabs (${maxTabs}) reached`);
            return tabs[tabs.length - 1];
        }

        const newTab: TabInfo = {
            ...DEFAULT_TAB,
            ...tabOptions,
            id: nextIdRef.current++,
            url: url || 'about:blank',
            lastAccessed: Date.now(),
        };

        setTabs(prev => {
            // Insert after pinned tabs
            const pinnedCount = prev.filter(t => t.isPinned).length;
            const newTabs = [...prev];
            newTabs.splice(pinnedCount, 0, newTab);
            return newTabs;
        });
        
        setActiveTabId(newTab.id);
        onTabCreate?.(newTab);
        
        return newTab;
    }, [tabs.length, maxTabs, onTabCreate]);

    // Close a tab
    const closeTab = useCallback((tabId: number) => {
        setTabs(prev => {
            if (prev.length === 1) {
                // Reset the last tab instead of closing
                return [{
                    ...DEFAULT_TAB,
                    id: prev[0].id,
                }];
            }

            const tabToClose = prev.find(t => t.id === tabId);
            if (tabToClose) {
                // Add to closed tabs history
                setClosedTabs(closed => [tabToClose, ...closed].slice(0, 25));
            }

            const tabIndex = prev.findIndex(t => t.id === tabId);
            const newTabs = prev.filter(t => t.id !== tabId);

            // Update active tab if closing the active one
            if (activeTabId === tabId) {
                const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
                setActiveTabId(newTabs[newActiveIndex].id);
            }

            onTabClose?.(tabId);
            return newTabs;
        });
    }, [activeTabId, onTabClose]);

    // Switch to a tab
    const switchTab = useCallback((tabId: number) => {
        setActiveTabId(tabId);
        setTabs(prev =>
            prev.map(tab =>
                tab.id === tabId ? { ...tab, lastAccessed: Date.now() } : tab
            )
        );
        onTabSwitch?.(tabId);
    }, [onTabSwitch]);

    // Update tab properties
    const updateTab = useCallback((tabId: number, updates: Partial<TabInfo>) => {
        setTabs(prev =>
            prev.map(tab =>
                tab.id === tabId ? { ...tab, ...updates } : tab
            )
        );
    }, []);

    // Duplicate a tab
    const duplicateTab = useCallback((tabId: number): TabInfo | null => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return null;
        
        return createTab(tab.url, {
            title: tab.title,
            favicon: tab.favicon,
            content: tab.content,
        });
    }, [tabs, createTab]);

    // Pin/Unpin tabs
    const pinTab = useCallback((tabId: number) => {
        setTabs(prev => {
            const tabIndex = prev.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return prev;

            const tab = { ...prev[tabIndex], isPinned: true };
            const newTabs = prev.filter(t => t.id !== tabId);
            
            // Move to end of pinned tabs
            const lastPinnedIndex = newTabs.filter(t => t.isPinned).length;
            newTabs.splice(lastPinnedIndex, 0, tab);
            
            return newTabs;
        });
    }, []);

    const unpinTab = useCallback((tabId: number) => {
        setTabs(prev => {
            const tabIndex = prev.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return prev;

            const tab = { ...prev[tabIndex], isPinned: false };
            const newTabs = prev.filter(t => t.id !== tabId);
            
            // Move to start of unpinned tabs
            const pinnedCount = newTabs.filter(t => t.isPinned).length;
            newTabs.splice(pinnedCount, 0, tab);
            
            return newTabs;
        });
    }, []);

    // Mute/Unmute tabs
    const muteTab = useCallback((tabId: number) => {
        updateTab(tabId, { isMuted: true });
    }, [updateTab]);

    const unmuteTab = useCallback((tabId: number) => {
        updateTab(tabId, { isMuted: false });
    }, [updateTab]);

    // Move tab to new position
    const moveTab = useCallback((tabId: number, newIndex: number) => {
        setTabs(prev => {
            const tabIndex = prev.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return prev;

            const tab = prev[tabIndex];
            const newTabs = prev.filter(t => t.id !== tabId);
            
            // Ensure pinned tabs stay at the beginning
            const minIndex = tab.isPinned ? 0 : newTabs.filter(t => t.isPinned).length;
            const maxIndex = tab.isPinned ? newTabs.filter(t => t.isPinned).length : newTabs.length;
            const clampedIndex = Math.max(minIndex, Math.min(maxIndex, newIndex));
            
            newTabs.splice(clampedIndex, 0, tab);
            return newTabs;
        });
    }, []);

    // Tab group operations
    const createGroup = useCallback((name: string, color: TabGroupColor, tabIds: number[]): TabGroup => {
        const group: TabGroup = {
            id: `group-${Date.now()}`,
            name,
            color,
            collapsed: false,
            tabIds,
        };

        setTabGroups(prev => [...prev, group]);
        
        // Update tabs with group ID
        tabIds.forEach(tabId => {
            updateTab(tabId, { groupId: group.id });
        });

        return group;
    }, [updateTab]);

    const addToGroup = useCallback((tabId: number, groupId: string) => {
        setTabGroups(prev =>
            prev.map(group =>
                group.id === groupId && !group.tabIds.includes(tabId)
                    ? { ...group, tabIds: [...group.tabIds, tabId] }
                    : group
            )
        );
        updateTab(tabId, { groupId });
    }, [updateTab]);

    const removeFromGroup = useCallback((tabId: number) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab?.groupId) return;

        setTabGroups(prev =>
            prev.map(group =>
                group.id === tab.groupId
                    ? { ...group, tabIds: group.tabIds.filter(id => id !== tabId) }
                    : group
            )
        );
        updateTab(tabId, { groupId: undefined });
    }, [tabs, updateTab]);

    const renameGroup = useCallback((groupId: string, name: string) => {
        setTabGroups(prev =>
            prev.map(group =>
                group.id === groupId ? { ...group, name } : group
            )
        );
    }, []);

    const changeGroupColor = useCallback((groupId: string, color: TabGroupColor) => {
        setTabGroups(prev =>
            prev.map(group =>
                group.id === groupId ? { ...group, color } : group
            )
        );
    }, []);

    const toggleGroupCollapse = useCallback((groupId: string) => {
        setTabGroups(prev =>
            prev.map(group =>
                group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
            )
        );
    }, []);

    const deleteGroup = useCallback((groupId: string, closeTabs = false) => {
        const group = tabGroups.find(g => g.id === groupId);
        if (!group) return;

        if (closeTabs) {
            group.tabIds.forEach(tabId => closeTab(tabId));
        } else {
            group.tabIds.forEach(tabId => {
                updateTab(tabId, { groupId: undefined });
            });
        }

        setTabGroups(prev => prev.filter(g => g.id !== groupId));
    }, [tabGroups, closeTab, updateTab]);

    // Bulk operations
    const closeAllTabs = useCallback(() => {
        setClosedTabs(prev => [...tabs, ...prev].slice(0, 25));
        setTabs([{ ...DEFAULT_TAB, id: nextIdRef.current++ }]);
        setActiveTabId(tabs[0].id);
    }, [tabs]);

    const closeOtherTabs = useCallback((exceptTabId: number) => {
        const tabsToClose = tabs.filter(t => t.id !== exceptTabId && !t.isPinned);
        setClosedTabs(prev => [...tabsToClose, ...prev].slice(0, 25));
        setTabs(prev => prev.filter(t => t.id === exceptTabId || t.isPinned));
        setActiveTabId(exceptTabId);
    }, [tabs]);

    const closeTabsToRight = useCallback((tabId: number) => {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const tabsToClose = tabs.slice(tabIndex + 1).filter(t => !t.isPinned);
        setClosedTabs(prev => [...tabsToClose, ...prev].slice(0, 25));
        setTabs(prev => {
            const pinnedTabs = prev.filter(t => t.isPinned);
            const unpinnedTabs = prev.filter(t => !t.isPinned);
            const unpinnedIndex = unpinnedTabs.findIndex(t => t.id === tabId);
            return [...pinnedTabs, ...unpinnedTabs.slice(0, unpinnedIndex + 1)];
        });
    }, [tabs]);

    const closeTabsToLeft = useCallback((tabId: number) => {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const pinnedCount = tabs.filter(t => t.isPinned).length;
        const tabsToClose = tabs.slice(pinnedCount, tabIndex);
        setClosedTabs(prev => [...tabsToClose, ...prev].slice(0, 25));
        setTabs(prev => {
            const pinnedTabs = prev.filter(t => t.isPinned);
            const unpinnedTabs = prev.filter(t => !t.isPinned);
            const unpinnedIndex = unpinnedTabs.findIndex(t => t.id === tabId);
            return [...pinnedTabs, ...unpinnedTabs.slice(unpinnedIndex)];
        });
    }, [tabs]);

    // Reopen closed tab
    const reopenClosedTab = useCallback((): TabInfo | null => {
        if (closedTabs.length === 0) return null;

        const [tabToReopen, ...remainingClosed] = closedTabs;
        setClosedTabs(remainingClosed);

        const reopenedTab: TabInfo = {
            ...tabToReopen,
            id: nextIdRef.current++,
            isPinned: false,
            groupId: undefined,
        };

        setTabs(prev => [...prev, reopenedTab]);
        setActiveTabId(reopenedTab.id);

        return reopenedTab;
    }, [closedTabs]);

    return {
        tabs,
        activeTabId,
        activeTab,
        tabGroups,
        createTab,
        closeTab,
        switchTab,
        updateTab,
        duplicateTab,
        pinTab,
        unpinTab,
        muteTab,
        unmuteTab,
        moveTab,
        createGroup,
        addToGroup,
        removeFromGroup,
        renameGroup,
        changeGroupColor,
        toggleGroupCollapse,
        deleteGroup,
        closeAllTabs,
        closeOtherTabs,
        closeTabsToRight,
        closeTabsToLeft,
        closedTabs,
        reopenClosedTab,
    };
}
