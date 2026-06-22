'use client';

import { cn } from '@lmring/ui';
import { useTranslations } from '@/hooks/use-translations';

export type AgentDomainFilter =
  | 'all'
  | 'coding'
  | 'customer-support'
  | 'research'
  | 'finance'
  | 'legal'
  | 'general';

interface DomainTabsProps {
  activeDomain: AgentDomainFilter;
  onDomainChange: (domain: AgentDomainFilter) => void;
}

const DOMAINS: { id: AgentDomainFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'Leaderboard.domain_all' },
  { id: 'coding', labelKey: 'Leaderboard.domain_coding' },
  { id: 'customer-support', labelKey: 'Leaderboard.domain_customer_support' },
  { id: 'research', labelKey: 'Leaderboard.domain_research' },
  { id: 'finance', labelKey: 'Leaderboard.domain_finance' },
  { id: 'legal', labelKey: 'Leaderboard.domain_legal' },
  { id: 'general', labelKey: 'Leaderboard.domain_general' },
];

export function DomainTabs({ activeDomain, onDomainChange }: DomainTabsProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-1">
      {DOMAINS.map(({ id, labelKey }) => {
        const isActive = activeDomain === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onDomainChange(id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
          >
            {t(labelKey as Parameters<typeof t>[0])}
          </button>
        );
      })}
    </div>
  );
}
