import React, { useEffect, useRef } from 'react';
import './ParticleBackground.css';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

interface ParticleBackgroundProps {
    theme: 'dark' | 'light';
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | undefined>(undefined);

    const particleCount = 80; // Increased from default
    const connectionDistance = 150; // Increased connection range

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize particles with better visibility
        // The `particleCount` here refers to the local `const particleCount = 50;`
        // The user's provided code snippet for initialization uses `particleCount` without `const`
        // and seems to imply using the top-level `particleCount = 80`.
        // However, the instruction explicitly shows `particlesRef.current = Array.from({ length: particleCount }, () => ({...}))`
        // right after the comment change, which means it's replacing the existing initialization.
        // The existing initialization uses a local `particleCount = 50`.
        // I will remove the local `const particleCount = 50;` and use the top-level `particleCount = 80;` as intended by the user's edit.
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 3 + 2, // Larger particles (2-5px)
            opacity: Math.random() * 0.4 + 0.6, // Brighter (0.6-1.0)
        }));

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;
            const mouse = mouseRef.current;

            // Determine particle color based on theme
            const particleColor = theme === 'dark' ? 'rgb(99, 102, 241)' : 'rgb(99, 102, 241)';


            particles.forEach((particle) => {
                // Mouse interaction
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.vx -= (dx / distance) * force * 0.2;
                    particle.vy -= (dy / distance) * force * 0.2;
                }

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Damping
                particle.vx *= 0.99;
                particle.vy *= 0.99;

                // Boundaries
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));
            });

            // Draw particles with glow
            particles.forEach((particle) => {
                // Glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = particleColor;

                ctx.fillStyle = particleColor;
                ctx.globalAlpha = particle.opacity;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0; // Reset shadow for connections
            });

            // Draw connections with better visibility
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = (1 - distance / connectionDistance) * (theme === 'dark' ? 0.4 : 0.2); // Brighter lines, adjusted for theme
                        ctx.strokeStyle = particleColor;
                        ctx.globalAlpha = opacity;
                        ctx.lineWidth = 1.5; // Thicker lines
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1; // Reset globalAlpha after drawing connections

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="particle-background" />;
};
