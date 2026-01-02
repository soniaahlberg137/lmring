import { getModelsForProvider } from '@lmring/model-depot/models';
import { ALL_PROVIDER_METADATA, type ProviderMetadata } from '@lmring/model-depot/providers';
import type { DefaultModelListItem } from '@lmring/model-depot/types';
import { useTranslations } from '@/hooks/use-translations';
import { useMemo } from 'react';

export interface ProviderWithDescription extends ProviderMetadata {
  description: string;
  models: DefaultModelListItem[];
}

type ProviderDescriptionKey =
  // Official
  | 'openai_description'
  | 'anthropic_description'
  | 'azure_description'
  | 'vertex_description'
  | 'xai_description'
  | 'deepseek_description'
  | 'mistral_description'
  | 'openrouter_description'
  | 'google_description'
  | 'bedrock_description'
  | 'ollama_description'
  // International
  | 'groq_description'
  | 'perplexity_description'
  | 'cohere_description'
  | 'togetherai_description'
  | 'fireworksai_description'
  | 'sambanova_description'
  | 'github_description'
  | 'huggingface_description'
  | 'nvidia_description'
  | 'cerebras_description'
  | 'cloudflare_description'
  | 'nebius_description'
  | 'upstage_description'
  | 'novita_description'
  | 'ai21_description'
  | 'bfl_description'
  | 'infiniai_description'
  | 'jina_description'
  | 'search1api_description'
  // Domestic
  | 'silicon_description'
  | 'dashscope_description'
  | 'zhipu_description'
  | 'baichuan_description'
  | 'moonshot_description'
  | 'yi_description'
  | 'minimax_description'
  | 'step_description'
  | 'hunyuan_description'
  | 'spark_description'
  | 'volcengine_description'
  | 'wenxin_description'
  | 'sensenova_description'
  | 'internlm_description'
  | 'giteeai_description'
  | 'modelscope_description'
  | 'qiniu_description'
  | 'ppio_description'
  | 'taichu_description'
  | 'tencentcloud_description'
  // Local
  | 'lmstudio_description'
  | 'vllm_description'
  | 'xinference_description'
  | 'higress_description';

export function useProviderMetadata(): ProviderWithDescription[] {
  const t = useTranslations();

  return useMemo(
    () =>
      ALL_PROVIDER_METADATA.map((p) => {
        const descriptionKey = `${p.id}_description` as ProviderDescriptionKey;
        return {
          ...p,
          description: t(`Providers.${descriptionKey}`),
          models: getModelsForProvider(p.id),
        };
      }),
    [t],
  );
}
