import { Badge, Card, ProviderCardSkeleton } from '@lmring/ui';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { ProviderCard } from './ProviderCard';
import type { Provider } from './types';

interface ProviderGridProps {
  providers: Provider[];
  isLoading?: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddCustom: () => void;
}

export function ProviderGrid({
  providers,
  isLoading,
  onToggle,
  onSelect,
  onAddCustom,
}: ProviderGridProps) {
  const t = useTranslations();

  const enabledProviders = providers.filter((p) => p.type === 'enabled');
  const disabledProviders = providers.filter((p) => p.type === 'disabled');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProviderCardSkeleton count={6} />
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="space-y-8">
        {enabledProviders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t('Provider.section_enabled')}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {enabledProviders.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {enabledProviders.map((provider) => (
                  <motion.div
                    key={provider.id}
                    layout
                    layoutId={provider.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  >
                    <ProviderCard provider={provider} onToggle={onToggle} onSelect={onSelect} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('Provider.section_available')}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {disabledProviders.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {disabledProviders.map((provider) => (
                <motion.div
                  key={provider.id}
                  layout
                  layoutId={provider.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                >
                  <ProviderCard provider={provider} onToggle={onToggle} onSelect={onSelect} />
                </motion.div>
              ))}
            </AnimatePresence>
            <Card
              className="cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-muted/30 transition-all h-full min-h-[200px] flex flex-col items-center justify-center"
              onClick={onAddCustom}
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center">
                  <PlusIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{t('Provider.add_custom_provider')}</p>
                  <p className="text-xs mt-1">{t('Provider.add_custom_provider_description')}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </LayoutGroup>
  );
}
