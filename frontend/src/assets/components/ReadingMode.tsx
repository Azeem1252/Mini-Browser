import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReadingModeSettings } from '../../types';
import './ReadingMode.css';

interface ReadingModeProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title: string;
    url: string;
}

const DEFAULT_SETTINGS: ReadingModeSettings = {
    fontSize: 18,
    lineHeight: 1.6,
    fontFamily: 'serif',
    theme: 'sepia',
    maxWidth: 720,
    textAlign: 'left',
};

export const ReadingMode: React.FC<ReadingModeProps> = ({
    isOpen,
    onClose,
    content,
    title,
    url,
}) => {
    const [settings, setSettings] = useState<ReadingModeSettings>(() => {
        const saved = localStorage.getItem('reading_mode_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });
    const [showControls, setShowControls] = useState(false);
    const [estimatedReadTime, setEstimatedReadTime] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Save settings
    useEffect(() => {
        localStorage.setItem('reading_mode_settings', JSON.stringify(settings));
    }, [settings]);

    // Calculate estimated read time (assuming 200 words per minute)
    useEffect(() => {
        const text = extractTextFromHtml(content);
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        setEstimatedReadTime(Math.ceil(wordCount / 200));
    }, [content]);

    // Track scroll progress
    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === '+' || e.key === '=') {
                updateSetting('fontSize', Math.min(settings.fontSize + 2, 32));
            } else if (e.key === '-') {
                updateSetting('fontSize', Math.max(settings.fontSize - 2, 12));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, settings.fontSize, onClose]);

    const updateSetting = useCallback(<K extends keyof ReadingModeSettings>(
        key: K,
        value: ReadingModeSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const extractTextFromHtml = (html: string): string => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    const cleanContent = useCallback((html: string): string => {
        // Basic content cleaning for reading mode
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Remove scripts, styles, ads, etc.
        const selectorsToRemove = [
            'script', 'style', 'nav', 'header', 'footer',
            'aside', '.ad', '.ads', '.advertisement', '.sidebar',
            '.comments', '.social', '.share', 'iframe'
        ];

        selectorsToRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Find main content
        const mainContent = doc.querySelector('article, main, .content, .post, .entry') || doc.body;

        return mainContent.innerHTML;
    }, []);

    if (!isOpen) return null;

    const themeStyles = {
        light: { bg: '#ffffff', text: '#1a1a1a' },
        sepia: { bg: '#f4ecd8', text: '#5b4636' },
        dark: { bg: '#1a1a1a', text: '#e0e0e0' },
    };

    const currentTheme = themeStyles[settings.theme];

    return (
        <AnimatePresence>
            <motion.div
                className="reading-mode-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ backgroundColor: currentTheme.bg }}
            >
                {/* Progress bar */}
                <div className="reading-progress">
                    <div
                        className="reading-progress-bar"
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>

                {/* Header */}
                <motion.header
                    className="reading-header"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="reading-header-left">
                        <button className="reading-close" onClick={onClose}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Exit Reading Mode</span>
                        </button>
                    </div>

                    <div className="reading-header-center">
                        <span className="reading-time">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {estimatedReadTime} min read
                        </span>
                    </div>

                    <div className="reading-header-right">
                        <button
                            className="reading-settings-toggle"
                            onClick={() => setShowControls(!showControls)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                </motion.header>

                {/* Settings panel */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            className="reading-controls"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Font size */}
                            <div className="control-group">
                                <label>Font Size</label>
                                <div className="control-buttons">
                                    <button onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 2))}>
                                        A-
                                    </button>
                                    <span>{settings.fontSize}px</span>
                                    <button onClick={() => updateSetting('fontSize', Math.min(32, settings.fontSize + 2))}>
                                        A+
                                    </button>
                                </div>
                            </div>

                            {/* Line height */}
                            <div className="control-group">
                                <label>Line Height</label>
                                <div className="control-buttons">
                                    <button onClick={() => updateSetting('lineHeight', Math.max(1.2, settings.lineHeight - 0.2))}>
                                        -
                                    </button>
                                    <span>{settings.lineHeight.toFixed(1)}</span>
                                    <button onClick={() => updateSetting('lineHeight', Math.min(2.4, settings.lineHeight + 0.2))}>
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Font family */}
                            <div className="control-group">
                                <label>Font</label>
                                <div className="control-buttons font-select">
                                    {(['sans-serif', 'serif', 'monospace'] as const).map(font => (
                                        <button
                                            key={font}
                                            className={settings.fontFamily === font ? 'active' : ''}
                                            onClick={() => updateSetting('fontFamily', font)}
                                            style={{ fontFamily: font }}
                                        >
                                            Aa
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Theme */}
                            <div className="control-group">
                                <label>Theme</label>
                                <div className="control-buttons theme-select">
                                    {(['light', 'sepia', 'dark'] as const).map(theme => (
                                        <button
                                            key={theme}
                                            className={`theme-btn ${theme} ${settings.theme === theme ? 'active' : ''}`}
                                            onClick={() => updateSetting('theme', theme)}
                                            style={{
                                                backgroundColor: themeStyles[theme].bg,
                                                color: themeStyles[theme].text,
                                            }}
                                        >
                                            A
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Width */}
                            <div className="control-group">
                                <label>Width</label>
                                <input
                                    type="range"
                                    min="480"
                                    max="1200"
                                    step="40"
                                    value={settings.maxWidth}
                                    onChange={(e) => updateSetting('maxWidth', Number(e.target.value))}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <motion.article
                    className="reading-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        maxWidth: settings.maxWidth,
                        fontSize: settings.fontSize,
                        lineHeight: settings.lineHeight,
                        fontFamily: settings.fontFamily,
                        color: currentTheme.text,
                        textAlign: settings.textAlign,
                    }}
                >
                    <h1 className="reading-title">{title}</h1>
                    <div className="reading-meta">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            {new URL(url).hostname}
                        </a>
                    </div>
                    <div
                        className="reading-body"
                        dangerouslySetInnerHTML={{ __html: cleanContent(content) }}
                    />
                </motion.article>
            </motion.div>
        </AnimatePresence>
    );
};
