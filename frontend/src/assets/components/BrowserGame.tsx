import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BrowserGame.css';

interface BrowserGameProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Bird {
    y: number;
    velocity: number;
}

interface Pipe {
    x: number;
    gap: number;
    gapY: number;
    passed: boolean;
    isGolden: boolean;
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

interface Cloud {
    x: number;
    y: number;
    width: number;
    speed: number;
}

interface ScorePopup {
    x: number;
    y: number;
    value: string;
    life: number;
    color: string;
}

type Theme = 'day' | 'sunset' | 'night';

const THEMES: Record<Theme, { sky: string[]; pipe: string[]; ground: string; goldenPipe: string[] }> = {
    day: {
        sky: ['#87CEEB', '#E0F6FF'],
        pipe: ['#2E7D32', '#4CAF50', '#1B5E20'],
        goldenPipe: ['#FFD700', '#FFC107', '#FF8F00'],
        ground: '#8B4513',
    },
    sunset: {
        sky: ['#FF7E5F', '#FEB47B', '#FFE66D'],
        pipe: ['#5D4037', '#8D6E63', '#3E2723'],
        goldenPipe: ['#FFD700', '#FFC107', '#FF8F00'],
        ground: '#4E342E',
    },
    night: {
        sky: ['#0F0C29', '#302B63', '#24243E'],
        pipe: ['#1A237E', '#3949AB', '#0D47A1'],
        goldenPipe: ['#FFD700', '#FFC107', '#FF8F00'],
        ground: '#1A1A2E',
    },
};

const MEDALS = [
    { min: 0, medal: '', name: '' },
    { min: 5, medal: '🥉', name: 'Bronze' },
    { min: 15, medal: '🥈', name: 'Silver' },
    { min: 30, medal: '🥇', name: 'Gold' },
    { min: 50, medal: '💎', name: 'Diamond' },
];

export const BrowserGame: React.FC<BrowserGameProps> = ({ isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [theme, setTheme] = useState<Theme>('day');
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('browser_game_highscore');
        return saved ? parseInt(saved) : 0;
    });

    const birdRef = useRef<Bird>({ y: 250, velocity: 0 });
    const pipesRef = useRef<Pipe[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cloudsRef = useRef<Cloud[]>([]);
    const scorePopupsRef = useRef<ScorePopup[]>([]);
    const animationRef = useRef<number | undefined>(undefined);
    const flapAnimRef = useRef(0);
    const groundOffsetRef = useRef(0);
    const deathAnimRef = useRef(0);

    const CANVAS_WIDTH = 420;
    const CANVAS_HEIGHT = 550;

    const getMedal = (s: number) => {
        for (let i = MEDALS.length - 1; i >= 0; i--) {
            if (s >= MEDALS[i].min) return MEDALS[i];
        }
        return MEDALS[0];
    };

    const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            particlesRef.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: 2 + Math.random() * 3,
            });
        }
    }, []);

    const addScorePopup = useCallback((x: number, y: number, value: string, color: string) => {
        scorePopupsRef.current.push({ x, y, value, life: 1, color });
    }, []);

    const initClouds = useCallback(() => {
        cloudsRef.current = [];
        for (let i = 0; i < 6; i++) {
            cloudsRef.current.push({
                x: Math.random() * CANVAS_WIDTH,
                y: 30 + Math.random() * 120,
                width: 50 + Math.random() * 70,
                speed: 0.2 + Math.random() * 0.4,
            });
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !gameStarted || gameOver) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const gravity = 0.32;       // Gentler gravity (was 0.4)
        const jump = -8;            // Stronger jump (was -7.5)
        const pipeWidth = 60;       // Slightly narrower pipes
        const pipeGap = 175;        // Wider gap for easier play (was 165)

        if (cloudsRef.current.length === 0) initClouds();

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !gameOver) {
                e.preventDefault();
                if (paused) {
                    setPaused(false);
                    return;
                }
                birdRef.current.velocity = jump;
                flapAnimRef.current = 12;
                createParticles(80, birdRef.current.y, '#FFD700', 6);
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                setPaused(p => !p);
            }
        };

        const handleClick = () => {
            if (!gameOver && !paused) {
                birdRef.current.velocity = jump;
                flapAnimRef.current = 12;
                createParticles(80, birdRef.current.y, '#FFD700', 6);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        canvas.addEventListener('click', handleClick);

        if (pipesRef.current.length === 0) {
            pipesRef.current = [
                { x: 500, gap: pipeGap, gapY: 180, passed: false, isGolden: false },
                { x: 780, gap: pipeGap, gapY: 220, passed: false, isGolden: false },
                { x: 1060, gap: pipeGap, gapY: 260, passed: false, isGolden: Math.random() < 0.15 },
            ];
        }

        let currentScore = score;

        const gameLoop = () => {
            if (gameOver) return;
            if (paused) {
                // Draw pause overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 36px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⏸️ PAUSED', canvas.width / 2, canvas.height / 2);
                ctx.font = '18px "Segoe UI", sans-serif';
                ctx.fillText('Press SPACE or P to resume', canvas.width / 2, canvas.height / 2 + 40);
                animationRef.current = requestAnimationFrame(gameLoop);
                return;
            }

            const themeColors = THEMES[theme];

            // Sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            themeColors.sky.forEach((color, i) => {
                skyGradient.addColorStop(i / (themeColors.sky.length - 1), color);
            });
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Stars for night mode
            if (theme === 'night') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 50; i++) {
                    const sx = (i * 47 + Date.now() * 0.005) % canvas.width;
                    const sy = (i * 31) % (canvas.height - 150);
                    const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
                    ctx.globalAlpha = twinkle;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1 + twinkle * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Update and draw clouds
            cloudsRef.current.forEach(cloud => {
                cloud.x -= cloud.speed;
                if (cloud.x + cloud.width < 0) {
                    cloud.x = canvas.width + 50;
                    cloud.y = 30 + Math.random() * 120;
                }

                const cloudAlpha = theme === 'night' ? 0.1 : 0.85;
                ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha})`;
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.width * 0.2, cloud.y - 8, cloud.width * 0.2, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.width * 0.4, cloud.y, cloud.width * 0.28, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.width * 0.6, cloud.y - 5, cloud.width * 0.18, 0, Math.PI * 2);
                ctx.fill();
            });

            // Update bird
            const bird = birdRef.current;
            bird.velocity += gravity;
            bird.y += bird.velocity;
            if (flapAnimRef.current > 0) flapAnimRef.current--;

            // Progressive difficulty
            const baseSpeed = 2.5;
            const speedIncrease = Math.floor(currentScore / 5) * 0.35;
            const currentSpeed = Math.min(baseSpeed + speedIncrease, 5.5);

            groundOffsetRef.current = (groundOffsetRef.current + currentSpeed) % 40;

            // Update and draw pipes
            pipesRef.current.forEach((pipe) => {
                pipe.x -= currentSpeed;

                const pipeColors = pipe.isGolden ? themeColors.goldenPipe : themeColors.pipe;

                // Pipe shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(pipe.x + 6, 0, pipeWidth, pipe.gapY);
                ctx.fillRect(pipe.x + 6, pipe.gapY + pipe.gap, pipeWidth, canvas.height);

                // Golden pipe glow
                if (pipe.isGolden) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 20;
                }

                // Top pipe
                const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
                topGradient.addColorStop(0, pipeColors[0]);
                topGradient.addColorStop(0.5, pipeColors[1]);
                topGradient.addColorStop(1, pipeColors[0]);
                ctx.fillStyle = topGradient;
                ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);

                // Pipe cap
                ctx.fillStyle = pipeColors[2] || pipeColors[0];
                roundRect(ctx, pipe.x - 4, pipe.gapY - 25, pipeWidth + 8, 25, 4);
                ctx.fill();

                // Bottom pipe
                ctx.fillStyle = topGradient;
                ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, pipeWidth, canvas.height);

                // Bottom cap
                ctx.fillStyle = pipeColors[2] || pipeColors[0];
                roundRect(ctx, pipe.x - 4, pipe.gapY + pipe.gap, pipeWidth + 8, 25, 4);
                ctx.fill();

                ctx.shadowBlur = 0;

                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(pipe.x + 6, 0, 10, pipe.gapY);
                ctx.fillRect(pipe.x + 6, pipe.gapY + pipe.gap, 10, canvas.height);

                // Collision
                if (
                    80 + 14 > pipe.x &&
                    80 - 14 < pipe.x + pipeWidth &&
                    (bird.y - 12 < pipe.gapY || bird.y + 12 > pipe.gapY + pipe.gap)
                ) {
                    setGameOver(true);
                    deathAnimRef.current = 1;
                    createParticles(80, bird.y, '#FF0000', 20);
                    if (currentScore > highScore) {
                        setHighScore(currentScore);
                        localStorage.setItem('browser_game_highscore', currentScore.toString());
                    }
                }

                // Score
                if (!pipe.passed && pipe.x + pipeWidth < 80) {
                    pipe.passed = true;
                    const points = pipe.isGolden ? 5 : 1;
                    currentScore += points;
                    setScore(currentScore);

                    const popupColor = pipe.isGolden ? '#FFD700' : '#00FF00';
                    const popupText = pipe.isGolden ? '+5 ⭐' : '+1';
                    addScorePopup(80, bird.y - 30, popupText, popupColor);
                    createParticles(80, bird.y, popupColor, 8);
                }

                // Reset pipe
                if (pipe.x < -pipeWidth) {
                    const rightmostX = Math.max(...pipesRef.current.map(p => p.x));
                    pipe.x = Math.max(500, rightmostX + 260);
                    pipe.passed = false;
                    pipe.isGolden = Math.random() < 0.12;
                    const minY = 90;
                    const maxY = canvas.height - pipe.gap - 110;
                    pipe.gapY = Math.random() * (maxY - minY) + minY;
                }
            });

            // Draw ground
            ctx.fillStyle = themeColors.ground;
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

            // Ground pattern
            ctx.fillStyle = theme === 'night' ? '#2D2D44' : '#654321';
            for (let i = -1; i < canvas.width / 40 + 1; i++) {
                const gx = i * 40 - groundOffsetRef.current;
                ctx.fillRect(gx, canvas.height - 50, 20, 50);
            }

            // Grass
            ctx.fillStyle = theme === 'night' ? '#1B5E20' : '#228B22';
            ctx.fillRect(0, canvas.height - 55, canvas.width, 8);

            // Draw bird
            const rotation = Math.min(Math.max(bird.velocity * 3, -25), 70) * (Math.PI / 180);
            ctx.save();
            ctx.translate(80, bird.y);
            ctx.rotate(rotation);

            const wingOffset = flapAnimRef.current > 0 ? Math.sin(flapAnimRef.current * 0.8) * 8 : Math.sin(Date.now() / 200) * 3;

            // Bird body - rounder and cuter
            const bodyGradient = ctx.createRadialGradient(-2, -2, 3, 0, 0, 20);
            bodyGradient.addColorStop(0, '#FFE44D');
            bodyGradient.addColorStop(0.7, '#FFB800');
            bodyGradient.addColorStop(1, '#E8A000');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Belly highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(-3, 4, 10, 8, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Wing
            ctx.fillStyle = '#E89B00';
            ctx.beginPath();
            ctx.ellipse(-6, wingOffset + 2, 10, 7, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Wing detail
            ctx.fillStyle = '#D08900';
            ctx.beginPath();
            ctx.ellipse(-7, wingOffset + 3, 6, 4, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Tail feathers
            ctx.fillStyle = '#E89B00';
            ctx.beginPath();
            ctx.moveTo(-17, -2);
            ctx.lineTo(-26, -8);
            ctx.lineTo(-24, -2);
            ctx.lineTo(-26, 4);
            ctx.lineTo(-17, 2);
            ctx.closePath();
            ctx.fill();

            // Eye white (larger)
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(9, -5, 7, 0, Math.PI * 2);
            ctx.fill();

            // Eye pupil
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(11, -5, 4, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlight
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(13, -7, 2, 0, Math.PI * 2);
            ctx.fill();

            // Eyebrow (cute detail)
            ctx.strokeStyle = '#C07000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(9, -10, 6, 0.5, 2.6);
            ctx.stroke();

            // Beak - rounder, more bird-like
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.moveTo(16, -2);
            ctx.quadraticCurveTo(28, -1, 26, 2);
            ctx.quadraticCurveTo(20, 6, 16, 4);
            ctx.closePath();
            ctx.fill();

            // Beak highlight
            ctx.fillStyle = '#FF7043';
            ctx.beginPath();
            ctx.moveTo(16, -1);
            ctx.quadraticCurveTo(22, 0, 20, 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Boundaries
            if (bird.y < 0 || bird.y > canvas.height - 60) {
                setGameOver(true);
                deathAnimRef.current = 1;
                createParticles(80, bird.y, '#FF0000', 20);
                if (currentScore > highScore) {
                    setHighScore(currentScore);
                    localStorage.setItem('browser_game_highscore', currentScore.toString());
                }
            }

            // Update particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.12;
                p.life -= 0.025;

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

            // Update score popups
            scorePopupsRef.current = scorePopupsRef.current.filter(sp => {
                sp.y -= 2;
                sp.life -= 0.02;

                if (sp.life > 0) {
                    ctx.globalAlpha = sp.life;
                    ctx.fillStyle = sp.color;
                    ctx.font = 'bold 24px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = sp.color;
                    ctx.shadowBlur = 10;
                    ctx.fillText(sp.value, sp.x, sp.y);
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                }
                return sp.life > 0;
            });

            // UI
            ctx.fillStyle = theme === 'night' ? '#FFF' : '#000';
            ctx.font = 'bold 32px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;
            ctx.fillText(`${currentScore}`, canvas.width / 2, 45);

            // Speed indicator
            ctx.font = '13px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Speed: ${currentSpeed.toFixed(1)}x`, 12, 25);

            // Medal preview
            const medal = getMedal(currentScore);
            if (medal.medal) {
                ctx.font = '20px "Segoe UI", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(medal.medal, canvas.width - 12, 28);
            }

            ctx.shadowBlur = 0;

            animationRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            canvas.removeEventListener('click', handleClick);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isOpen, gameStarted, gameOver, paused, score, highScore, theme, createParticles, addScorePopup, initClouds]);

    const startGame = () => {
        birdRef.current = { y: 250, velocity: 0 };
        pipesRef.current = [];
        particlesRef.current = [];
        scorePopupsRef.current = [];
        cloudsRef.current = [];
        groundOffsetRef.current = 0;
        deathAnimRef.current = 0;
        setScore(0);
        setPaused(false);
        setGameOver(false);
        setGameStarted(true);
    };

    if (!isOpen) return null;

    const earnedMedal = getMedal(score);

    return (
        <>
            <div className="flappy-overlay" onClick={onClose} />
            <div className="flappy-modal">
                <div className="flappy-header">
                    <h2>🐦 Flappy Browser</h2>
                    <div className="flappy-high-score">🏆 {highScore}</div>
                    <button className="flappy-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="flappy-content">
                    {!gameStarted ? (
                        <div className="flappy-start">
                            <div className="flappy-bird-icon">🐦</div>
                            <h3>Flappy Browser!</h3>
                            <p>Press SPACE or TAP to flap</p>
                            <p className="flappy-controls-hint">ESC or P to pause</p>

                            <div className="flappy-theme-select">
                                <label>Theme</label>
                                <div className="flappy-themes">
                                    <button
                                        className={`theme-btn ${theme === 'day' ? 'active' : ''}`}
                                        onClick={() => setTheme('day')}
                                    >☀️ Day</button>
                                    <button
                                        className={`theme-btn ${theme === 'sunset' ? 'active' : ''}`}
                                        onClick={() => setTheme('sunset')}
                                    >🌅 Sunset</button>
                                    <button
                                        className={`theme-btn ${theme === 'night' ? 'active' : ''}`}
                                        onClick={() => setTheme('night')}
                                    >🌙 Night</button>
                                </div>
                            </div>

                            <div className="flappy-medals-info">
                                <span>🥉 5+</span>
                                <span>🥈 15+</span>
                                <span>🥇 30+</span>
                                <span>💎 50+</span>
                            </div>

                            <button className="flappy-button" onClick={startGame}>
                                Start Game
                            </button>
                        </div>
                    ) : gameOver ? (
                        <div className="flappy-over">
                            <div className="flappy-over-icon">💥</div>
                            <h3>Game Over!</h3>

                            {earnedMedal.medal && (
                                <div className="flappy-medal-earned">
                                    <span className="medal-icon">{earnedMedal.medal}</span>
                                    <span className="medal-name">{earnedMedal.name} Medal!</span>
                                </div>
                            )}

                            <div className="flappy-final-score">
                                <span className="score-value">{score}</span>
                                <span className="score-label">Score</span>
                            </div>
                            {score >= highScore && score > 0 && (
                                <p className="flappy-new-high">🏆 New High Score!</p>
                            )}
                            <button className="flappy-button" onClick={startGame}>
                                Play Again
                            </button>
                        </div>
                    ) : null}

                    <canvas
                        ref={canvasRef}
                        className="flappy-canvas"
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
