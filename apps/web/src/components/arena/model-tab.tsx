'use client';

import { cn } from '@lmring/ui';
import { X } from 'lucide-react';
import type * as React from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { useTranslations } from '@/hooks/use-translations';
import type { ModelOption } from '@/types/arena';

interface ModelTabProps {
  model: ModelOption | undefined;
  isActive?: boolean;
  canRemove?: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export function ModelTab({
  model,
  isActive = false,
  canRemove = true,
  onClick,
  onRemove,
}: ModelTabProps) {
  const t = useTranslations();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        'hover:bg-accent/50',
        isActive
          ? 'bg-accent border-border'
          : 'bg-background/50 border-border/50 hover:border-border',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
      >
        {model ? (
          <>
            <ProviderIcon providerId={model.providerId} size={18} />
            <span className="text-sm font-medium whitespace-nowrap">{model.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{t('Arena.select_model')}</span>
        )}
      </button>

      {canRemove && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            'ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
            'hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer',
          )}
          aria-label={t('Arena.remove_model')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
