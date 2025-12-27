import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

interface Settings {
    searchEngine: 'google' | 'bing' | 'duckduckgo';
    homepage: string;
    theme: 'dark' | 'light' | 'ocean' | 'forest' | 'sunset' | 'cyberpunk' | 'dracula' | 'nord' | 'solarized' | 'auto';
    showBookmarksBar: boolean;
    clearHistoryOnExit: boolean;
    blockPopups: boolean;
    soundEffects?: boolean;
}

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('browser_settings');
        return saved
            ? JSON.parse(saved)
            : {
                searchEngine: 'google',
                homepage: 'about:blank',
                theme: 'dark',
                showBookmarksBar: false,
                clearHistoryOnExit: false,
                blockPopups: true,
                soundEffects: true,
            };
    });

    useEffect(() => {
        localStorage.setItem('browser_settings', JSON.stringify(settings));

        // Apply theme immediately
        if (settings.theme !== 'auto') {
            document.documentElement.setAttribute('data-theme', settings.theme);
            localStorage.setItem('browser_theme', settings.theme);
            // Dispatch custom event for theme changes
            window.dispatchEvent(new Event('themeChange'));
        }
    }, [settings]);

    const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className="settings-panel animate-slideDown">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3" strokeWidth="2" />
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Settings
                    </h2>
                    <button className="panel-close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="panel-content">
                    <div className="settings-section">
                        <h3 className="settings-section-title">Search</h3>
                        <div className="setting-item">
                            <label className="setting-label">
                                <span>Default Search Engine</span>
                                <select
                                    value={settings.searchEngine}
                                    onChange={(e) => updateSetting('searchEngine', e.target.value as Settings['searchEngine'])}
                                    className="setting-select"
                                >
                                    <option value="google">Google</option>
                                    <option value="bing">Bing</option>
                                    <option value="duckduckgo">DuckDuckGo</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">Startup</h3>
                        <div className="setting-item">
                            <label className="setting-label">
                                <span>Homepage</span>
                                <input
                                    type="text"
                                    value={settings.homepage}
                                    onChange={(e) => updateSetting('homepage', e.target.value)}
                                    placeholder="about:blank"
                                    className="setting-input"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">Appearance</h3>
                        <div className="setting-item">
                            <label className="setting-label">
                                <span>Theme</span>
                                <select
                                    value={settings.theme}
                                    onChange={(e) => updateSetting('theme', e.target.value as Settings['theme'])}
                                    className="setting-select"
                                >
                                    <option value="dark">🌙 Dark</option>
                                    <option value="light">☀️ Light</option>
                                    <option value="ocean">🌊 Ocean</option>
                                    <option value="forest">🌲 Forest</option>
                                    <option value="sunset">🌅 Sunset</option>
                                    <option value="cyberpunk">🌃 Cyberpunk</option>
                                    <option value="dracula">🧛 Dracula</option>
                                    <option value="nord">❄️ Nord</option>
                                    <option value="solarized">🌞 Solarized</option>
                                    <option value="auto">⚙️ Auto (System)</option>
                                </select>
                            </label>
                        </div>
                        <div className="setting-item">
                            <label className="setting-toggle">
                                <span>Sound Effects</span>
                                <input
                                    type="checkbox"
                                    checked={settings.soundEffects !== false}
                                    onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                                />
                                <span className="toggle-switch"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <label className="setting-toggle">
                                <span>Show Bookmarks Bar</span>
                                <input
                                    type="checkbox"
                                    checked={settings.showBookmarksBar}
                                    onChange={(e) => updateSetting('showBookmarksBar', e.target.checked)}
                                />
                                <span className="toggle-switch"></span>
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">Privacy & Security</h3>
                        <div className="setting-item">
                            <label className="setting-toggle">
                                <span>Clear history on exit</span>
                                <input
                                    type="checkbox"
                                    checked={settings.clearHistoryOnExit}
                                    onChange={(e) => updateSetting('clearHistoryOnExit', e.target.checked)}
                                />
                                <span className="toggle-switch"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <label className="setting-toggle">
                                <span>Block pop-ups</span>
                                <input
                                    type="checkbox"
                                    checked={settings.blockPopups}
                                    onChange={(e) => updateSetting('blockPopups', e.target.checked)}
                                />
                                <span className="toggle-switch"></span>
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">About</h3>
                        <div className="about-info">
                            <p className="about-name">Custom Web Browser</p>
                            <p className="about-version">Version 1.0.0</p>
                            <p className="about-description">
                                A modern web browser built with React and C++
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const getSettings = (): Settings => {
    const saved = localStorage.getItem('browser_settings');
    return saved
        ? JSON.parse(saved)
        : {
            searchEngine: 'google',
            homepage: 'about:blank',
            theme: 'dark',
            showBookmarksBar: false,
            clearHistoryOnExit: false,
            blockPopups: true,
        };
};
