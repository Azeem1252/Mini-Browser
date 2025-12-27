import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BreakoutGame.css';

interface BreakoutGameProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Brick {
    x: number;
    y: number;
    visible: boolean;
    color: string;
    glowColor: string;
    points: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
}

interface PowerUp {
    x: number;
    y: number;
    type: 'wide' | 'multi' | 'slow';
    vy: number;
}

interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({ isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        return parseInt(localStorage.getItem('breakout_highscore') || '0');
    });

    const paddleRef = useRef({ x: 160, width: 80, height: 12, baseWidth: 80 });
    const ballsRef = useRef<Ball[]>([{ x: 200, y: 350, dx: 4, dy: -4, radius: 8 }]);
    const bricksRef = useRef<Brick[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const trailRef = useRef<{ x: number, y: number, alpha: number }[]>([]);
    const animationRef = useRef<number | undefined>(undefined);
    const lastComboTimeRef = useRef(0);
    const shakeRef = useRef({ x: 0, y: 0, duration: 0 });

    const CANVAS_WIDTH = 450;
    const CANVAS_HEIGHT = 550;

    const createBricks = useCallback((lvl: number) => {
        const bricks: Brick[] = [];
        const colorSets = [
            // Level 1 - Classic rainbow
            [
                { color: '#FF6B6B', glow: '#ff0000', points: 50 },
                { color: '#FFE66D', glow: '#ffcc00', points: 40 },
                { color: '#4ECDC4', glow: '#00ffcc', points: 30 },
                { color: '#6366F1', glow: '#4444ff', points: 20 },
                { color: '#A855F7', glow: '#aa00ff', points: 10 },
            ],
            // Level 2 - Neon
            [
                { color: '#00FF87', glow: '#00ff00', points: 60 },
                { color: '#FF00FF', glow: '#ff00ff', points: 50 },
                { color: '#00BFFF', glow: '#00bfff', points: 40 },
                { color: '#FF6600', glow: '#ff6600', points: 30 },
                { color: '#FFFF00', glow: '#ffff00', points: 20 },
                { color: '#FF0066', glow: '#ff0066', points: 10 },
            ],
            // Level 3 - Galaxy
            [
                { color: '#E040FB', glow: '#e040fb', points: 70 },
                { color: '#7C4DFF', glow: '#7c4dff', points: 60 },
                { color: '#536DFE', glow: '#536dfe', points: 50 },
                { color: '#448AFF', glow: '#448aff', points: 40 },
                { color: '#40C4FF', glow: '#40c4ff', points: 30 },
                { color: '#18FFFF', glow: '#18ffff', points: 20 },
                { color: '#64FFDA', glow: '#64ffda', points: 10 },
            ],
        ];

        const colors = colorSets[(lvl - 1) % colorSets.length];
        const rows = Math.min(5 + lvl, 7);
        const cols = 9;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const colorData = colors[row % colors.length];
                bricks.push({
                    x: col * 50,
                    y: row * 25 + 40,
                    visible: true,
                    color: colorData.color,
                    glowColor: colorData.glow,
                    points: colorData.points,
                });
            }
        }
        return bricks;
    }, []);

    const createParticles = (x: number, y: number, color: string, count: number = 12) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            newParticles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 1,
                size: 3 + Math.random() * 4,
            });
        }
        particlesRef.current.push(...newParticles);
    };

    const spawnPowerUp = (x: number, y: number) => {
        if (Math.random() < 0.15) { // 15% chance
            const types: ('wide' | 'multi' | 'slow')[] = ['wide', 'multi', 'slow'];
            powerUpsRef.current.push({
                x,
                y,
                type: types[Math.floor(Math.random() * types.length)],
                vy: 2,
            });
        }
    };

    const activatePowerUp = (type: 'wide' | 'multi' | 'slow') => {
        switch (type) {
            case 'wide':
                paddleRef.current.width = paddleRef.current.baseWidth * 1.5;
                setTimeout(() => {
                    paddleRef.current.width = paddleRef.current.baseWidth;
                }, 8000);
                break;
            case 'multi':
                const mainBall = ballsRef.current[0];
                if (mainBall) {
                    ballsRef.current.push(
                        { ...mainBall, dx: mainBall.dx + 2, dy: mainBall.dy - 1 },
                        { ...mainBall, dx: mainBall.dx - 2, dy: mainBall.dy - 1 }
                    );
                }
                break;
            case 'slow':
                ballsRef.current.forEach(ball => {
                    ball.dx *= 0.6;
                    ball.dy *= 0.6;
                });
                setTimeout(() => {
                    ballsRef.current.forEach(ball => {
                        ball.dx /= 0.6;
                        ball.dy /= 0.6;
                    });
                }, 5000);
                break;
        }
    };

    useEffect(() => {
        if (!isOpen || !gameStarted || gameOver || won) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        if (bricksRef.current.length === 0) {
            bricksRef.current = createBricks(level);
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            paddleRef.current.x = Math.max(0, Math.min(mouseX - paddleRef.current.width / 2, canvas.width - paddleRef.current.width));
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        let currentScore = score;
        let currentLives = lives;
        let currentCombo = combo;

        const gameLoop = () => {
            // Screen shake
            let offsetX = 0, offsetY = 0;
            if (shakeRef.current.duration > 0) {
                offsetX = (Math.random() - 0.5) * shakeRef.current.x;
                offsetY = (Math.random() - 0.5) * shakeRef.current.y;
                shakeRef.current.duration--;
            }

            ctx.save();
            ctx.translate(offsetX, offsetY);

            // Background gradient
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, '#0a0a1a');
            bgGradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

            // Stars background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 30; i++) {
                const sx = (i * 47) % canvas.width;
                const sy = (i * 31 + Date.now() * 0.01) % canvas.height;
                ctx.beginPath();
                ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                ctx.fill();
            }

            const paddle = paddleRef.current;

            // Update and draw balls
            ballsRef.current = ballsRef.current.filter((ball, _index) => {
                // Add to trail
                trailRef.current.push({ x: ball.x, y: ball.y, alpha: 1 });
                if (trailRef.current.length > 15) trailRef.current.shift();

                // Move ball
                ball.x += ball.dx;
                ball.y += ball.dy;

                // Wall collision
                if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
                    ball.dx = -ball.dx;
                }
                if (ball.y - ball.radius < 0) {
                    ball.dy = -ball.dy;
                }

                // Paddle collision
                if (
                    ball.y + ball.radius > canvas.height - paddle.height - 5 &&
                    ball.y + ball.radius < canvas.height &&
                    ball.x > paddle.x - 5 &&
                    ball.x < paddle.x + paddle.width + 5
                ) {
                    ball.dy = -Math.abs(ball.dy);
                    const hitPos = (ball.x - paddle.x) / paddle.width;
                    ball.dx = (hitPos - 0.5) * 10;
                    currentCombo = 0;
                    setCombo(0);
                }

                // Bottom collision
                if (ball.y + ball.radius > canvas.height) {
                    if (ballsRef.current.length === 1) {
                        currentLives--;
                        setLives(currentLives);
                        if (currentLives <= 0) {
                            setGameOver(true);
                            if (currentScore > highScore) {
                                setHighScore(currentScore);
                                localStorage.setItem('breakout_highscore', currentScore.toString());
                            }
                        } else {
                            ball.x = 200;
                            ball.y = 350;
                            ball.dx = 4;
                            ball.dy = -4;
                        }
                    }
                    return ballsRef.current.length === 1;
                }

                return true;
            });

            // Brick collision
            bricksRef.current.forEach((brick) => {
                if (!brick.visible) return;

                ballsRef.current.forEach((ball) => {
                    if (
                        ball.x > brick.x - ball.radius &&
                        ball.x < brick.x + 50 + ball.radius &&
                        ball.y > brick.y - ball.radius &&
                        ball.y < brick.y + 25 + ball.radius
                    ) {
                        ball.dy = -ball.dy;
                        brick.visible = false;

                        // Combo system
                        const now = Date.now();
                        if (now - lastComboTimeRef.current < 1000) {
                            currentCombo++;
                        } else {
                            currentCombo = 1;
                        }
                        lastComboTimeRef.current = now;
                        setCombo(currentCombo);

                        const comboMultiplier = Math.min(currentCombo, 10);
                        const points = brick.points * comboMultiplier;
                        currentScore += points;
                        setScore(currentScore);

                        // Effects
                        createParticles(brick.x + 25, brick.y + 12, brick.color);
                        shakeRef.current = { x: 4, y: 4, duration: 5 };
                        spawnPowerUp(brick.x + 25, brick.y + 12);
                    }
                });
            });

            // Check level complete
            if (bricksRef.current.every((brick) => !brick.visible)) {
                if (level < 3) {
                    setLevel(level + 1);
                    bricksRef.current = createBricks(level + 1);
                    ballsRef.current = [{ x: 200, y: 350, dx: 4 + level * 0.5, dy: -4 - level * 0.5, radius: 8 }];
                    paddleRef.current.width = paddleRef.current.baseWidth;
                } else {
                    setWon(true);
                    if (currentScore > highScore) {
                        setHighScore(currentScore);
                        localStorage.setItem('breakout_highscore', currentScore.toString());
                    }
                }
            }

            // Update power-ups
            powerUpsRef.current = powerUpsRef.current.filter((powerUp) => {
                powerUp.y += powerUp.vy;

                // Check paddle collision
                if (
                    powerUp.y > canvas.height - paddle.height - 15 &&
                    powerUp.x > paddle.x &&
                    powerUp.x < paddle.x + paddle.width
                ) {
                    activatePowerUp(powerUp.type);
                    createParticles(powerUp.x, powerUp.y, '#fff', 8);
                    return false;
                }

                return powerUp.y < canvas.height;
            });

            // Update particles
            particlesRef.current = particlesRef.current.filter((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= 0.02;
                return p.life > 0;
            });

            // Update trail
            trailRef.current.forEach((t) => {
                t.alpha -= 0.08;
            });
            trailRef.current = trailRef.current.filter((t) => t.alpha > 0);

            // Draw bricks with glow
            bricksRef.current.forEach((brick) => {
                if (brick.visible) {
                    // Glow
                    ctx.shadowColor = brick.glowColor;
                    ctx.shadowBlur = 15;

                    // Brick gradient
                    const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + 25);
                    brickGradient.addColorStop(0, brick.color);
                    brickGradient.addColorStop(1, adjustColor(brick.color, -30));
                    ctx.fillStyle = brickGradient;

                    // Rounded rect
                    roundRect(ctx, brick.x + 1, brick.y + 1, 48, 23, 4);
                    ctx.fill();

                    // Highlight
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    roundRect(ctx, brick.x + 3, brick.y + 3, 44, 8, 3);
                    ctx.fill();
                }
            });

            ctx.shadowBlur = 0;

            // Draw power-ups
            powerUpsRef.current.forEach((powerUp) => {
                const colors = { wide: '#00ff88', multi: '#ff00ff', slow: '#00aaff' };
                const icons = { wide: '⟷', multi: '⚡', slow: '❄' };
                ctx.fillStyle = colors[powerUp.type];
                ctx.shadowColor = colors[powerUp.type];
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(powerUp.x, powerUp.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(icons[powerUp.type], powerUp.x, powerUp.y + 4);
            });

            // Draw ball trail
            trailRef.current.forEach((t, _i) => {
                ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw paddle with glow
            ctx.shadowColor = '#6366F1';
            ctx.shadowBlur = 20;
            const paddleGradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
            paddleGradient.addColorStop(0, '#6366F1');
            paddleGradient.addColorStop(0.5, '#8B5CF6');
            paddleGradient.addColorStop(1, '#6366F1');
            ctx.fillStyle = paddleGradient;
            roundRect(ctx, paddle.x, canvas.height - paddle.height - 5, paddle.width, paddle.height, 6);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw balls with glow
            ballsRef.current.forEach((ball) => {
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 20;
                const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.radius);
                ballGradient.addColorStop(0, '#fff');
                ballGradient.addColorStop(1, '#ddd');
                ctx.fillStyle = ballGradient;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Draw particles
            particlesRef.current.forEach((p) => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // UI
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${currentScore}`, 15, 28);

            ctx.textAlign = 'center';
            ctx.fillText(`Level ${level}`, canvas.width / 2, 28);

            // Combo display
            if (currentCombo > 1) {
                ctx.fillStyle = `hsl(${currentCombo * 30}, 100%, 60%)`;
                ctx.font = 'bold 24px "Segoe UI", sans-serif';
                ctx.fillText(`${currentCombo}x COMBO!`, canvas.width / 2, 55);
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`Lives: ${'❤'.repeat(currentLives)}`, canvas.width - 15, 28);

            ctx.restore();

            animationRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isOpen, gameStarted, gameOver, won, level, createBricks, highScore]);

    const startGame = () => {
        bricksRef.current = createBricks(1);
        ballsRef.current = [{ x: 200, y: 350, dx: 4, dy: -4, radius: 8 }];
        paddleRef.current = { x: 160, width: 80, height: 12, baseWidth: 80 };
        particlesRef.current = [];
        powerUpsRef.current = [];
        trailRef.current = [];
        setScore(0);
        setLives(3);
        setLevel(1);
        setCombo(0);
        setGameOver(false);
        setWon(false);
        setGameStarted(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="breakout-overlay" onClick={onClose} />
            <div className="breakout-modal">
                <div className="breakout-header">
                    <h2>🧱 Breakout</h2>
                    <div className="breakout-high-score">🏆 {highScore}</div>
                    <button className="breakout-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="breakout-content">
                    {!gameStarted ? (
                        <div className="breakout-start">
                            <div className="breakout-title-icon">🎮</div>
                            <h3>Break all the bricks!</h3>
                            <p>Move mouse to control paddle</p>
                            <div className="breakout-features">
                                <span>🌟 3 Levels</span>
                                <span>⚡ Power-ups</span>
                                <span>🔥 Combo System</span>
                            </div>
                            <button className="breakout-button" onClick={startGame}>
                                Start Game
                            </button>
                        </div>
                    ) : gameOver ? (
                        <div className="breakout-over">
                            <div className="breakout-over-icon">💥</div>
                            <h3>Game Over!</h3>
                            <p className="breakout-score">Score: {score}</p>
                            {score >= highScore && score > 0 && (
                                <p className="breakout-new-high">🏆 New High Score!</p>
                            )}
                            <button className="breakout-button" onClick={startGame}>
                                Try Again
                            </button>
                        </div>
                    ) : won ? (
                        <div className="breakout-won">
                            <div className="breakout-won-icon">🎉</div>
                            <h3>You Won!</h3>
                            <p className="breakout-score">Final Score: {score}</p>
                            {score >= highScore && (
                                <p className="breakout-new-high">🏆 New High Score!</p>
                            )}
                            <button className="breakout-button" onClick={startGame}>
                                Play Again
                            </button>
                        </div>
                    ) : null}

                    <canvas
                        ref={canvasRef}
                        className="breakout-canvas"
                        style={{ display: gameStarted && !gameOver && !won ? 'block' : 'none' }}
                    />
                </div>
            </div>
        </>
    );
};

// Helper functions
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

function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `rgb(${r},${g},${b})`;
}
