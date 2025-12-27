import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SnakeGame.css';

interface SnakeGameProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Position {
    x: number;
    y: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface PowerUp {
    x: number;
    y: number;
    type: 'speed' | 'slow' | 'bonus' | 'ghost' | 'magnet';
    timer: number;
}

interface Food {
    x: number;
    y: number;
    type: 'normal' | 'golden' | 'super';
    pulse: number;
}

interface Obstacle {
    x: number;
    y: number;
}

type GameMode = 'classic' | 'walls' | 'obstacles';

const MODES: Record<GameMode, { name: string; desc: string; icon: string }> = {
    classic: { name: 'Classic', desc: 'Walls kill you', icon: '🎮' },
    walls: { name: 'No Walls', desc: 'Pass through', icon: '🌀' },
    obstacles: { name: 'Obstacles', desc: 'Watch out!', icon: '🚧' },
};

export const SnakeGame: React.FC<SnakeGameProps> = ({ isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [gameMode, setGameMode] = useState<GameMode>('classic');
    const [combo, setCombo] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('snake_highscore');
        return saved ? parseInt(saved) : 0;
    });

    const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
    const directionRef = useRef<Position>({ x: 1, y: 0 });
    const nextDirectionRef = useRef<Position>({ x: 1, y: 0 });
    const foodRef = useRef<Food>({ x: 15, y: 15, type: 'normal', pulse: 0 });
    const powerUpRef = useRef<PowerUp | null>(null);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | undefined>(undefined);
    const speedMultiplierRef = useRef(1);
    const rainbowModeRef = useRef(false);
    const ghostModeRef = useRef(false);
    const lastEatTimeRef = useRef(0);

    const gridSize = 20;
    const cellSize = 22;

    const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            particlesRef.current.push({
                x: x * cellSize + cellSize / 2,
                y: y * cellSize + cellSize / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: 3 + Math.random() * 4,
            });
        }
    }, []);

    const spawnFood = useCallback(() => {
        let newFood: Position;
        do {
            newFood = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize),
            };
        } while (
            snakeRef.current.some(s => s.x === newFood.x && s.y === newFood.y) ||
            obstaclesRef.current.some(o => o.x === newFood.x && o.y === newFood.y)
        );

        // 15% golden, 5% super
        const rand = Math.random();
        const type = rand < 0.05 ? 'super' : rand < 0.2 ? 'golden' : 'normal';
        foodRef.current = { ...newFood, type, pulse: 0 };
    }, []);

    const spawnPowerUp = useCallback(() => {
        if (Math.random() < 0.25 && !powerUpRef.current) {
            const types: PowerUp['type'][] = ['speed', 'slow', 'bonus', 'ghost', 'magnet'];
            let pos: Position;
            do {
                pos = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize),
                };
            } while (
                snakeRef.current.some(s => s.x === pos.x && s.y === pos.y) ||
                obstaclesRef.current.some(o => o.x === pos.x && o.y === pos.y)
            );

            powerUpRef.current = {
                ...pos,
                type: types[Math.floor(Math.random() * types.length)],
                timer: 250,
            };
        }
    }, []);

    const generateObstacles = useCallback(() => {
        obstaclesRef.current = [];
        if (gameMode !== 'obstacles') return;

        const numObstacles = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numObstacles; i++) {
            let pos: Position;
            do {
                pos = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize),
                };
            } while (
                snakeRef.current.some(s => Math.abs(s.x - pos.x) < 3 && Math.abs(s.y - pos.y) < 3) ||
                obstaclesRef.current.some(o => o.x === pos.x && o.y === pos.y) ||
                (pos.x === foodRef.current.x && pos.y === foodRef.current.y)
            );
            obstaclesRef.current.push(pos);
        }
    }, [gameMode]);

    useEffect(() => {
        if (!isOpen || !gameStarted || gameOver) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = gridSize * cellSize;
        canvas.height = gridSize * cellSize;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                setPaused(p => !p);
                return;
            }
            if (paused) return;

            const dir = directionRef.current;
            if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y === 0) {
                nextDirectionRef.current = { x: 0, y: -1 };
            }
            if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y === 0) {
                nextDirectionRef.current = { x: 0, y: 1 };
            }
            if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x === 0) {
                nextDirectionRef.current = { x: -1, y: 0 };
            }
            if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x === 0) {
                nextDirectionRef.current = { x: 1, y: 0 };
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        let lastTime = 0;
        let currentScore = score;
        let currentCombo = combo;

        const gameLoop = (timestamp: number) => {
            if (gameOver) return;

            if (paused) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 32px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⏸️ PAUSED', canvas.width / 2, canvas.height / 2);
                ctx.font = '16px "Segoe UI", sans-serif';
                ctx.fillText('Press P or ESC to resume', canvas.width / 2, canvas.height / 2 + 35);
                animationRef.current = requestAnimationFrame(gameLoop);
                return;
            }

            // Speed - slower base, gentler progression
            const baseSpeed = 200;  // Slower start (was 145)
            const speedDecrease = Math.floor(currentScore / 40) * 10;  // Slower progression
            let currentSpeed = Math.max(baseSpeed - speedDecrease, 80);  // Higher minimum (was 55)
            currentSpeed = currentSpeed / speedMultiplierRef.current;

            if (timestamp - lastTime < currentSpeed) {
                drawFrame(ctx, canvas, currentScore, currentCombo);
                animationRef.current = requestAnimationFrame(gameLoop);
                return;
            }
            lastTime = timestamp;

            directionRef.current = { ...nextDirectionRef.current };

            const snake = snakeRef.current;
            const head = { ...snake[0] };
            head.x += directionRef.current.x;
            head.y += directionRef.current.y;

            // Wall collision
            if (gameMode === 'classic' || gameMode === 'obstacles') {
                if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
                    endGame(currentScore);
                    return;
                }
            } else {
                if (head.x < 0) head.x = gridSize - 1;
                if (head.x >= gridSize) head.x = 0;
                if (head.y < 0) head.y = gridSize - 1;
                if (head.y >= gridSize) head.y = 0;
            }

            // Obstacle collision
            if (!ghostModeRef.current && obstaclesRef.current.some(o => o.x === head.x && o.y === head.y)) {
                endGame(currentScore);
                return;
            }

            // Self collision (unless ghost mode)
            if (!ghostModeRef.current && snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                endGame(currentScore);
                return;
            }

            snake.unshift(head);

            // Food collision
            const food = foodRef.current;
            if (head.x === food.x && head.y === food.y) {
                const now = Date.now();
                const timeDiff = now - lastEatTimeRef.current;
                lastEatTimeRef.current = now;

                // Combo system
                if (timeDiff < 2000) {
                    currentCombo = Math.min(currentCombo + 1, 10);
                } else {
                    currentCombo = 1;
                }
                setCombo(currentCombo);

                let basePoints = food.type === 'super' ? 50 : food.type === 'golden' ? 25 : 10;
                if (rainbowModeRef.current) basePoints *= 2;
                const points = basePoints * currentCombo;

                currentScore += points;
                setScore(currentScore);

                const colors = { normal: '#FF5252', golden: '#FFD700', super: '#FF00FF' };
                createParticles(head.x, head.y, colors[food.type], 15);

                spawnFood();
                spawnPowerUp();
            } else {
                snake.pop();
            }

            // Power-up collision
            if (powerUpRef.current) {
                powerUpRef.current.timer--;
                if (powerUpRef.current.timer <= 0) {
                    powerUpRef.current = null;
                } else if (head.x === powerUpRef.current.x && head.y === powerUpRef.current.y) {
                    const pu = powerUpRef.current;
                    createParticles(head.x, head.y, '#FFD700', 18);

                    switch (pu.type) {
                        case 'speed':
                            speedMultiplierRef.current = 1.6;
                            setTimeout(() => { speedMultiplierRef.current = 1; }, 6000);
                            break;
                        case 'slow':
                            speedMultiplierRef.current = 0.5;
                            setTimeout(() => { speedMultiplierRef.current = 1; }, 6000);
                            break;
                        case 'bonus':
                            currentScore += 100;
                            setScore(currentScore);
                            rainbowModeRef.current = true;
                            setTimeout(() => { rainbowModeRef.current = false; }, 10000);
                            break;
                        case 'ghost':
                            ghostModeRef.current = true;
                            setTimeout(() => { ghostModeRef.current = false; }, 5000);
                            break;
                        case 'magnet':
                            // Attract food towards snake
                            const dx = head.x - food.x;
                            const dy = head.y - food.y;
                            if (Math.abs(dx) > Math.abs(dy)) {
                                foodRef.current.x += dx > 0 ? 1 : -1;
                            } else {
                                foodRef.current.y += dy > 0 ? 1 : -1;
                            }
                            break;
                    }
                    powerUpRef.current = null;
                }
            }

            drawFrame(ctx, canvas, currentScore, currentCombo);
            animationRef.current = requestAnimationFrame(gameLoop);
        };

        const drawFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentScore: number, currentCombo: number) => {
            // Background
            const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGradient.addColorStop(0, '#0a0a1a');
            bgGradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = 'rgba(50, 50, 80, 0.25)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= gridSize; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(canvas.width, i * cellSize);
                ctx.stroke();
            }

            // Draw obstacles
            obstaclesRef.current.forEach(obs => {
                ctx.fillStyle = '#5D4037';
                ctx.shadowColor = '#3E2723';
                ctx.shadowBlur = 3;
                roundRect(ctx, obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4, 4);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Rock texture
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.arc(obs.x * cellSize + 8, obs.y * cellSize + 8, 3, 0, Math.PI * 2);
                ctx.arc(obs.x * cellSize + 14, obs.y * cellSize + 12, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw snake
            const snake = snakeRef.current;
            snake.forEach((segment, index) => {
                const isHead = index === 0;

                let baseColor1, baseColor2;
                if (rainbowModeRef.current) {
                    const hue = (Date.now() / 8 + index * 18) % 360;
                    baseColor1 = `hsl(${hue}, 85%, 55%)`;
                    baseColor2 = `hsl(${hue}, 85%, 35%)`;
                } else {
                    baseColor1 = isHead ? '#66BB6A' : '#81C784';
                    baseColor2 = isHead ? '#2E7D32' : '#4CAF50';
                }

                // Ghost mode transparency
                ctx.globalAlpha = ghostModeRef.current ? 0.5 : 1;

                ctx.shadowColor = baseColor1;
                ctx.shadowBlur = isHead ? 6 : 3;

                const gradient = ctx.createRadialGradient(
                    segment.x * cellSize + cellSize / 2,
                    segment.y * cellSize + cellSize / 2,
                    2,
                    segment.x * cellSize + cellSize / 2,
                    segment.y * cellSize + cellSize / 2,
                    cellSize / 2
                );
                gradient.addColorStop(0, baseColor1);
                gradient.addColorStop(1, baseColor2);
                ctx.fillStyle = gradient;

                const x = segment.x * cellSize + 2;
                const y = segment.y * cellSize + 2;
                const size = cellSize - 4;
                const radius = isHead ? 7 : 5;

                roundRect(ctx, x, y, size, size, radius);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;

                // Eyes on head
                if (isHead) {
                    const eyeOffsetX = directionRef.current.x * 4;
                    const eyeOffsetY = directionRef.current.y * 4;
                    const cx = segment.x * cellSize + cellSize / 2;
                    const cy = segment.y * cellSize + cellSize / 2;

                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(cx + eyeOffsetX - 4, cy + eyeOffsetY - 2, 4.5, 0, Math.PI * 2);
                    ctx.arc(cx + eyeOffsetX + 4, cy + eyeOffsetY - 2, 4.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(cx + eyeOffsetX - 4 + directionRef.current.x * 1.5, cy + eyeOffsetY - 2 + directionRef.current.y * 1.5, 2.5, 0, Math.PI * 2);
                    ctx.arc(cx + eyeOffsetX + 4 + directionRef.current.x * 1.5, cy + eyeOffsetY - 2 + directionRef.current.y * 1.5, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw food
            const food = foodRef.current;
            food.pulse = (food.pulse + 0.1) % (Math.PI * 2);
            const foodPulse = Math.sin(food.pulse) * 2.5;

            const foodColors = { normal: '#FF5252', golden: '#FFD700', super: '#E040FB' };
            const foodGlows = { normal: '#FF5252', golden: '#FFD700', super: '#E040FB' };

            ctx.shadowColor = foodGlows[food.type];
            ctx.shadowBlur = food.type === 'super' ? 8 : 5;

            const foodGradient = ctx.createRadialGradient(
                food.x * cellSize + cellSize / 2,
                food.y * cellSize + cellSize / 2,
                0,
                food.x * cellSize + cellSize / 2,
                food.y * cellSize + cellSize / 2,
                cellSize / 2
            );
            foodGradient.addColorStop(0, food.type === 'super' ? '#FF80AB' : food.type === 'golden' ? '#FFECB3' : '#FF8A80');
            foodGradient.addColorStop(1, foodColors[food.type]);
            ctx.fillStyle = foodGradient;
            ctx.beginPath();
            ctx.arc(
                food.x * cellSize + cellSize / 2,
                food.y * cellSize + cellSize / 2,
                cellSize / 2 - 2 + foodPulse,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Food icon
            ctx.shadowBlur = 0;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFF';
            const icons = { normal: '🍎', golden: '⭐', super: '💎' };
            ctx.fillText(icons[food.type], food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2 + 1);

            // Draw power-up
            if (powerUpRef.current) {
                const pu = powerUpRef.current;
                const puColors = { speed: '#00FF00', slow: '#00BFFF', bonus: '#FFD700', ghost: '#9C27B0', magnet: '#FF5722' };
                const puIcons = { speed: '⚡', slow: '❄️', bonus: '🌟', ghost: '👻', magnet: '🧲' };

                ctx.shadowColor = puColors[pu.type];
                ctx.shadowBlur = 8;
                ctx.fillStyle = puColors[pu.type];
                ctx.beginPath();
                ctx.arc(pu.x * cellSize + cellSize / 2, pu.y * cellSize + cellSize / 2,
                    cellSize / 2 + Math.sin(Date.now() / 80) * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.font = '14px Arial';
                ctx.fillStyle = '#000';
                ctx.fillText(puIcons[pu.type], pu.x * cellSize + cellSize / 2, pu.y * cellSize + cellSize / 2 + 1);
            }

            // Particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.12;
                p.life -= 0.02;

                if (p.life > 0) {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                return p.life > 0;
            });

            // UI
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 22px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`Score: ${currentScore}`, 12, 12);

            // Combo
            if (currentCombo > 1) {
                ctx.fillStyle = `hsl(${currentCombo * 25}, 100%, 60%)`;
                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.fillText(`${currentCombo}x COMBO!`, 12, 40);
            }

            // Length
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '13px "Segoe UI", sans-serif';
            ctx.fillText(`Length: ${snakeRef.current.length}`, 12, currentCombo > 1 ? 65 : 40);

            // Status effects
            let statusY = 12;
            ctx.textAlign = 'right';
            if (rainbowModeRef.current) {
                ctx.fillStyle = `hsl(${Date.now() / 5 % 360}, 100%, 60%)`;
                ctx.fillText('🌈 RAINBOW', canvas.width - 12, statusY);
                statusY += 22;
            }
            if (ghostModeRef.current) {
                ctx.fillStyle = '#9C27B0';
                ctx.fillText('👻 GHOST', canvas.width - 12, statusY);
                statusY += 22;
            }
            if (speedMultiplierRef.current !== 1) {
                ctx.fillStyle = speedMultiplierRef.current > 1 ? '#00FF00' : '#00BFFF';
                ctx.fillText(speedMultiplierRef.current > 1 ? '⚡ FAST' : '❄️ SLOW', canvas.width - 12, statusY);
            }

            ctx.shadowBlur = 0;
        };

        const endGame = (finalScore: number) => {
            setGameOver(true);
            createParticles(snakeRef.current[0].x, snakeRef.current[0].y, '#FF0000', 25);
            if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem('snake_highscore', finalScore.toString());
            }
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isOpen, gameStarted, gameOver, paused, score, combo, highScore, gameMode, createParticles, spawnFood, spawnPowerUp, generateObstacles]);

    const startGame = () => {
        snakeRef.current = [{ x: 10, y: 10 }];
        directionRef.current = { x: 1, y: 0 };
        nextDirectionRef.current = { x: 1, y: 0 };
        foodRef.current = { x: 15, y: 15, type: 'normal', pulse: 0 };
        powerUpRef.current = null;
        particlesRef.current = [];
        speedMultiplierRef.current = 1;
        rainbowModeRef.current = false;
        ghostModeRef.current = false;
        lastEatTimeRef.current = 0;
        setScore(0);
        setCombo(0);
        setPaused(false);
        setGameOver(false);
        setGameStarted(true);

        // Generate obstacles after state is set
        setTimeout(() => {
            if (gameMode === 'obstacles') {
                generateObstacles();
            }
        }, 0);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="snake-overlay" onClick={onClose} />
            <div className="snake-modal">
                <div className="snake-header">
                    <h2>🐍 Snake</h2>
                    <div className="snake-high-score">🏆 {highScore}</div>
                    <button className="snake-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="snake-content">
                    {!gameStarted ? (
                        <div className="snake-start">
                            <div className="snake-icon">🐍</div>
                            <h3>Classic Snake!</h3>
                            <p>Arrow Keys or WASD to move</p>
                            <p className="snake-controls-hint">ESC or P to pause</p>

                            <div className="snake-mode-select">
                                <label>Game Mode</label>
                                <div className="snake-modes">
                                    {(Object.keys(MODES) as GameMode[]).map(m => (
                                        <button
                                            key={m}
                                            className={`mode-btn ${gameMode === m ? 'active' : ''}`}
                                            onClick={() => setGameMode(m)}
                                        >
                                            <span className="mode-icon">{MODES[m].icon}</span>
                                            <span className="mode-name">{MODES[m].name}</span>
                                            <span className="mode-desc">{MODES[m].desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="snake-food-info">
                                <span>🍎 +10</span>
                                <span>⭐ +25</span>
                                <span>💎 +50</span>
                            </div>

                            <div className="snake-powerup-info">
                                <span>⚡ Speed</span>
                                <span>❄️ Slow</span>
                                <span>🌟 Rainbow</span>
                                <span>👻 Ghost</span>
                                <span>🧲 Magnet</span>
                            </div>

                            <button className="snake-button" onClick={startGame}>
                                Start Game
                            </button>
                        </div>
                    ) : gameOver ? (
                        <div className="snake-over">
                            <div className="snake-over-icon">💀</div>
                            <h3>Game Over!</h3>
                            <div className="snake-final-score">
                                <span className="score-value">{score}</span>
                                <span className="score-label">Score</span>
                            </div>
                            <div className="snake-stats">
                                <span>Length: {snakeRef.current.length}</span>
                                <span>Max Combo: {combo}x</span>
                            </div>
                            {score >= highScore && score > 0 && (
                                <p className="snake-new-high">🏆 New High Score!</p>
                            )}
                            <button className="snake-button" onClick={startGame}>
                                Play Again
                            </button>
                        </div>
                    ) : null}

                    <canvas
                        ref={canvasRef}
                        className="snake-canvas"
                        style={{ display: gameStarted && !gameOver ? 'block' : 'none' }}
                    />
                </div>
            </div>
        </>
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
