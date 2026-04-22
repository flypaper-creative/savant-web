import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const NeuralLattice: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<{ x: number, y: number, vx: number, vy: number, size: number, color: string }[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const initParticles = () => {
      const p = [];
      for (let i = 0; i < 100; i++) {
        p.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? '#ff4068' : '#e6c03b'
        });
      }
      setParticles(p);
    };
    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse attraction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx += dx * 0.001;
          p.vy += dy * 0.001;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw lines
        particles.forEach((p2, j) => {
          if (i === j) return;
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - dist2 / 100})`;
            ctx.lineWidth = 0.2;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [particles]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  return (
    <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5" onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-6 left-6 font-mono text-[10px] text-white/40 tracking-[0.5em] ">
        NEURAL_LATTICE_v3.2 // GENERATIVE_MODE: ACTIVE
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[10px] text-white/40 tracking-[0.5em] uppercase">
        NODES: {particles.length} // SYNC: 99.9%
      </div>
    </div>
  );
};
