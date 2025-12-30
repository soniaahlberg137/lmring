'use client';

import { cn } from '@lmring/ui';
import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  containerClassName?: string;
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, containerClassName, children, ...props }, ref) => {
    return (
      <div className={cn('group relative flex items-center justify-center', containerClassName)}>
        {/* Animated Gradient Background/Border */}
        <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 opacity-70 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md animate-gradient-xy" />

        {/* Button Content */}
        <button
          ref={ref}
          className={cn(
            'relative inline-flex h-12 items-center justify-center rounded-lg bg-black/90 px-8 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-3xl transition-all hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </div>
    );
  },
);

GradientButton.displayName = 'GradientButton';
