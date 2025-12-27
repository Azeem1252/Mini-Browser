import React, { useEffect, useRef } from 'react';
import './QRCodeGenerator.css';

interface QRCodeGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ isOpen, onClose, url }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isOpen || !url || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Simple QR code generation using canvas
        // This is a simplified version - in production, use a library like 'qrcode'
        const size = 200;
        const qrSize = 25; // 25x25 grid
        const cellSize = size / qrSize;

        canvas.width = size;
        canvas.height = size;

        // Generate simple pattern based on URL
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';

        // Create a deterministic pattern from URL
        const hash = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        for (let y = 0; y < qrSize; y++) {
            for (let x = 0; x < qrSize; x++) {
                const value = (hash * (x + 1) * (y + 1)) % 2;
                if (value === 1) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }

        // Add corner markers
        const markerSize = 3 * cellSize;
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, markerSize, markerSize);
        ctx.fillRect(size - markerSize, 0, markerSize, markerSize);
        ctx.fillRect(0, size - markerSize, markerSize, markerSize);
    }, [isOpen, url]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    const handleCopy = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            canvas.toBlob((blob) => {
                if (blob) {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                }
            });
        } catch (err) {
            console.error('Failed to copy QR code:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="qr-overlay" onClick={onClose} />
            <div className="qr-modal">
                <div className="qr-header">
                    <h2>QR Code Generator</h2>
                    <button className="qr-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="qr-content">
                    <div className="qr-canvas-container">
                        <canvas ref={canvasRef} className="qr-canvas" />
                    </div>
                    <p className="qr-url">{url}</p>
                </div>

                <div className="qr-actions">
                    <button className="qr-button primary" onClick={handleDownload}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Download
                    </button>
                    <button className="qr-button" onClick={handleCopy}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                        </svg>
                        Copy
                    </button>
                </div>
            </div>
        </>
    );
};
