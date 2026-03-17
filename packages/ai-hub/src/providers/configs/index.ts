import type { ProviderConfig } from '../../types/provider';
import { DOMESTIC_PROVIDERS } from './domestic';
import { INTERNATIONAL_COMPATIBLE_PROVIDERS, OFFICIAL_PROVIDERS } from './official';

// Combine official providers with international compatible providers
// (DOMESTIC_PROVIDERS already includes all compatible providers from model-depot)
export const ALL_PROVIDERS: ProviderConfig[] = [...OFFICIAL_PROVIDERS, ...DOMESTIC_PROVIDERS];

export { DOMESTIC_PROVIDERS, INTERNATIONAL_COMPATIBLE_PROVIDERS, OFFICIAL_PROVIDERS };

export function getProviderById(id: string): ProviderConfig | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getProvidersByType(type: 'official' | 'compatible' | 'custom'): ProviderConfig[] {
  return ALL_PROVIDERS.filter((p) => p.type === type);
}

export function getAllProviderIds(): string[] {
  return ALL_PROVIDERS.map((p) => p.id);
}
