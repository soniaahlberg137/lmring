'use client';

import { cn } from '@lmring/ui';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, Image, LayoutGrid, MessageSquare, Mic, Video, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLeaderboardData, leaderboardKeys } from '@/hooks/use-leaderboard-query';
import { CATEGORY_CONFIGS, type LeaderboardCategory } from '@/libs/zeroeval-api';

const ICON_MAP = {
  MessageSquare,
  Eye,
  Image,
  Video,
  Volume2,
  Mic,
  LayoutGrid,
};

interface CategoryTabsProps {
  activeCategory: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeButton = containerRef.current.querySelector(
      `[data-category="${activeCategory}"]`,
    ) as HTMLButtonElement | null;
    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleMouseEnter = (categoryId: LeaderboardCategory) => {
    const existingData = queryClient.getQueryData(leaderboardKeys.category(categoryId));
    if (!existingData) {
      queryClient.prefetchQuery({
        queryKey: leaderboardKeys.category(categoryId),
        queryFn: () => fetchLeaderboardData(categoryId),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap gap-1 p-1.5 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border/40"
    >
      {/* Animated sliding indicator */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-lg bg-background dark:bg-background/90 shadow-sm ring-1 ring-border/20"
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {CATEGORY_CONFIGS.map((config) => {
        const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
        const isActive = activeCategory === config.id;

        return (
          <button
            type="button"
            key={config.id}
            data-category={config.id}
            onClick={() => onCategoryChange(config.id)}
            onMouseEnter={() => handleMouseEnter(config.id)}
            className={cn(
              'relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {IconComponent && (
              <IconComponent
                className={cn('h-4 w-4 transition-all duration-200', isActive && 'text-primary')}
              />
            )}
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
