import React, { useState, useEffect, useCallback } from 'react';
import './MemoryGame.css';

interface MemoryGameProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Card {
    id: number;
    emoji: string;
    flipped: boolean;
    matched: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Theme = 'classic' | 'animals' | 'food' | 'sports' | 'tech';

const THEMES: Record<Theme, { name: string; emoji: string; emojis: string[] }> = {
    classic: {
        name: 'Classic',
        emoji: '🎮',
        emojis: ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹', '🎼'],
    },
    animals: {
        name: 'Animals',
        emoji: '🦁',
        emojis: ['🦁', '🐯', '🐻', '🐼', '🦊', '🐰', '🐨', '🐸', '🦋', '🐙'],
    },
    food: {
        name: 'Food',
        emoji: '🍕',
        emojis: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍰', '🍪', '🍫', '🍓'],
    },
    sports: {
        name: 'Sports',
        emoji: '⚽',
        emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🥊', '⛷️', '🏄'],
    },
    tech: {
        name: 'Tech',
        emoji: '💻',
        emojis: ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '📷', '🎧', '🕹️', '🔋'],
    },
};

const DIFFICULTIES: Record<Difficulty, { name: string; cols: number; rows: number; pairs: number }> = {
    easy: { name: 'Easy', cols: 3, rows: 4, pairs: 6 },
    medium: { name: 'Medium', cols: 4, rows: 4, pairs: 8 },
    hard: { name: 'Hard', cols: 5, rows: 4, pairs: 10 },
};

export const MemoryGame: React.FC<MemoryGameProps> = ({ isOpen, onClose }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [won, setWon] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [theme, setTheme] = useState<Theme>('classic');
    const [timerMode, setTimerMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [showConfetti, setShowConfetti] = useState(false);
    const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('memory_best_scores');
        return saved ? JSON.parse(saved) : {};
    });

    const difficultyConfig = DIFFICULTIES[difficulty];
    const themeConfig = THEMES[theme];

    const initializeGame = useCallback(() => {
        const emojis = themeConfig.emojis.slice(0, difficultyConfig.pairs);
        const cardPairs = emojis.flatMap((emoji, index) => [
            { id: index * 2, emoji, flipped: false, matched: false },
            { id: index * 2 + 1, emoji, flipped: false, matched: false },
        ]);

        const shuffled = cardPairs.sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlippedCards([]);
        setMoves(0);
        setWon(false);
        setShowConfetti(false);
        setTimeLeft(timerMode ? (difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90) : 0);
        setGameStarted(true);
    }, [difficulty, themeConfig.emojis, difficultyConfig.pairs, timerMode]);

    // Timer effect
    useEffect(() => {
        if (!gameStarted || won || !timerMode || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, won, timerMode, timeLeft]);

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2 || flippedCards.includes(id)) return;
        if (timerMode && timeLeft <= 0) return;

        const card = cards.find(c => c.id === id);
        if (card?.matched) return;

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            const [first, second] = newFlipped;
            const firstCard = cards.find(c => c.id === first);
            const secondCard = cards.find(c => c.id === second);

            if (firstCard?.emoji === secondCard?.emoji) {
                setTimeout(() => {
                    setCards(cards.map(c =>
                        c.id === first || c.id === second ? { ...c, matched: true } : c
                    ));
                    setFlippedCards([]);
                }, 400);
            } else {
                setTimeout(() => {
                    setFlippedCards([]);
                }, 800);
            }
        }
    };

    // Check win condition
    useEffect(() => {
        if (cards.length > 0 && cards.every(c => c.matched)) {
            setWon(true);
            setShowConfetti(true);

            // Save best score
            const key = `${difficulty}_${theme}${timerMode ? '_timed' : ''}`;
            const currentBest = bestScores[key] || Infinity;
            if (moves < currentBest) {
                const newScores = { ...bestScores, [key]: moves };
                setBestScores(newScores);
                localStorage.setItem('memory_best_scores', JSON.stringify(newScores));
            }
        }
    }, [cards, moves, difficulty, theme, timerMode, bestScores]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="memory-overlay" onClick={onClose} />
            <div className="memory-modal">
                <div className="memory-header">
                    <h2>🎴 Memory Match</h2>
                    <button className="memory-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="memory-content">
                    {!gameStarted ? (
                        <div className="memory-setup">
                            <div className="memory-title-icon">🧠</div>
                            <h3>Find matching pairs!</h3>

                            <div className="memory-option-group">
                                <label>Difficulty</label>
                                <div className="memory-options">
                                    {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                                        <button
                                            key={d}
                                            className={`memory-option ${difficulty === d ? 'active' : ''}`}
                                            onClick={() => setDifficulty(d)}
                                        >
                                            {DIFFICULTIES[d].name}
                                            <span className="memory-option-detail">
                                                {DIFFICULTIES[d].pairs} pairs
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="memory-option-group">
                                <label>Theme</label>
                                <div className="memory-theme-options">
                                    {(Object.keys(THEMES) as Theme[]).map(t => (
                                        <button
                                            key={t}
                                            className={`memory-theme-btn ${theme === t ? 'active' : ''}`}
                                            onClick={() => setTheme(t)}
                                            title={THEMES[t].name}
                                        >
                                            <span className="theme-emoji">{THEMES[t].emoji}</span>
                                            <span className="theme-name">{THEMES[t].name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="memory-timer-toggle">
                                <label className="memory-toggle">
                                    <input
                                        type="checkbox"
                                        checked={timerMode}
                                        onChange={(e) => setTimerMode(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span>⏱️ Timer Mode</span>
                            </div>

                            <button className="memory-button" onClick={initializeGame}>
                                Start Game
                            </button>
                        </div>
                    ) : won ? (
                        <div className="memory-won">
                            {showConfetti && (
                                <div className="memory-confetti">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div key={i} className="confetti-piece" style={{
                                            left: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 2}s`,
                                            backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                                        }} />
                                    ))}
                                </div>
                            )}
                            <div className="memory-won-icon">🎉</div>
                            <h3>You Won!</h3>
                            <div className="memory-final-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{moves}</span>
                                    <span className="stat-label">Moves</span>
                                </div>
                                {timerMode && (
                                    <div className="stat-item">
                                        <span className="stat-value">{formatTime(timeLeft)}</span>
                                        <span className="stat-label">Time Left</span>
                                    </div>
                                )}
                            </div>
                            {bestScores[`${difficulty}_${theme}${timerMode ? '_timed' : ''}`] === moves && (
                                <p className="memory-best-score">🏆 New Best Score!</p>
                            )}
                            <div className="memory-win-actions">
                                <button className="memory-button" onClick={initializeGame}>
                                    Play Again
                                </button>
                                <button className="memory-button secondary" onClick={() => setGameStarted(false)}>
                                    Change Settings
                                </button>
                            </div>
                        </div>
                    ) : timerMode && timeLeft <= 0 ? (
                        <div className="memory-timeout">
                            <div className="memory-timeout-icon">⏰</div>
                            <h3>Time's Up!</h3>
                            <p>You matched {cards.filter(c => c.matched).length / 2} of {difficultyConfig.pairs} pairs</p>
                            <button className="memory-button" onClick={initializeGame}>
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="memory-stats">
                                <div className="memory-stat">
                                    <span className="stat-icon">🎯</span>
                                    <span>Moves: <strong>{moves}</strong></span>
                                </div>
                                <div className="memory-stat">
                                    <span className="stat-icon">✅</span>
                                    <span>Matched: <strong>{cards.filter(c => c.matched).length / 2}/{difficultyConfig.pairs}</strong></span>
                                </div>
                                {timerMode && (
                                    <div className={`memory-stat timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                                        <span className="stat-icon">⏱️</span>
                                        <span><strong>{formatTime(timeLeft)}</strong></span>
                                    </div>
                                )}
                            </div>
                            <div
                                className="memory-grid"
                                style={{
                                    gridTemplateColumns: `repeat(${difficultyConfig.cols}, 1fr)`,
                                    maxWidth: difficultyConfig.cols * 85 + 'px'
                                }}
                            >
                                {cards.map((card) => (
                                    <div
                                        key={card.id}
                                        className={`memory-card ${flippedCards.includes(card.id) || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                                        onClick={() => handleCardClick(card.id)}
                                    >
                                        <div className="memory-card-inner">
                                            <div className="memory-card-front">
                                                <span className="card-question">?</span>
                                            </div>
                                            <div className="memory-card-back">{card.emoji}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
