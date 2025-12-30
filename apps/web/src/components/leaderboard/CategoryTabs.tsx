'use client';

import { cn } from '@lmring/ui';
import { Eye, Image, MessageSquare, Mic, Video, Volume2 } from 'lucide-react';
import { CATEGORY_CONFIGS, type LeaderboardCategory } from '@/libs/zeroeval-api';

const ICON_MAP = {
  MessageSquare,
  Eye,
  Image,
  Video,
  Volume2,
  Mic,
};

interface CategoryTabsProps {
  activeCategory: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
      {CATEGORY_CONFIGS.map((config) => {
        const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
        const isActive = activeCategory === config.id;

        return (
          <button
            type="button"
            key={config.id}
            onClick={() => onCategoryChange(config.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
