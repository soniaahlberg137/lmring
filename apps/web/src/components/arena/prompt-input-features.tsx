'use client';

import { Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lmring/ui';
import { AlertCircle, Code, Globe, ImageIcon, Loader2, Plus, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/use-translations';
import type { InputMode } from '@/types/input-mode';
import { MAX_IMAGE_SIZE_MB, MAX_IMAGES } from '@/types/input-mode';
import { usePromptInput } from './prompt-input';

export function PromptInputFeatureButtons() {
  const t = useTranslations();
  const { mode, setMode, uploadedImages, addImages, isLoading, disabled } = usePromptInput();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const oversizedFiles = files.filter((f) => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error(t('Arena.image_too_large', { size: MAX_IMAGE_SIZE_MB }));
      }
      addImages(files);
    }
    e.target.value = '';
  };

  const handleCodeClick = () => {
    toast.info(t('Arena.coming_soon'), {
      description: t('Arena.build_apps_coming_soon'),
    });
  };

  const isActive = (checkMode: InputMode) => mode === checkMode;
  const isButtonDisabled = isLoading || disabled;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg',
                uploadedImages.length > 0 && 'text-primary border-primary',
              )}
              onClick={handleUploadClick}
              disabled={isButtonDisabled || uploadedImages.length >= MAX_IMAGES}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('Arena.upload_images')} ({uploadedImages.length}/{MAX_IMAGES})
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg',
                isActive('search') && 'bg-primary/10 text-primary border-primary',
              )}
              onClick={() => setMode('search')}
              disabled={isButtonDisabled}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Arena.web_search')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg',
                isActive('imageGenerate') && 'bg-primary/10 text-primary border-primary',
              )}
              onClick={() => setMode('imageGenerate')}
              disabled={isButtonDisabled}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Arena.image_generation')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleCodeClick}
              disabled={isButtonDisabled}
            >
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Arena.build_apps')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function ModeChip() {
  const t = useTranslations();
  const { mode, setMode } = usePromptInput();

  if (mode === 'default' || mode === 'upload') return null;

  const config = {
    search: {
      icon: Globe,
      label: t('Arena.web_search'),
      colorClass: 'text-blue-500',
    },
    imageGenerate: {
      icon: ImageIcon,
      label: t('Arena.image_generation'),
      colorClass: 'text-purple-500',
    },
  };

  const { icon: Icon, label, colorClass } = config[mode];

  const handleClear = () => {
    setMode('default');
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-primary/10 border border-primary/20',
        colorClass,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      <button
        type="button"
        onClick={handleClear}
        className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
        aria-label={t('Arena.clear_mode')}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ImagePreviews() {
  const { uploadedImages, removeImage, isRemovingImage } = usePromptInput();

  if (uploadedImages.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {uploadedImages.map((image) => {
        const isRemoving = isRemovingImage === image.id;
        return (
          <div key={image.id} className="relative group">
            {/* biome-ignore lint/performance/noImgElement: Using blob URL from URL.createObjectURL which is not compatible with Next.js Image */}
            <img
              src={image.previewUrl}
              alt={image.filename}
              className={cn(
                'h-16 w-16 rounded-lg object-cover border bg-muted',
                (image.isUploading || isRemoving) && 'opacity-50',
                image.uploadError && 'border-destructive',
              )}
            />
            {image.isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {isRemoving && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-destructive" />
              </div>
            )}
            {image.uploadError && !isRemoving && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeImage(image.id)}
              disabled={isRemoving || image.isUploading}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm disabled:opacity-50"
              aria-label={`Remove ${image.filename}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
