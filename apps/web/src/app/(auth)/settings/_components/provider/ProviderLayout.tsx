import { Input, ProviderSidebarSkeleton, Separator } from '@lmring/ui';
import { BoxIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AddProviderDialog } from './AddProviderDialog';
import { ProviderDetail } from './ProviderDetail';
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
  const t = useTranslations('Provider');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedProvider = selectedId ? providers.find((p) => p.id === selectedId) : null;

  const handleAddProvider = (provider: Provider) => {
    onAddProvider(provider);
    setSelectedId(provider.id);
  };

  const handleDeleteProvider = (providerId: string) => {
    onDeleteProvider?.(providerId);
    setSelectedId(null);
  };

  return (
    <div className="h-full flex items-stretch">
      <div className="w-64 flex-none border-r bg-muted/40 flex flex-col">
        <div className="p-4 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="provider-search"
              name="provider-search"
              placeholder={t('search_placeholder')}
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
                selectedId === null
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-background border">
                <BoxIcon className="h-4 w-4" />
              </div>
              <span>{t('all_providers')}</span>
            </button>

            <Separator className="my-2" />

            {isLoading ? (
              <ProviderSidebarSkeleton count={8} />
            ) : (
              filteredProviders.map((provider) => {
                const Icon = provider.Icon;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedId(provider.id)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      selectedId === provider.id
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-background shrink-0">
                      {Icon ? <Icon size={24} className="" /> : <span>{provider.name[0]}</span>}
                    </div>
                    <span className="truncate text-left flex-1">{provider.name}</span>
                    {provider.connected && (
                      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="p-4 bg-background/50 backdrop-blur-sm">
          <AddProviderDialog onAdd={handleAddProvider} />
        </div>
      </div>

      <div className="flex-1 h-full overflow-y-auto bg-background">
        {selectedProvider ? (
          <ProviderDetail
            provider={selectedProvider}
            onToggle={onToggleProvider}
            onSave={onSaveProvider}
            onDelete={handleDeleteProvider}
          />
        ) : (
          <ProviderGrid
            providers={filteredProviders}
            isLoading={isLoading}
            onToggle={onToggleProvider}
            onSelect={setSelectedId}
          />
        )}
      </div>
    </div>
  );
}
