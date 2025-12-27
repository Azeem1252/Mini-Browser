import React from 'react';

interface GamePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h2>Games</h2>
                <p>Game panel coming soon!</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};
