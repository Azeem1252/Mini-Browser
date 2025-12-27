import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './PictureInPicture.css';

interface PictureInPictureProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    content: React.ReactNode;
    title: string;
    onNavigate?: (url: string) => void;
}

interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

export const PictureInPicture: React.FC<PictureInPictureProps> = ({
    isOpen,
    onClose,
    url,
    content,
    title,
    onNavigate,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    
    const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
    const [size, setSize] = useState<Size>({ width: 400, height: 300 });
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [prevState, setPrevState] = useState<{ position: Position; size: Size } | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string>('');

    // Handle resize
    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let newWidth = size.width;
            let newHeight = size.height;
            let newX = position.x;
            let newY = position.y;

            if (resizeDirection.includes('e')) {
                newWidth = Math.max(280, e.clientX - rect.left + size.width - rect.width);
            }
            if (resizeDirection.includes('w')) {
                const deltaX = rect.left - e.clientX;
                newWidth = Math.max(280, size.width + deltaX);
                newX = position.x - deltaX;
            }
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(200, e.clientY - rect.top + size.height - rect.height);
            }
            if (resizeDirection.includes('n')) {
                const deltaY = rect.top - e.clientY;
                newHeight = Math.max(200, size.height + deltaY);
                newY = position.y - deltaY;
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDirection('');
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeDirection, size, position]);

    const toggleMinimize = useCallback(() => {
        if (isMaximized) return;
        setIsMinimized(!isMinimized);
    }, [isMinimized, isMaximized]);

    const toggleMaximize = useCallback(() => {
        if (isMaximized) {
            // Restore previous state
            if (prevState) {
                setPosition(prevState.position);
                setSize(prevState.size);
            }
            setIsMaximized(false);
        } else {
            // Save current state and maximize
            setPrevState({ position, size });
            setPosition({ x: 0, y: 0 });
            setSize({ width: window.innerWidth, height: window.innerHeight });
            setIsMaximized(true);
        }
        setIsMinimized(false);
    }, [isMaximized, position, size, prevState]);

    // Position presets
    const snapTo = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br') => {
        const padding = 20;
        const positions = {
            tl: { x: padding, y: padding },
            tr: { x: window.innerWidth - size.width - padding, y: padding },
            bl: { x: padding, y: window.innerHeight - size.height - padding },
            br: { x: window.innerWidth - size.width - padding, y: window.innerHeight - size.height - padding },
        };
        setPosition(positions[corner]);
    }, [size]);

    if (!isOpen) return null;

    return (
        <motion.div
            ref={containerRef}
            className={`pip-window ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
                opacity: 1, 
                scale: 1,
                x: isMaximized ? 0 : position.x,
                y: isMaximized ? 0 : position.y,
                width: isMaximized ? '100vw' : size.width,
                height: isMinimized ? 40 : (isMaximized ? '100vh' : size.height),
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag={!isMaximized}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(_, info) => {
                setPosition(prev => ({
                    x: prev.x + info.offset.x,
                    y: prev.y + info.offset.y,
                }));
            }}
        >
            {/* Header */}
            <div 
                className="pip-header"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="pip-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                        <rect x="12" y="10" width="8" height="5" rx="1" strokeWidth="2" />
                    </svg>
                    <span>{title || 'Picture in Picture'}</span>
                </div>
                <div className="pip-controls">
                    <div className="pip-snap-controls">
                        <button onClick={() => snapTo('tl')} title="Snap to top-left">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="3" width="8" height="8" rx="1" />
                            </svg>
                        </button>
                        <button onClick={() => snapTo('tr')} title="Snap to top-right">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="13" y="3" width="8" height="8" rx="1" />
                            </svg>
                        </button>
                        <button onClick={() => snapTo('bl')} title="Snap to bottom-left">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="13" width="8" height="8" rx="1" />
                            </svg>
                        </button>
                        <button onClick={() => snapTo('br')} title="Snap to bottom-right">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="13" y="13" width="8" height="8" rx="1" />
                            </svg>
                        </button>
                    </div>
                    <button 
                        className="pip-control minimize" 
                        onClick={toggleMinimize}
                        title={isMinimized ? 'Restore' : 'Minimize'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button 
                        className="pip-control maximize" 
                        onClick={toggleMaximize}
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            {isMaximized ? (
                                <>
                                    <rect x="5" y="7" width="12" height="10" rx="1" strokeWidth="2" />
                                    <path d="M7 7V5h12v10h-2" strokeWidth="2" />
                                </>
                            ) : (
                                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
                            )}
                        </svg>
                    </button>
                    <button 
                        className="pip-control close" 
                        onClick={onClose}
                        title="Close"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* URL bar (shown when not minimized) */}
            {!isMinimized && (
                <div className="pip-url-bar">
                    <span className="pip-url">{url}</span>
                    {onNavigate && (
                        <button 
                            className="pip-open-main"
                            onClick={() => onNavigate(url)}
                            title="Open in main window"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            {!isMinimized && (
                <div className="pip-content">
                    {content}
                </div>
            )}

            {/* Resize handles */}
            {!isMaximized && !isMinimized && (
                <>
                    <div className="pip-resize n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div className="pip-resize s" onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div className="pip-resize e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
                    <div className="pip-resize w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div className="pip-resize ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div className="pip-resize nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div className="pip-resize se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
                    <div className="pip-resize sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                </>
            )}
        </motion.div>
    );
};
