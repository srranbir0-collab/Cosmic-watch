import React, { useRef, useEffect } from 'react';

export const AuthCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles: Particle[] = [];
    const starCount = 400;

    class Particle {
      x: number;
      y: number;
      z: number;
      angle: number;
      radius: number;
      color: string;
      size: number;
      speed: number;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * (width * 0.8); // Galaxy spread
        this.z = Math.random() * width - width / 2;
        
        // Spiral Distribution
        this.x = width / 2 + Math.cos(this.angle) * this.radius;
        this.y = height / 2 + Math.sin(this.angle) * this.radius;
        
        // Colors
        const colors = ['#00F0FF', '#FF3D00', '#7C3AED', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.size = Math.random() * 2;
        this.speed = 0.0005 + Math.random() * 0.001;
      }

      update() {
        // Rotate around center
        this.angle += this.speed;
        
        // Update spiral position
        // Create 3D-ish rotation effect by manipulating Y scale slightly
        const cx = width / 2;
        const cy = height / 2;
        
        this.x = cx + Math.cos(this.angle) * this.radius;
        this.y = cy + Math.sin(this.angle) * (this.radius * 0.6); // Flattened y for perspective

        // Twinkle
        if (Math.random() > 0.95) {
            this.size = Math.random() * 2.5;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        // Blur effect based on distance from center (approx)
        const dist = Math.sqrt(Math.pow(this.x - width/2, 2) + Math.pow(this.y - height/2, 2));
        const opacity = Math.max(0.1, 1 - (dist / (width/1.5)));
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 4;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < starCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 4, 8, 0.2)'; // Trails
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-void-950">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-void-950/80 pointer-events-none" />
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-electric rounded flex items-center justify-center animate-spin-slow">
                <div className="w-4 h-4 bg-void-950 rotate-45" />
            </div>
            <h1 className="font-hero font-bold text-xl text-white tracking-widest">COSMIC<span className="text-electric">WATCH</span></h1>
        </div>
      </div>
    </div>
  );
};