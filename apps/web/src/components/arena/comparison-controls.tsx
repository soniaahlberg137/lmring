'use client';

import { Badge, Button } from '@lmring/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { CopyIcon, DownloadIcon, MinusCircleIcon, PlusCircleIcon, ShuffleIcon } from 'lucide-react';
import { MAX_COMPARISON_CARDS } from '@/constants/arena';

interface ComparisonControlsProps {
  modelCount: number;
  maxModels?: number;
  minModels?: number;
  onAddModel: () => void;
  onRemoveModel: (index: number) => void;
  onShuffleModels?: () => void;
  onCopyComparison?: () => void;
  onExportComparison?: () => void;
  isLoading?: boolean;
}

export function ComparisonControls({
  modelCount,
  maxModels = MAX_COMPARISON_CARDS,
  minModels = 2,
  onAddModel,
  onRemoveModel,
  onShuffleModels,
  onCopyComparison,
  onExportComparison,
  isLoading = false,
}: ComparisonControlsProps) {
  const canAddMore = modelCount < maxModels;
  const canRemove = modelCount > minModels;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="px-3 py-1">
          {modelCount} Model{modelCount > 1 ? 's' : ''} Selected
        </Badge>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {canAddMore && (
              <motion.div
                key="add"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onAddModel}
                  disabled={isLoading}
                  className="h-8"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                  Add
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {modelCount > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: modelCount }).map((_, index) => (
                <motion.div
                  key={`remove-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemoveModel(index)}
                      disabled={isLoading}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
                      aria-label={`Remove model ${index + 1}`}
                    >
                      <MinusCircleIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onShuffleModels && modelCount > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onShuffleModels}
            disabled={isLoading}
            className="h-8"
          >
            <ShuffleIcon className="h-4 w-4 mr-1.5" />
            Shuffle
          </Button>
        )}

        {onCopyComparison && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyComparison}
            disabled={isLoading}
            className="h-8"
          >
            <CopyIcon className="h-4 w-4 mr-1.5" />
            Copy
          </Button>
        )}

        {onExportComparison && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onExportComparison}
            disabled={isLoading}
            className="h-8"
          >
            <DownloadIcon className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        )}
      </div>
    </motion.div>
  );
}
