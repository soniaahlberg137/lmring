'use client';

import { cn } from '@lmring/ui';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { ModelSelectorOverlay } from '@/components/arena/model-selector';
import { ModelTab } from '@/components/arena/model-tab';
import { MAX_COMPARISON_CARDS } from '@/constants/arena';
import { useTranslations } from '@/hooks/use-translations';
import type { ModelOption } from '@/types/arena';

interface ModelTabBarProps {
  comparisons: Array<{
    id: string;
    modelId: string;
  }>;
  availableModels: ModelOption[];
  onModelSelect: (index: number, modelId: string) => void;
  onAddComparison: () => void;
  onRemoveComparison: (index: number) => void;
  className?: string;
}

export function ModelTabBar({
  comparisons,
  availableModels,
  onModelSelect,
  onAddComparison,
  onRemoveComparison,
  className,
}: ModelTabBarProps) {
  const t = useTranslations();
  const [activeTabIndex, setActiveTabIndex] = React.useState<number | null>(null);

  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
  };

  const handleModelSelect = (modelId: string) => {
    if (activeTabIndex !== null) {
      onModelSelect(activeTabIndex, modelId);
      setActiveTabIndex(null);
    }
  };

  const handleCloseOverlay = () => {
    setActiveTabIndex(null);
  };

  const canAddMore = comparisons.length < MAX_COMPARISON_CARDS;
  const canRemove = comparisons.length > 1;

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {comparisons.map((comparison, index) => {
          const model = availableModels.find((m) => m.id === comparison.modelId);
          return (
            <ModelTab
              key={comparison.id}
              model={model}
              isActive={activeTabIndex === index}
              canRemove={canRemove}
              onClick={() => handleTabClick(index)}
              onRemove={() => onRemoveComparison(index)}
            />
          );
        })}

        {canAddMore && (
          <button
            type="button"
            onClick={onAddComparison}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 h-10 rounded-lg border border-dashed',
              'border-border/50 hover:border-border hover:bg-accent/30 transition-all',
              'text-muted-foreground hover:text-foreground',
            )}
            aria-label={t('Arena.add_model')}
          >
            <Plus className="h-4 w-4" />
            <span>{t('Arena.add_model')}</span>
          </button>
        )}
      </div>

      <ModelSelectorOverlay
        models={availableModels}
        selectedModel={activeTabIndex !== null ? comparisons[activeTabIndex]?.modelId : undefined}
        isOpen={activeTabIndex !== null}
        onClose={handleCloseOverlay}
        onModelSelect={handleModelSelect}
      />
    </div>
  );
}
