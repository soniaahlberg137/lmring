'use client';

import { cn } from '@lmring/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ParticlesProps = {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  color?: string;
  vx?: number;
  vy?: number;
};

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const hexInt = Number.parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

export function ParticlesBackground({
  className,
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  color = '#ffffff',
  vx = 0,
  vy = 0,
}: ParticlesProps) {
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dpr, setDpr] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  const rgb = useMemo(() => hexToRgb(color), [color]);

  const createCircle = useCallback(
    (width: number, height: number): Circle => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const pSize = Math.random() * 2 + size;
      const alpha = 0;
      const targetAlpha = Math.random() * 0.6 + 0.1;
      const dx = (Math.random() - 0.5) * 0.1;
      const dy = (Math.random() - 0.5) * 0.1;
      const magnetism = 0.1 + Math.random() * 4;
      return {
        x,
        y,
        translateX: 0,
        translateY: 0,
        size: pSize,
        alpha,
        targetAlpha,
        dx,
        dy,
        magnetism,
      };
    },
    [size],
  );

  useEffect(() => {
    if (canvasRef) {
      setContext(canvasRef.getContext('2d'));
    }
  }, [canvasRef]);

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1);
  }, []);

  useEffect(() => {
    if (!containerRef || !canvasRef || !context) return;

    const initCanvas = () => {
      const rect = containerRef.getBoundingClientRect();
      canvasRef.width = rect.width * dpr;
      canvasRef.height = rect.height * dpr;
      canvasRef.style.width = `${rect.width}px`;
      canvasRef.style.height = `${rect.height}px`;
      context.scale(dpr, dpr);

      const newCircles: Circle[] = [];
      for (let i = 0; i < quantity; i++) {
        newCircles.push(createCircle(rect.width, rect.height));
      }
      setCircles(newCircles);
    };

    const handleResize = () => {
      initCanvas();
    };

    initCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef, canvasRef, context, dpr, quantity, createCircle]);

  useEffect(() => {
    if (!containerRef || !canvasRef || !context || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    containerRef.addEventListener('mousemove', handleMouseMove);
    return () => {
      containerRef.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef, canvasRef, context, prefersReducedMotion]);

  useEffect(() => {
    if (!context || !canvasRef || !containerRef || circles.length === 0) return;

    let animationFrameId: number;
    const rect = containerRef.getBoundingClientRect();

    const animate = () => {
      context.clearRect(0, 0, rect.width, rect.height);

      circles.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          rect.width - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          rect.height - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = Math.min(...edge);
        const remapClosestEdge = Math.max(0, Math.min(1, closestEdge / 20));

        circle.alpha += (Math.min(remapClosestEdge, circle.targetAlpha) - circle.alpha) * 0.08;

        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mousePosition.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY +=
          (mousePosition.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        if (circle.x < -circle.size) circle.x = rect.width + circle.size;
        if (circle.x > rect.width + circle.size) circle.x = -circle.size;
        if (circle.y < -circle.size) circle.y = rect.height + circle.size;
        if (circle.y > rect.height + circle.size) circle.y = -circle.size;

        context.beginPath();
        context.arc(
          circle.x + circle.translateX,
          circle.y + circle.translateY,
          circle.size,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(${rgb.join(', ')}, ${circle.alpha})`;
        context.fill();

        circles[i] = circle;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [circles, context, canvasRef, containerRef, mousePosition, rgb, ease, staticity, vx, vy]);

  return (
    <div
      ref={setContainerRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      <canvas ref={setCanvasRef} className="h-full w-full" />
    </div>
  );
}

type SparklesProps = {
  className?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
};

export function SparklesEffect({ className, count = 30, minSize = 1, maxSize = 2 }: SparklesProps) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: Math.random() * (maxSize - minSize) + minSize,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 1,
      })),
    [count, minSize, maxSize],
  );

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            boxShadow: `0 0 ${sparkle.size * 3}px ${sparkle.size}px hsl(var(--primary) / 0.4)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 3 + 1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
