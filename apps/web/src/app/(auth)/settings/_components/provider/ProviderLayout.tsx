import { Input } from '@lmring/ui';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { AddProviderDialog } from './AddProviderDialog';
import { ProviderDetailSheet } from './ProviderDetailSheet';
import { ProviderGrid } from './ProviderGrid';
import type { Provider } from './types';

interface ProviderLayoutProps {
  providers: Provider[];
  isLoading?: boolean;
  onToggleProvider: (id: string, enabled?: boolean, apiKeyId?: string) => void;
  onSaveProvider?: (providerId: string, apiKeyId: string) => void;
  onAddProvider: (provider: Provider) => void;
  onDeleteProvider?: (providerId: string) => void;
}

export function ProviderLayout({
  providers,
  isLoading,
  onToggleProvider,
  onSaveProvider,
  onAddProvider,
  onDeleteProvider,
}: ProviderLayoutProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedProvider = selectedId ? (providers.find((p) => p.id === selectedId) ?? null) : null;

  const handleAddProvider = (provider: Provider) => {
    onAddProvider(provider);
    setSelectedId(provider.id);
  };

  const handleDeleteProvider = (providerId: string) => {
    onDeleteProvider?.(providerId);
    setSelectedId(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('Settings.tabs_provider')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('Settings.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="provider-search"
              name="provider-search"
              placeholder={t('Provider.search_placeholder')}
              className="pl-8 w-64 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AddProviderDialog
            onAdd={handleAddProvider}
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <ProviderGrid
          providers={filteredProviders}
          isLoading={isLoading}
          onToggle={onToggleProvider}
          onSelect={setSelectedId}
          onAddCustom={() => setAddDialogOpen(true)}
        />
      </div>

      <ProviderDetailSheet
        provider={selectedProvider}
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onToggle={onToggleProvider}
        onSave={onSaveProvider}
        onDelete={handleDeleteProvider}
      />
    </div>
  );
}
