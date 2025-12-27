import React from 'react';
import './ZoomControls.css';

interface ZoomControlsProps {
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onZoomReset,
}) => {
    return (
        <div className="zoom-controls">
            <button
                className="zoom-button"
                onClick={onZoomOut}
                disabled={zoomLevel <= 25}
                title="Zoom out (Ctrl+-)"
                aria-label="Zoom out"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 11h6" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            <button
                className="zoom-display"
                onClick={onZoomReset}
                title="Reset zoom (Ctrl+0)"
            >
                {zoomLevel}%
            </button>

            <button
                className="zoom-button"
                onClick={onZoomIn}
                disabled={zoomLevel >= 500}
                title="Zoom in (Ctrl++)"
                aria-label="Zoom in"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11 8v6M8 11h6" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};
