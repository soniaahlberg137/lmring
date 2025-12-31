'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { AppConfig } from '@/utils/AppConfig';

type FrostedHeaderProps = {
  rightNav?: ReactNode;
  className?: string;
};

export function FrostedHeader({ rightNav, className }: FrostedHeaderProps) {
  return (
    <motion.header
      className={cn(
        'fixed left-1/2 top-4 z-50 flex w-full max-w-3xl -translate-x-1/2 items-center justify-between px-6 py-3',
        className,
      )}
      style={{
        borderRadius: '16px',
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Content container with glass effect */}
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ filter: 'url(#displacementFilter)' }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
      </div>

      {/* Logo */}
      <a href="/" className="relative z-10 flex cursor-pointer items-center justify-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
          <span className="text-sm font-bold text-white">{AppConfig.name.charAt(0)}</span>
        </div>
        <span className="text-lg font-bold text-white">{AppConfig.name}</span>
      </a>

      {/* Right nav */}
      <nav className="relative z-10">
        <ul className="flex items-center gap-2">{rightNav}</ul>
      </nav>

      {/* SVG Filter for displacement/chromatic aberration effect */}
      <svg
        className="pointer-events-none absolute h-0 w-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="displacementFilter" colorInterpolationFilters="sRGB">
            <feImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              href="data:image/svg+xml,%0A%20%20%20%20%3Csvg%20viewBox%3D%220%200%20768%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%20%20%20%20%3Cdefs%3E%0A%20%20%20%20%20%20%20%20%3ClinearGradient%20id%3D%22red%22%20x1%3D%22100%25%22%20y1%3D%220%25%22%20x2%3D%220%25%22%20y2%3D%220%25%22%3E%0A%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230000%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22red%22%2F%3E%0A%20%20%20%20%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%20%20%20%20%20%20%3ClinearGradient%20id%3D%22blue%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%220%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230000%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22blue%22%2F%3E%0A%20%20%20%20%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%20%20%20%20%3C%2Fdefs%3E%0A%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22768%22%20height%3D%2260%22%20fill%3D%22black%22%3E%3C%2Frect%3E%0A%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22768%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22url(%23red)%22%20%2F%3E%0A%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22768%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22url(%23blue)%22%20style%3D%22mix-blend-mode%3A%20difference%22%20%2F%3E%0A%20%20%20%20%20%20%3Crect%20%0A%20%20%20%20%20%20%20%20x%3D%222.1%22%20%0A%20%20%20%20%20%20%20%20y%3D%222.1%22%20%0A%20%20%20%20%20%20%20%20width%3D%22763.8%22%20%0A%20%20%20%20%20%20%20%20height%3D%2255.8%22%20%0A%20%20%20%20%20%20%20%20rx%3D%2216%22%20%0A%20%20%20%20%20%20%20%20fill%3D%22hsl(0%200%25%2050%25%20%2F%200.93)%22%20%0A%20%20%20%20%20%20%20%20style%3D%22filter%3Ablur(11px)%22%20%0A%20%20%20%20%20%20%2F%3E%0A%20%20%20%20%3C%2Fsvg%3E%0A%20%20"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-180"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-170"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-160"
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur stdDeviation="0.2" />
          </filter>
        </defs>
      </svg>
    </motion.header>
  );
}
