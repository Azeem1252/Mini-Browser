import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplitView.css';

interface SplitViewProps {
    isOpen: boolean;
    onClose: () => void;
    primaryContent: React.ReactNode;
    primaryUrl: string;
    onNavigate: (url: string, position: 'primary' | 'secondary') => void;
}

type SplitOrientation = 'horizontal' | 'vertical';

export const SplitView: React.FC<SplitViewProps> = ({
    isOpen,
    onClose,
    primaryContent,
    primaryUrl,
    onNavigate,
}) => {
    const [orientation, setOrientation] = useState<SplitOrientation>('horizontal');
    const [splitRatio, setSplitRatio] = useState(50);
    const [secondaryUrl, setSecondaryUrl] = useState('');
    const [_secondaryContent, setSecondaryContent] = useState<React.ReactNode>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [secondaryInputValue, setSecondaryInputValue] = useState('');

    // Use setSecondaryContent for future implementation
    void setSecondaryContent;

    const handleSecondaryNavigate = useCallback(() => {
        if (secondaryInputValue.trim()) {
            onNavigate(secondaryInputValue.trim(), 'secondary');
            setSecondaryUrl(secondaryInputValue.trim());
        }
    }, [secondaryInputValue, onNavigate]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isResizing) return;

        const container = e.currentTarget as HTMLElement;
        const rect = container.getBoundingClientRect();

        if (orientation === 'horizontal') {
            const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
            setSplitRatio(Math.max(20, Math.min(80, newRatio)));
        } else {
            const newRatio = ((e.clientY - rect.top) / rect.height) * 100;
            setSplitRatio(Math.max(20, Math.min(80, newRatio)));
        }
    }, [isResizing, orientation]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const swapPanes = useCallback(() => {
        // Swap URLs and content
        const tempUrl = primaryUrl;
        // This would need to be handled by parent component
        onNavigate(secondaryUrl, 'primary');
        onNavigate(tempUrl, 'secondary');
    }, [primaryUrl, secondaryUrl, onNavigate]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="split-view-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Toolbar */}
                <div className="split-view-toolbar">
                    <div className="split-toolbar-left">
                        <button className="split-close" onClick={onClose}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>Exit Split View</span>
                        </button>
                    </div>

                    <div className="split-toolbar-center">
                        <div className="split-orientation-toggle">
                            <button
                                className={orientation === 'horizontal' ? 'active' : ''}
                                onClick={() => setOrientation('horizontal')}
                                title="Side by side"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="3" width="8" height="18" rx="1" strokeWidth="2" />
                                    <rect x="13" y="3" width="8" height="18" rx="1" strokeWidth="2" />
                                </svg>
                            </button>
                            <button
                                className={orientation === 'vertical' ? 'active' : ''}
                                onClick={() => setOrientation('vertical')}
                                title="Top and bottom"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="3" width="18" height="8" rx="1" strokeWidth="2" />
                                    <rect x="3" y="13" width="18" height="8" rx="1" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        <button className="split-swap" onClick={swapPanes} title="Swap panes">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button 
                            className="split-reset" 
                            onClick={() => setSplitRatio(50)}
                            title="Reset to 50/50"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                                <path d="M12 3v18" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>

                    <div className="split-toolbar-right">
                        <span className="split-ratio">{Math.round(splitRatio)}% / {Math.round(100 - splitRatio)}%</span>
                    </div>
                </div>

                {/* Split container */}
                <div 
                    className={`split-container ${orientation}`}
                    style={{
                        cursor: isResizing ? (orientation === 'horizontal' ? 'col-resize' : 'row-resize') : 'default'
                    }}
                >
                    {/* Primary pane */}
                    <motion.div
                        className="split-pane primary"
                        style={{
                            [orientation === 'horizontal' ? 'width' : 'height']: `${splitRatio}%`,
                        }}
                        layout
                    >
                        <div className="pane-header">
                            <div className="pane-url">{primaryUrl}</div>
                        </div>
                        <div className="pane-content">
                            {primaryContent}
                        </div>
                    </motion.div>

                    {/* Resizer */}
                    <div
                        className={`split-resizer ${orientation}`}
                        onMouseDown={handleMouseDown}
                    >
                        <div className="resizer-handle" />
                    </div>

                    {/* Secondary pane */}
                    <motion.div
                        className="split-pane secondary"
                        style={{
                            [orientation === 'horizontal' ? 'width' : 'height']: `${100 - splitRatio}%`,
                        }}
                        layout
                    >
                        <div className="pane-header">
                            {!secondaryUrl ? (
                                <form 
                                    className="pane-url-input"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSecondaryNavigate();
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter URL for second pane..."
                                        value={secondaryInputValue}
                                        onChange={(e) => setSecondaryInputValue(e.target.value)}
                                    />
                                    <button type="submit">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </form>
                            ) : (
                                <div className="pane-url">{secondaryUrl}</div>
                            )}
                        </div>
                        <div className="pane-content">
                            {_secondaryContent || (
                                <div className="pane-empty">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                                        <path d="M3 9h18M9 21V9" strokeWidth="2" />
                                    </svg>
                                    <p>Enter a URL above to load content</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
