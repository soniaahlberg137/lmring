'use client';

import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@lmring/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { useTranslations } from '@/hooks/use-translations';
import type { ModelOption } from '@/types/arena';

interface ModelSelectorTriggerProps {
  models: ModelOption[];
  selectedModel?: string;
  onClick: (e: React.MouseEvent) => void;
  onRemove?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showRemove?: boolean;
}

export function ModelSelectorTrigger({
  models,
  selectedModel,
  onClick,
  onRemove,
  placeholder = 'Select a model',
  disabled = false,
  showRemove = false,
}: ModelSelectorTriggerProps) {
  const t = useTranslations();
  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          role="combobox"
          onClick={onClick}
          disabled={disabled}
          className="w-full h-9 justify-between font-normal rounded-lg overflow-hidden"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {selectedModelInfo ? (
              <>
                <ProviderIcon providerId={selectedModelInfo.providerId} size={16} />
                <span className="text-sm font-medium truncate">{selectedModelInfo.name}</span>
                {selectedModelInfo.isCustom && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                    {t('Arena.custom_model')}
                  </Badge>
                )}
                {selectedModelInfo.isNew && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                    NEW
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        <AnimatePresence>
          {showRemove && selectedModel && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={onRemove}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Remove model"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ModelSelectorOverlayProps {
  models: ModelOption[];
  selectedModel?: string;
  isOpen: boolean;
  onClose: () => void;
  onModelSelect: (modelId: string) => void;
}

export function ModelSelectorOverlay({
  models,
  selectedModel,
  isOpen,
  onClose,
  onModelSelect,
}: ModelSelectorOverlayProps) {
  const t = useTranslations();
  const [, setSearchQuery] = React.useState('');

  const groupedModels = React.useMemo(() => {
    const groups: Record<string, ModelOption[]> = {};
    models.forEach((model) => {
      const providerName = model.provider || 'Other';
      if (!groups[providerName]) {
        groups[providerName] = [];
      }
      groups[providerName].push(model);
    });
    return groups;
  }, [models]);

  const handleSelect = (modelId: string) => {
    onModelSelect(modelId);
    onClose();
    setSearchQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-[90%] max-w-[400px] z-50"
          >
            <div className="rounded-xl border bg-card text-card-foreground shadow-xl overflow-hidden">
              <Command shouldFilter={true} className="rounded-xl border shadow-md">
                <CommandInput placeholder="Search models..." onValueChange={setSearchQuery} />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No models found.</CommandEmpty>
                  {Object.entries(groupedModels).map(([provider, providerModels]) => (
                    <CommandGroup key={provider} heading={provider}>
                      {providerModels.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={`${model.name} ${model.provider} ${model.id}`}
                          onSelect={() => handleSelect(model.id)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ProviderIcon providerId={model.providerId} size={16} />
                            <span className="font-medium truncate">{model.name}</span>
                            {model.isCustom && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                                {t('Arena.custom_model')}
                              </Badge>
                            )}
                            {model.isNew && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                                NEW
                              </Badge>
                            )}
                          </div>
                          {selectedModel === model.id && (
                            <Check className="h-4 w-4 shrink-0 ml-2" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
