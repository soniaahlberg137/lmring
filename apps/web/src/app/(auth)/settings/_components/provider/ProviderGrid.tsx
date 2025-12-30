import { Badge, ProviderCardSkeleton } from '@lmring/ui';
import { useTranslations } from 'next-intl';
import { ProviderCard } from './ProviderCard';
import type { Provider } from './types';

interface ProviderGridProps {
  providers: Provider[];
  isLoading?: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export function ProviderGrid({ providers, isLoading, onToggle, onSelect }: ProviderGridProps) {
  const t = useTranslations('Provider');
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Providers..." className="pl-9 bg-muted/50" />
        </div>
        <Button variant="secondary" className="gap-2">
          <BoxIcon className="h-4 w-4" />
          All
        </Button>
        <Button size="icon" variant="outline">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div> */}
      {/* Search and filters are now in the sidebar, or maybe we keep them here too if the user wants? 
          The plan says "Search" is in the "Provider List Sidebar". 
          So the grid view just shows the cards. 
      */}

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-lg">{t('enabled')}</h3>
            <Badge
              variant="secondary"
              className="text-xs px-1.5 min-w-5 h-5 flex items-center justify-center"
            >
              {isLoading ? '-' : providers.filter((p) => p.type === 'enabled').length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <ProviderCardSkeleton count={3} />
            ) : (
              providers
                .filter((p) => p.type === 'enabled')
                .map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onToggle={onToggle}
                    onSelect={onSelect}
                  />
                ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-lg">{t('disabled')}</h3>
            <Badge
              variant="secondary"
              className="text-xs px-1.5 min-w-5 h-5 flex items-center justify-center"
            >
              {isLoading ? '-' : providers.filter((p) => p.type === 'disabled').length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <ProviderCardSkeleton count={6} />
            ) : (
              providers
                .filter((p) => p.type === 'disabled')
                .map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onToggle={onToggle}
                    onSelect={onSelect}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
