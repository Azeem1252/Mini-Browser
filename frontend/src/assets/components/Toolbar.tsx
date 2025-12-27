import React from 'react';

interface ToolbarProps {
    onNewTab: () => void;
    onOpenBookmarks: () => void;
    onOpenHistory: () => void;
    onOpenSettings: () => void;
    onOpenDownloads: () => void;
    onToggleCommandPalette: () => void;
    onToggleFindInPage: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onToggleTheme: () => void;
    onShowQRCode: () => void;
    onTriggerConfetti: () => void;
    onOpenGame: () => void;
    onToggleReadingMode: () => void;
    onToggleSplitView: () => void;
    onTogglePip: () => void;
    onOpenSessionManager: () => void;
    currentTheme: 'dark' | 'light';
}

export const Toolbar: React.FC<ToolbarProps> = () => {
    // Minimal toolbar - just renders nothing for now since Electron has its own chrome
    return null;
};
