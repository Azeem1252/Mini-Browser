import React from 'react';
import './TabBar.css';

export interface Tab {
    id: number;
    title: string;
    url: string;
    favicon?: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: number;
    onTabSelect: (tabId: number) => void;
    onTabClose: (tabId: number) => void;
    onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    onNewTab,
}) => {
    return (
        <div className="tab-bar">
            <div className="tab-list">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => onTabSelect(tab.id)}
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
                    </div>
                ))}
            </div>
            <button className="new-tab-button" onClick={onNewTab} aria-label="New tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};
