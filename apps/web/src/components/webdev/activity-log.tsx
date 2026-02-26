'use client';

import { cn } from '@lmring/ui';
import { CircleCheck, CircleX, Eye, FilePlus, Folder, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { LOG_ICON_COLORS, type LogIconKey } from '@/constants/webdev';

const ICON_MAP: Record<LogIconKey, ReactNode> = {
  folder: <Folder className="h-3.5 w-3.5" />,
  'file-plus': <FilePlus className="h-3.5 w-3.5" />,
  pencil: <Pencil className="h-3.5 w-3.5" />,
  eye: <Eye className="h-3.5 w-3.5" />,
  'circle-check': <CircleCheck className="h-3.5 w-3.5" />,
  'circle-x': <CircleX className="h-3.5 w-3.5" />,
};

export interface ActivityLogItem {
  id: string;
  icon: LogIconKey;
  text: string;
}

interface ActivityLogProps {
  items: ActivityLogItem[];
  className?: string;
}

export function ActivityLog({ items, className }: ActivityLogProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2">
          <span className={cn('mt-0.5 shrink-0', LOG_ICON_COLORS[item.icon])}>
            {ICON_MAP[item.icon]}
          </span>
          <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
        </div>
      ))}
    </div>
  );
}
