import { Card, Switch } from '@lmring/ui';
import type { Provider } from './types';

interface ProviderCardProps {
  provider: Provider;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export function ProviderCard({ provider, onToggle, onSelect }: ProviderCardProps) {
  const Icon = provider.Icon;
  return (
    <Card
      className={`cursor-pointer hover:shadow-md h-full flex flex-col border-l-[3px] transition-all ${
        provider.connected ? 'border-l-primary' : 'border-l-muted'
      }`}
      onClick={() => onSelect(provider.id)}
    >
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted/20 shrink-0">
            {Icon ? <Icon size={24} /> : <span className="text-xl">{provider.name[0]}</span>}
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-base">{provider.name}</h3>
          </div>
        </div>
        <div className="flex-1 mb-2">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        </div>
        <div className="pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {provider.models && provider.models.length > 0 && (
              <span className="text-xs text-muted-foreground">{provider.models.length} models</span>
            )}
            {provider.connected && (
              <span className="text-xs text-primary font-medium">Connected</span>
            )}
          </div>
          <Switch
            checked={provider.connected}
            onCheckedChange={() => onToggle(provider.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </Card>
  );
}
