'use client';

import { Button, cn, Textarea } from '@lmring/ui';
import { ArrowUp, Square } from 'lucide-react';
import * as React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import type { InputMode, UploadedImage } from '@/types/input-mode';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGES } from '@/types/input-mode';

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled: boolean;
  isSubmitting: boolean;
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  uploadedImages: UploadedImage[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  isRemovingImage: string | null;
}

const PromptInputContext = React.createContext<PromptInputContextValue | undefined>(undefined);

export function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error('usePromptInput must be used within a PromptInput');
  }
  return context;
}

const SUBMIT_DEBOUNCE_MS = 500;

interface PromptInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  uploadedImages: UploadedImage[];
  onAddImages: (newImages: UploadedImage[]) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
  onRemoveImage: (id: string) => Promise<void>;
  onModeChange?: (mode: InputMode) => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  disabled = false,
  uploadedImages,
  onAddImages,
  onUpdateImage,
  onRemoveImage,
  onModeChange,
  className,
  children,
  ...props
}: PromptInputProps) {
  const t = useTranslations();
  const lastSubmitTimeRef = React.useRef<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mode, setModeState] = React.useState<InputMode>('default');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isRemovingImage, setIsRemovingImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (uploadedImages.length > 0 && mode !== 'upload') {
      setModeState('upload');
      onModeChange?.('upload');
    } else if (uploadedImages.length === 0 && mode === 'upload') {
      setModeState('default');
      onModeChange?.('default');
    }
  }, [uploadedImages.length, mode, onModeChange]);

  const handleSubmit = React.useCallback(() => {
    if (!value.trim() || isLoading || disabled || isSubmitting) return;

    const now = Date.now();
    if (now - lastSubmitTimeRef.current < SUBMIT_DEBOUNCE_MS) {
      return;
    }

    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
    }, SUBMIT_DEBOUNCE_MS);

    onSubmit();
  }, [value, isLoading, disabled, isSubmitting, onSubmit]);

  const setMode = React.useCallback(
    (newMode: InputMode) => {
      const effectiveMode = newMode === mode ? 'default' : newMode;
      setModeState(effectiveMode);
      onModeChange?.(effectiveMode);
    },
    [mode, onModeChange],
  );

  const addImages = React.useCallback(
    async (files: File[]) => {
      const validFiles = files.filter(
        (f) => f.type.startsWith('image/') && f.size <= MAX_IMAGE_SIZE_BYTES,
      );

      const remainingSlots = MAX_IMAGES - uploadedImages.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      const newImages: UploadedImage[] = filesToAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        isUploading: true,
      }));

      if (newImages.length > 0) {
        onAddImages(newImages);
      }

      const { uploadFile } = await import('@/libs/file-upload-api');

      for (const img of newImages) {
        try {
          const result = await uploadFile(img.file);
          onUpdateImage(img.id, {
            fileId: result.fileId,
            url: result.url,
            isUploading: false,
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
          onUpdateImage(img.id, {
            isUploading: false,
            uploadError: error instanceof Error ? error.message : 'Upload failed',
          });
        }
      }
    },
    [uploadedImages.length, onAddImages, onUpdateImage],
  );

  const removeImage = React.useCallback(
    async (id: string) => {
      setIsRemovingImage(id);
      try {
        await onRemoveImage(id);
      } finally {
        setIsRemovingImage(null);
      }
    },
    [onRemoveImage],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages],
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue: onChange,
      onSubmit: handleSubmit,
      onStop,
      isLoading,
      disabled,
      isSubmitting,
      mode,
      setMode,
      uploadedImages,
      addImages,
      removeImage,
      isRemovingImage,
    }),
    [
      value,
      onChange,
      handleSubmit,
      onStop,
      isLoading,
      disabled,
      isSubmitting,
      mode,
      setMode,
      uploadedImages,
      addImages,
      removeImage,
      isRemovingImage,
    ],
  );

  return (
    <PromptInputContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is handled via native browser events and doesn't need keyboard interaction */}
      <div
        className={cn(
          'relative flex flex-col w-full overflow-hidden rounded-xl border bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
          isDragging && 'ring-2 ring-primary border-primary',
          className,
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-xl pointer-events-none">
            <p className="text-sm text-primary font-medium">{t('Arena.drop_images_here')}</p>
          </div>
        )}
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea> & {
    maxHeight?: number;
  }
>(({ className, onKeyDown, maxHeight = 200, ...props }, ref) => {
  const { value, setValue, onSubmit, isLoading, disabled, isSubmitting } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !isComposing &&
      !e.nativeEvent.isComposing &&
      !isSubmitting
    ) {
      e.preventDefault();
      onSubmit();
    }
    onKeyDown?.(e);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: value changes should trigger height recalculation
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [value, maxHeight]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      disabled={isLoading || disabled}
      className={cn(
        'min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0',
        className,
      )}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = 'PromptInputTextarea';

export function PromptInputFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between px-3 pb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputSubmit({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { value, onSubmit, onStop, isLoading, disabled, isSubmitting } = usePromptInput();

  if (isLoading && onStop) {
    return (
      <Button
        size="icon"
        variant="destructive"
        onClick={onStop}
        className={cn('h-8 w-8 rounded-full transition-all', className)}
        {...props}
      >
        <Square className="h-3.5 w-3.5" />
        <span className="sr-only">Stop</span>
      </Button>
    );
  }

  const isDisabled = !value.trim() || isLoading || disabled || isSubmitting;

  return (
    <Button
      size="icon"
      onClick={onSubmit}
      disabled={isDisabled}
      className={cn(
        'h-8 w-8 rounded-full transition-all',
        isDisabled ? 'opacity-50' : 'opacity-100',
        className,
      )}
      {...props}
    >
      {children || <ArrowUp className="h-4 w-4" />}
      <span className="sr-only">Send</span>
    </Button>
  );
}
