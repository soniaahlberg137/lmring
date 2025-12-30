import { Card, Switch } from '@lmring/ui';
import { OpenAI } from '@lobehub/icons';
import { motion } from 'framer-motion';
import type { Provider } from './types';

const MotionCard = motion.create(Card);

interface ProviderCardProps {
  provider: Provider;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export function ProviderCard({ provider, onToggle, onSelect }: ProviderCardProps) {
  const Icon = provider.Icon;
  return (
    <MotionCard
      layout
      initial={false}
      animate={{
        scale: provider.connected ? 1.02 : 1,
        borderColor: provider.connected ? 'var(--primary)' : 'var(--border)',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className="cursor-pointer hover:shadow-md h-full flex flex-col"
      onClick={() => onSelect(provider.id)}
    >
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted/20 shrink-0">
            {Icon ? <Icon size={24} /> : <span className="text-xl">{provider.name[0]}</span>}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">{provider.name}</h3>
              {provider.tags
                .filter((tag) => tag !== provider.name)
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-muted-foreground flex items-center gap-1"
                  >
                    {tag === 'OpenAI' && <OpenAI.Avatar size={12} />}
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 mb-2">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        </div>

        <div className="pt-3 border-t flex justify-end">
          <Switch
            checked={provider.connected}
            onCheckedChange={() => onToggle(provider.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </MotionCard>
  );
}
