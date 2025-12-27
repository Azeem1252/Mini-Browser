import React, { useState, useEffect, useRef, useMemo } from 'react';
import './CommandPalette.css';

interface Command {
    id: string;
    title: string;
    description?: string;
    icon: string;
    action: () => void;
    category: 'navigation' | 'tabs' | 'bookmarks' | 'settings' | 'actions';
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    tabs: Array<{ id: number; title: string; url: string }>;
    onNavigateToTab: (tabId: number) => void;
    onNewTab: () => void;
    onOpenBookmarks: () => void;
    onOpenHistory: () => void;
    onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    tabs,
    onNavigateToTab,
    onNewTab,
    onOpenBookmarks,
    onOpenHistory,
    onOpenSettings,
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: Command[] = useMemo(() => [
        {
            id: 'new-tab',
            title: 'New Tab',
            description: 'Open a new tab',
            icon: '➕',
            action: () => { onNewTab(); onClose(); },
            category: 'tabs',
        },
        {
            id: 'bookmarks',
            title: 'Bookmarks',
            description: 'View all bookmarks',
            icon: '🔖',
            action: () => { onOpenBookmarks(); onClose(); },
            category: 'navigation',
        },
        {
            id: 'history',
            title: 'History',
            description: 'View browsing history',
            icon: '🕒',
            action: () => { onOpenHistory(); onClose(); },
            category: 'navigation',
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Browser settings',
            icon: '⚙️',
            action: () => { onOpenSettings(); onClose(); },
            category: 'settings',
        },
        ...tabs.map((tab) => ({
            id: `tab-${tab.id}`,
            title: tab.title || 'New Tab',
            description: tab.url,
            icon: '📄',
            action: () => { onNavigateToTab(tab.id); onClose(); },
            category: 'tabs' as const,
        })),
    ], [tabs, onNewTab, onNavigateToTab, onOpenBookmarks, onOpenHistory, onOpenSettings, onClose]);

    const filteredCommands = useMemo(() => {
        if (!query) return commands;

        const lowerQuery = query.toLowerCase();
        return commands.filter((cmd) =>
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.description?.toLowerCase().includes(lowerQuery)
        );
    }, [commands, query]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="command-palette-overlay" onClick={onClose} />
            <div className="command-palette">
                <div className="command-search">
                    <svg className="command-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="command-input"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="command-hint">Esc</kbd>
                </div>

                <div className="command-results">
                    {filteredCommands.length === 0 ? (
                        <div className="command-empty">No commands found</div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => cmd.action()}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="command-icon">{cmd.icon}</span>
                                <div className="command-content">
                                    <div className="command-title">{cmd.title}</div>
                                    {cmd.description && (
                                        <div className="command-description">{cmd.description}</div>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};
