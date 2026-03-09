import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@lmring/ui';
import { ProviderDetail } from './ProviderDetail';
import type { Provider } from './types';

interface ProviderDetailSheetProps {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string, enabled?: boolean, apiKeyId?: string) => void;
  onSave?: (providerId: string, apiKeyId: string, proxyUrl: string, hasApiKey: boolean) => void;
  onDelete?: (providerId: string) => void;
}

export function ProviderDetailSheet({
  provider,
  open,
  onOpenChange,
  onToggle,
  onSave,
  onDelete,
}: ProviderDetailSheetProps) {
  if (!provider) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent open={open} side="right" className="w-full sm:max-w-[55vw] p-0">
        <SheetTitle className="sr-only">{provider.name}</SheetTitle>
        <SheetDescription className="sr-only">
          {provider.name} provider configuration
        </SheetDescription>
        <div className="min-h-0 h-full overflow-y-auto">
          <ProviderDetail
            provider={provider}
            onToggle={onToggle}
            onSave={onSave}
            onDelete={(id) => {
              onDelete?.(id);
              onOpenChange(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
