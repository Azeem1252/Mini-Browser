import React, { useState } from 'react';
import { BrowserGame } from './BrowserGame';
import { SnakeGame } from './SnakeGame';
import { BreakoutGame } from './BreakoutGame';
import { MemoryGame } from './MemoryGame';
import './GameHub.css';

interface GameHubProps {
    isOpen: boolean;
    onClose: () => void;
}

type GameType = 'menu' | 'flappy' | 'snake' | 'breakout' | 'memory';

export const GameHub: React.FC<GameHubProps> = ({ isOpen, onClose }) => {
    const [selectedGame, setSelectedGame] = useState<GameType>('menu');

    const handleGameSelect = (game: GameType) => {
        setSelectedGame(game);
    };

    const handleBackToMenu = () => {
        setSelectedGame('menu');
    };

    if (!isOpen) return null;

    if (selectedGame === 'flappy') {
        return <BrowserGame isOpen={true} onClose={handleBackToMenu} />;
    }

    if (selectedGame === 'snake') {
        return <SnakeGame isOpen={true} onClose={handleBackToMenu} />;
    }

    if (selectedGame === 'breakout') {
        return <BreakoutGame isOpen={true} onClose={handleBackToMenu} />;
    }

    if (selectedGame === 'memory') {
        return <MemoryGame isOpen={true} onClose={handleBackToMenu} />;
    }

    return (
        <>
            <div className="game-hub-overlay" onClick={onClose} />
            <div className="game-hub-modal">
                <div className="game-hub-header">
                    <h2>🎮 Browser Games</h2>
                    <button className="game-hub-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="game-hub-grid">
                    <button className="game-card" onClick={() => handleGameSelect('flappy')}>
                        <div className="game-icon">🐦</div>
                        <h3>Flappy Browser</h3>
                        <p>Tap to fly, avoid pipes!</p>
                    </button>

                    <button className="game-card" onClick={() => handleGameSelect('snake')}>
                        <div className="game-icon">🐍</div>
                        <h3>Snake</h3>
                        <p>Eat food, grow longer!</p>
                    </button>

                    <button className="game-card" onClick={() => handleGameSelect('breakout')}>
                        <div className="game-icon">🧱</div>
                        <h3>Breakout</h3>
                        <p>Break all the bricks!</p>
                    </button>

                    <button className="game-card" onClick={() => handleGameSelect('memory')}>
                        <div className="game-icon">🎴</div>
                        <h3>Memory Match</h3>
                        <p>Find matching pairs!</p>
                    </button>
                </div>
            </div>
        </>
    );
};
