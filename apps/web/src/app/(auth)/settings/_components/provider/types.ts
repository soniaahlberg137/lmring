import type { IconType } from '@lobehub/icons';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export interface Provider {
  id: string;
  name: string;
  connected: boolean;
  Icon: IconType | LucideIcon | ComponentType<{ size?: number; className?: string }> | null;
  CombineIcon?:
    | IconType
    | LucideIcon
    | ComponentType<{ size?: number; className?: string; type?: 'color' | 'mono' }>
    | null;
  TextIcon?:
    | IconType
    | LucideIcon
    | ComponentType<{ size?: number; className?: string; type?: 'color' | 'mono' }>
    | null;
  BrandIcon?:
    | IconType
    | LucideIcon
    | ComponentType<{ size?: number; className?: string; type?: 'color' | 'mono' }>
    | null;
  description: string;
  type: 'enabled' | 'disabled';
  tags: string[];
  models?: {
    id: string;
    name: string;
    description?: string;
  }[];
  apiKeyId?: string;
  apiKey?: string;
  proxyUrl?: string;
  enabledModels?: string[];
  hasApiKey?: boolean;
  isCustom?: boolean;
  providerType?: string;
}

export interface ConnectionCheckResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
  responseTimeMs?: number;
  modelResponse?: string;
}

export interface SaveApiKeyResponse {
  message: string;
  id: string;
  providerName: string;
  proxyUrl: string;
  enabled: boolean;
}

export interface ApiKeyRecord {
  id: string;
  providerName: string;
  proxyUrl: string;
  enabled: boolean;
  configSource: string;
  createdAt: string;
  updatedAt: string;
  hasApiKey?: boolean;
  isCustom?: boolean;
  providerType?: string;
}
