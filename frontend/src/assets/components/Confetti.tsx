import React, { useEffect, useRef } from 'react';
import './Confetti.css';

interface ConfettiParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    size: number;
}

interface ConfettiProps {
    isActive: boolean;
    onComplete: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ isActive, onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<ConfettiParticle[]>([]);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create confetti particles
        const colors = ['#ff6b9d', '#6366f1', '#8b5cf6', '#00b4d8', '#4caf50', '#f59e0b'];
        const particleCount = 100;

        particlesRef.current = Array.from({ length: particleCount }, (_) => ({
            x: Math.random() * canvas.width,
            y: -20,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 5 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
        }));

        let startTime = Date.now();
        const duration = 3000; // 3 seconds

        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                onComplete();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.2; // Gravity
                particle.rotation += particle.rotationSpeed;

                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate((particle.rotation * Math.PI) / 180);
                ctx.fillStyle = particle.color;
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return <canvas ref={canvasRef} className="confetti-canvas" />;
};
