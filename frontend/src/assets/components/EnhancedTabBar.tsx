import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import './EnhancedTabBar.css';

// ============================================================
// TYPES - Define the structure of tabs and groups
// ============================================================

export interface Tab {
    id: number;
    title: string;
    url: string;
    favicon?: string;
    isPinned?: boolean;
    groupId?: string | null;
}

export interface TabGroup {
    id: string;
    name: string;
    color: string;
    collapsed: boolean;
}

// Linked List Node concept - each group contains tabs in order
// Operations: O(1) insert/remove at position, O(n) search

interface EnhancedTabBarProps {
    tabs: Tab[];
    activeTabId: number;
    groups: TabGroup[];
    onTabSelect: (tabId: number) => void;
    onTabClose: (tabId: number) => void;
    onNewTab: () => void;
    onTabsReorder: (tabs: Tab[]) => void;
    onTabPin: (tabId: number) => void;
    onTabUnpin: (tabId: number) => void;
    onCreateGroup: (name: string, color: string, tabIds: number[]) => void;
    onAddToGroup: (tabId: number, groupId: string) => void;
    onRemoveFromGroup: (tabId: number) => void;
    onToggleGroupCollapse: (groupId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onRenameGroup: (groupId: string, name: string) => void;
}

// Available group colors
const GROUP_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
];

// ============================================================
// CONTEXT MENU COMPONENT
// ============================================================

interface ContextMenuProps {
    x: number;
    y: number;
    tab: Tab;
    groups: TabGroup[];
    onClose: () => void;
    onPin: () => void;
    onUnpin: () => void;
    onCloseTab: () => void;
    onCloseOtherTabs: () => void;
    onCloseTabsToRight: () => void;
    onDuplicateTab: () => void;
    onCreateGroup: () => void;
    onAddToGroup: (groupId: string) => void;
    onRemoveFromGroup: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    x, y, tab, groups, onClose, onPin, onUnpin, onCloseTab,
    onCloseOtherTabs, onCloseTabsToRight, onDuplicateTab,
    onCreateGroup, onAddToGroup, onRemoveFromGroup
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position if menu would overflow
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - 300);

    return (
        <motion.div
            ref={menuRef}
            className="tab-context-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: adjustedX, top: adjustedY }}
        >
            {/* Pin/Unpin */}
            {tab.isPinned ? (
                <button onClick={onUnpin}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Unpin tab
                </button>
            ) : (
                <button onClick={onPin}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" />
                    </svg>
                    Pin tab
                </button>
            )}

            <div className="menu-separator" />

            {/* Tab Group Options */}
            {tab.groupId ? (
                <button onClick={onRemoveFromGroup}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Remove from group
                </button>
            ) : (
                <>
                    <button onClick={onCreateGroup}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add tab to new group
                    </button>
                    {groups.length > 0 && (
                        <div className="submenu">
                            <button className="submenu-trigger">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M22 19V9a2 2 0 00-2-2h-8l-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2z" strokeWidth="2" />
                                </svg>
                                Add to existing group
                                <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <div className="submenu-content">
                                {groups.map(group => (
                                    <button key={group.id} onClick={() => onAddToGroup(group.id)}>
                                        <span className="group-color-dot" style={{ backgroundColor: group.color }} />
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="menu-separator" />

            {/* Tab Actions */}
            <button onClick={onDuplicateTab}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
                    <path d="M5 15V5a2 2 0 012-2h10" strokeWidth="2" />
                </svg>
                Duplicate tab
            </button>

            <div className="menu-separator" />

            <button onClick={onCloseTab}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Close
            </button>
            <button onClick={onCloseOtherTabs}>
                Close other tabs
            </button>
            <button onClick={onCloseTabsToRight}>
                Close tabs to the right
            </button>
        </motion.div>
    );
};

// ============================================================
// CREATE GROUP MODAL
// ============================================================

interface CreateGroupModalProps {
    onClose: () => void;
    onCreate: (name: string, color: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(GROUP_COLORS[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), color);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="create-group-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <h3>Create Tab Group</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Work, Research"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-picker">
                            {GROUP_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={!name.trim()}>
                            Create Group
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// TAB GROUP HEADER COMPONENT
// ============================================================

interface GroupHeaderProps {
    group: TabGroup;
    tabCount: number;
    onToggleCollapse: () => void;
    onRename: (name: string) => void;
    onDelete: () => void;
    onUngroup: () => void;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
    group, tabCount, onToggleCollapse, onRename, onDelete: _onDelete, onUngroup
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSubmit = () => {
        if (editName.trim() && editName !== group.name) {
            onRename(editName.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            className={`group-header ${group.collapsed ? 'collapsed' : ''}`}
            style={{ '--group-color': group.color } as React.CSSProperties}
        >
            <button className="group-toggle" onClick={onToggleCollapse}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d={group.collapsed ? "M9 18l6-6-6-6" : "M19 9l-7 7-7-7"} strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {isEditing ? (
                <input
                    ref={inputRef}
                    className="group-name-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleSubmit();
                        if (e.key === 'Escape') setIsEditing(false);
                    }}
                />
            ) : (
                <span
                    className="group-name"
                    onDoubleClick={() => setIsEditing(true)}
                    title="Double-click to rename"
                >
                    {group.name}
                </span>
            )}

            <span className="group-count">{tabCount}</span>

            <div className="group-actions">
                <button onClick={onUngroup} title="Ungroup tabs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ============================================================
// MAIN ENHANCED TAB BAR COMPONENT
// ============================================================

export const EnhancedTabBar: React.FC<EnhancedTabBarProps> = ({
    tabs,
    activeTabId,
    groups,
    onTabSelect,
    onTabClose,
    onNewTab,
    onTabsReorder,
    onTabPin,
    onTabUnpin,
    onCreateGroup,
    onAddToGroup,
    onRemoveFromGroup,
    onToggleGroupCollapse,
    onDeleteGroup,
    onRenameGroup,
}) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tab: Tab } | null>(null);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [pendingGroupTab, setPendingGroupTab] = useState<number | null>(null);

    // Separate pinned and regular tabs
    const pinnedTabs = tabs.filter(t => t.isPinned);
    const regularTabs = tabs.filter(t => !t.isPinned);

    // Group tabs by their groupId
    const groupedTabs = groups.map(group => ({
        group,
        tabs: regularTabs.filter(t => t.groupId === group.id)
    }));
    const ungroupedTabs = regularTabs.filter(t => !t.groupId);

    const handleContextMenu = useCallback((e: React.MouseEvent, tab: Tab) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tab });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleCreateGroup = useCallback((name: string, color: string) => {
        if (pendingGroupTab) {
            onCreateGroup(name, color, [pendingGroupTab]);
            setPendingGroupTab(null);
        }
        setShowCreateGroupModal(false);
    }, [pendingGroupTab, onCreateGroup]);

    const handleReorder = useCallback((newOrder: Tab[]) => {
        // Maintain pinned tabs at start
        onTabsReorder([...pinnedTabs, ...newOrder]);
    }, [pinnedTabs, onTabsReorder]);

    // Render a single tab
    const renderTab = (tab: Tab) => (
        <motion.div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab)}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            <div className="tab-content">
                {tab.favicon ? (
                    <img src={tab.favicon} alt="" className="tab-favicon" />
                ) : (
                    <svg className="tab-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                )}
                {!tab.isPinned && (
                    <span className="tab-title">{tab.title || 'New Tab'}</span>
                )}
            </div>
            {!tab.isPinned && (
                <button
                    className="tab-close"
                    onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                    }}
                    aria-label="Close tab"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            )}
            {tab.isPinned && (
                <div className="pin-indicator" title="Pinned">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="4" />
                    </svg>
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="enhanced-tab-bar">
            {/* Pinned Tabs Section */}
            {pinnedTabs.length > 0 && (
                <div className="pinned-section">
                    <AnimatePresence mode="popLayout">
                        {pinnedTabs.map(renderTab)}
                    </AnimatePresence>
                    <div className="section-divider" />
                </div>
            )}

            {/* Tab Groups & Regular Tabs */}
            <div className="tabs-section">
                {/* Grouped Tabs */}
                {groupedTabs.map(({ group, tabs: groupTabs }) => (
                    groupTabs.length > 0 && (
                        <div key={group.id} className="tab-group" style={{ '--group-color': group.color } as React.CSSProperties}>
                            <GroupHeader
                                group={group}
                                tabCount={groupTabs.length}
                                onToggleCollapse={() => onToggleGroupCollapse(group.id)}
                                onRename={(name) => onRenameGroup(group.id, name)}
                                onDelete={() => onDeleteGroup(group.id)}
                                onUngroup={() => {
                                    groupTabs.forEach(t => onRemoveFromGroup(t.id));
                                    onDeleteGroup(group.id);
                                }}
                            />
                            {!group.collapsed && (
                                <div className="group-tabs">
                                    <AnimatePresence mode="popLayout">
                                        {groupTabs.map(renderTab)}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )
                ))}

                {/* Ungrouped Tabs with Reorder */}
                <Reorder.Group
                    axis="x"
                    values={ungroupedTabs}
                    onReorder={handleReorder}
                    className="ungrouped-tabs"
                >
                    <AnimatePresence mode="popLayout">
                        {ungroupedTabs.map((tab) => (
                            <Reorder.Item
                                key={tab.id}
                                value={tab}
                                className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                                onClick={() => onTabSelect(tab.id)}
                                onContextMenu={(e) => handleContextMenu(e, tab)}
                                whileHover={{ scale: 1.02 }}
                                whileDrag={{ scale: 1.05, zIndex: 10 }}
                            >
                                <div className="tab-content">
                                    {tab.favicon ? (
                                        <img src={tab.favicon} alt="" className="tab-favicon" />
                                    ) : (
                                        <svg className="tab-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        </svg>
                                    )}
                                    <span className="tab-title">{tab.title || 'New Tab'}</span>
                                </div>
                                <button
                                    className="tab-close"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTabClose(tab.id);
                                    }}
                                    aria-label="Close tab"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </div>

            {/* New Tab Button */}
            <button className="new-tab-button" onClick={onNewTab} aria-label="New tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        tab={contextMenu.tab}
                        groups={groups}
                        onClose={closeContextMenu}
                        onPin={() => {
                            onTabPin(contextMenu.tab.id);
                            closeContextMenu();
                        }}
                        onUnpin={() => {
                            onTabUnpin(contextMenu.tab.id);
                            closeContextMenu();
                        }}
                        onCloseTab={() => {
                            onTabClose(contextMenu.tab.id);
                            closeContextMenu();
                        }}
                        onCloseOtherTabs={() => {
                            tabs.filter(t => t.id !== contextMenu.tab.id).forEach(t => onTabClose(t.id));
                            closeContextMenu();
                        }}
                        onCloseTabsToRight={() => {
                            const idx = tabs.findIndex(t => t.id === contextMenu.tab.id);
                            tabs.slice(idx + 1).forEach(t => onTabClose(t.id));
                            closeContextMenu();
                        }}
                        onDuplicateTab={() => {
                            // This would need to be implemented in App.tsx
                            closeContextMenu();
                        }}
                        onCreateGroup={() => {
                            setPendingGroupTab(contextMenu.tab.id);
                            setShowCreateGroupModal(true);
                            closeContextMenu();
                        }}
                        onAddToGroup={(groupId) => {
                            onAddToGroup(contextMenu.tab.id, groupId);
                            closeContextMenu();
                        }}
                        onRemoveFromGroup={() => {
                            onRemoveFromGroup(contextMenu.tab.id);
                            closeContextMenu();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateGroupModal && (
                    <CreateGroupModal
                        onClose={() => {
                            setShowCreateGroupModal(false);
                            setPendingGroupTab(null);
                        }}
                        onCreate={handleCreateGroup}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EnhancedTabBar;
