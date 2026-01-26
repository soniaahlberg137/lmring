'use client';

import { cn } from '@lmring/ui';
import { ArenaHeroSection } from '@/components/arena/arena-hero-section';
import { ModelTabBar } from '@/components/arena/model-tab-bar';
import {
  PromptInput,
  PromptInputActions,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/arena/prompt-input';
import {
  ImagePreviews,
  ModeChip,
  PromptInputFeatureButtons,
} from '@/components/arena/prompt-input-features';
import { useTranslations } from '@/hooks/use-translations';
import type { ModelOption } from '@/types/arena';
import type { InputMode, UploadedImage } from '@/types/input-mode';

interface InitialArenaViewProps {
  comparisons: Array<{
    id: string;
    modelId: string;
  }>;
  availableModels: ModelOption[];
  globalPrompt: string;
  isLoading: boolean;
  uploadedImages: UploadedImage[];
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onModelSelect: (index: number, modelId: string) => void;
  onAddComparison: () => void;
  onRemoveComparison: (index: number) => void;
  onAddImages: (images: UploadedImage[]) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
  onRemoveImage: (id: string) => Promise<void>;
  onModeChange?: (mode: InputMode) => void;
  className?: string;
}

export function InitialArenaView({
  comparisons,
  availableModels,
  globalPrompt,
  isLoading,
  uploadedImages,
  onPromptChange,
  onSubmit,
  onStop,
  onModelSelect,
  onAddComparison,
  onRemoveComparison,
  onAddImages,
  onUpdateImage,
  onRemoveImage,
  onModeChange,
  className,
}: InitialArenaViewProps) {
  const t = useTranslations();

  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
      <div className="w-full max-w-3xl space-y-2">
        <ArenaHeroSection />
        <PromptInput
          value={globalPrompt}
          onChange={onPromptChange}
          onSubmit={onSubmit}
          onStop={onStop}
          isLoading={isLoading}
          uploadedImages={uploadedImages}
          onAddImages={onAddImages}
          onUpdateImage={onUpdateImage}
          onRemoveImage={onRemoveImage}
          onModeChange={onModeChange}
          className="border-input"
        >
          <ImagePreviews />
          <PromptInputTextarea placeholder={t('Arena.prompt_placeholder')} />
          <PromptInputFooter>
            <PromptInputActions>
              <PromptInputFeatureButtons />
              <ModeChip />
            </PromptInputActions>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>

        <ModelTabBar
          comparisons={comparisons}
          availableModels={availableModels}
          onModelSelect={onModelSelect}
          onAddComparison={onAddComparison}
          onRemoveComparison={onRemoveComparison}
        />
      </div>
    </div>
  );
}
