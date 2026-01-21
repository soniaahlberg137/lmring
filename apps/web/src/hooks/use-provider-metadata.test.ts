import * as modelDepotModels from '@lmring/model-depot/models';
import * as modelDepotProviders from '@lmring/model-depot/providers';
import type { DefaultModelListItem } from '@lmring/model-depot/types';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProviderMetadata } from './use-provider-metadata';
import * as useTranslationsModule from './use-translations';

describe('useProviderMetadata', () => {
  let getModelsForProviderSpy: ReturnType<typeof vi.spyOn>;
  let useTranslationsSpy: ReturnType<typeof vi.spyOn>;
  let mockTranslate: ReturnType<typeof vi.fn>;

  const mockProviderMetadata: modelDepotProviders.ProviderMetadata[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      type: 'official',
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      type: 'official',
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
  ];

  const mockModels: DefaultModelListItem[] = [
    {
      id: 'gpt-4',
      displayName: 'GPT-4',
      contextWindowTokens: 128000,
      maxOutput: 4096,
      pricing: { input: 0.03, output: 0.06 },
      releasedAt: '2023-03-14',
      type: 'chat',
      providerId: 'openai',
      source: 'builtin',
      abilities: {},
      enabled: true,
    },
  ];

  beforeEach(() => {
    mockTranslate = vi.fn((key: string) => `Translated: ${key}`);
    useTranslationsSpy = vi
      .spyOn(useTranslationsModule, 'useTranslations')
      .mockReturnValue(
        mockTranslate as unknown as ReturnType<typeof useTranslationsModule.useTranslations>,
      );
    getModelsForProviderSpy = vi
      .spyOn(modelDepotModels, 'getModelsForProvider')
      .mockReturnValue(mockModels);

    vi.spyOn(modelDepotProviders, 'ALL_PROVIDER_METADATA', 'get').mockReturnValue(
      mockProviderMetadata,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns array of providers with descriptions', () => {
    const { result } = renderHook(() => useProviderMetadata());

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBe(2);
  });

  it('includes description for each provider', () => {
    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current[0]?.description).toBe('Translated: Providers.openai_description');
    expect(result.current[1]?.description).toBe('Translated: Providers.anthropic_description');
  });

  it('includes models array for each provider', () => {
    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current[0]?.models).toEqual(mockModels);
    expect(result.current[1]?.models).toEqual(mockModels);
    expect(getModelsForProviderSpy).toHaveBeenCalledWith('openai');
    expect(getModelsForProviderSpy).toHaveBeenCalledWith('anthropic');
  });

  it('preserves original provider metadata properties', () => {
    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current[0]?.id).toBe('openai');
    expect(result.current[0]?.name).toBe('OpenAI');
    expect(result.current[0]?.type).toBe('official');
    expect(result.current[0]?.supportsStreaming).toBe(true);
    expect(result.current[0]?.supportsVision).toBe(true);
  });

  it('uses translation keys with correct format', () => {
    renderHook(() => useProviderMetadata());

    expect(mockTranslate).toHaveBeenCalledWith('Providers.openai_description');
    expect(mockTranslate).toHaveBeenCalledWith('Providers.anthropic_description');
  });

  it('memoizes result based on translation function', () => {
    const { result, rerender } = renderHook(() => useProviderMetadata());

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });

  it('updates when translation function changes', () => {
    const mockTranslate1 = vi.fn((key: string) => `EN: ${key}`);
    const mockTranslate2 = vi.fn((key: string) => `FR: ${key}`);

    useTranslationsSpy.mockReturnValueOnce(
      mockTranslate1 as unknown as ReturnType<typeof useTranslationsModule.useTranslations>,
    );

    const { result, rerender } = renderHook(() => useProviderMetadata());
    const firstResult = result.current;
    expect(firstResult[0]?.description).toBe('EN: Providers.openai_description');

    useTranslationsSpy.mockReturnValueOnce(
      mockTranslate2 as unknown as ReturnType<typeof useTranslationsModule.useTranslations>,
    );

    rerender();
    const secondResult = result.current;

    expect(firstResult).not.toBe(secondResult);
    expect(secondResult[0]?.description).toBe('FR: Providers.openai_description');
  });

  it('handles empty provider list', () => {
    vi.spyOn(modelDepotProviders, 'ALL_PROVIDER_METADATA', 'get').mockReturnValue([]);

    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current).toEqual([]);
  });

  it('handles provider with no models', () => {
    getModelsForProviderSpy.mockReturnValue([]);

    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current[0]?.models).toEqual([]);
  });

  it('handles provider with multiple models', () => {
    const multipleModels: DefaultModelListItem[] = [
      {
        id: 'gpt-4',
        displayName: 'GPT-4',
        contextWindowTokens: 128000,
        maxOutput: 4096,
        pricing: { input: 0.03, output: 0.06 },
        releasedAt: '2023-03-14',
        type: 'chat',
        providerId: 'openai',
        source: 'builtin',
        abilities: {},
        enabled: true,
      },
      {
        id: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        contextWindowTokens: 128000,
        maxOutput: 4096,
        pricing: { input: 0.01, output: 0.03 },
        releasedAt: '2023-11-06',
        type: 'chat',
        providerId: 'openai',
        source: 'builtin',
        abilities: {},
        enabled: true,
      },
    ];

    getModelsForProviderSpy.mockReturnValue(multipleModels);

    const { result } = renderHook(() => useProviderMetadata());

    expect(result.current[0]?.models).toHaveLength(2);
  });
});
