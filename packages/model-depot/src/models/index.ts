import type { DefaultModelListItem, FullModelCard } from '../types';
import ai21Models from './ai21';
import anthropicModels from './anthropic';
import azureModels from './azure';
import baichuanModels from './baichuan';
import bedrockModels from './bedrock';
import bflModels from './bfl';
import cerebrasModels from './cerebras';
import cloudflareModels from './cloudflare';
import cohereModels from './cohere';
import dashscopeModels from './dashscope';
import deepseekModels from './deepseek';
import falModels from './fal';
import fireworksaiModels from './fireworksai';
import giteeaiModels from './giteeai';
import githubModels from './github';
import googleModels from './google';
import groqModels from './groq';
import higressModels from './higress';
import huggingfaceModels from './huggingface';
import hunyuanModels from './hunyuan';
import infiniaiModels from './infiniai';
import internlmModels from './internlm';
import jinaModels from './jina';
import lmstudioModels from './lmstudio';
import minimaxModels from './minimax';
import mistralModels from './mistral';
import modelscopeModels from './modelscope';
import moonshotModels from './moonshot';
import nebiusModels from './nebius';
import novitaModels from './novita';
import nvidiaModels from './nvidia';
import ollamaModels from './ollama';
import openaiModels from './openai';
import openrouterModels from './openrouter';
import perplexityModels from './perplexity';
import ppioModels from './ppio';
import qiniuModels from './qiniu';
import sambanovaModels from './sambanova';
import search1apiModels from './search1api';
import sensenovaModels from './sensenova';
import siliconModels from './silicon';
import sparkModels from './spark';
import stepfunModels from './stepfun';
import taichuModels from './taichu';
import tencentcloudModels from './tencentcloud';
import togetheraiModels from './togetherai';
import upstageModels from './upstage';
import vertexaiModels from './vertexai';
import vllmModels from './vllm';
import volcengineModels from './volcengine';
import wenxinModels from './wenxin';
import xaiModels from './xai';
import xiaomimimoModels from './xiaomimimo';
import xinferenceModels from './xinference';
import yiModels from './yi';
import zhipuModels from './zhipu';

// Type for nested model structure { chat: [], image: [], ... }
type ModelsByType = Record<string, FullModelCard[]>;
type ModelsMapValue = FullModelCard[] | ModelsByType;
type ModelsMap = Record<string, ModelsMapValue>;

// Helper to check if value is a nested model object
const isNestedModels = (value: ModelsMapValue): value is ModelsByType => {
  return !Array.isArray(value) && typeof value === 'object';
};

const buildDefaultModelList = (map: ModelsMap): DefaultModelListItem[] => {
  const models: DefaultModelListItem[] = [];

  for (const [providerId, providerModels] of Object.entries(map)) {
    if (isNestedModels(providerModels)) {
      // Handle nested structure { chat: [], image: [], ... }
      for (const typeModels of Object.values(providerModels)) {
        for (const model of typeModels) {
          models.push({
            ...model,
            providerId,
            source: 'builtin',
            abilities: model.abilities ?? {},
          });
        }
      }
    } else {
      // Handle flat array
      for (const model of providerModels) {
        models.push({
          ...model,
          providerId,
          source: 'builtin',
          abilities: model.abilities ?? {},
        });
      }
    }
  }

  return models;
};

export const PROVIDER_MODELS_MAP: ModelsMap = {
  openai: openaiModels,
  anthropic: anthropicModels,
  azure: azureModels,
  bedrock: bedrockModels,
  deepseek: deepseekModels,
  mistral: mistralModels,
  xai: xaiModels,
  google: googleModels,
  vertexai: vertexaiModels,
  ollama: ollamaModels,
  openrouter: openrouterModels,
  silicon: siliconModels,
  dashscope: dashscopeModels,
  zhipu: zhipuModels,
  baichuan: baichuanModels,
  moonshot: moonshotModels,
  yi: yiModels,
  minimax: minimaxModels,
  step: stepfunModels,
  hunyuan: hunyuanModels,
  spark: sparkModels,
  volcengine: volcengineModels,
  wenxin: wenxinModels,
  sensenova: sensenovaModels,
  internlm: internlmModels,
  groq: groqModels,
  perplexity: perplexityModels,
  cohere: cohereModels,
  togetherai: togetheraiModels,
  fireworksai: fireworksaiModels,
  sambanova: sambanovaModels,
  github: githubModels,
  huggingface: huggingfaceModels,
  nvidia: nvidiaModels,
  cerebras: cerebrasModels,
  cloudflare: cloudflareModels,
  nebius: nebiusModels,
  novita: novitaModels,
  upstage: upstageModels,
  giteeai: giteeaiModels,
  modelscope: modelscopeModels,
  qiniu: qiniuModels,
  ppio: ppioModels,
  taichu: taichuModels,
  tencentcloud: tencentcloudModels,
  lmstudio: lmstudioModels,
  vllm: vllmModels,
  xinference: xinferenceModels,
  ai21: ai21Models,
  bfl: bflModels,
  infiniai: infiniaiModels,
  jina: jinaModels,
  search1api: search1apiModels,
  higress: higressModels,
  fal: falModels,
  xiaomimimo: xiaomimimoModels,
};

export const DEFAULT_MODEL_LIST = buildDefaultModelList(PROVIDER_MODELS_MAP);

// Pre-built index for O(1) provider lookups instead of filtering the entire list
const PROVIDER_INDEX = new Map<string, DefaultModelListItem[]>();
for (const model of DEFAULT_MODEL_LIST) {
  const existing = PROVIDER_INDEX.get(model.providerId);
  if (existing) {
    existing.push(model);
  } else {
    PROVIDER_INDEX.set(model.providerId, [model]);
  }
}

export function getModelsForProvider(providerId: string): DefaultModelListItem[] {
  return PROVIDER_INDEX.get(providerId) ?? [];
}

export function getEnabledModelsForProvider(providerId: string): DefaultModelListItem[] {
  return (PROVIDER_INDEX.get(providerId) ?? []).filter((model) => model.enabled);
}

export function getModel(providerId: string, modelId: string): DefaultModelListItem | undefined {
  return (PROVIDER_INDEX.get(providerId) ?? []).find((model) => model.id === modelId);
}

export function getAllEnabledModels(): DefaultModelListItem[] {
  return DEFAULT_MODEL_LIST.filter((model) => model.enabled);
}

export function getModelIdsForProvider(providerId: string): string[] {
  return getModelsForProvider(providerId).map((model) => model.id);
}

export { default as ai21 } from './ai21';
export { default as anthropic } from './anthropic';
export { default as azure } from './azure';
export { default as baichuan } from './baichuan';
export { default as bedrock } from './bedrock';
export { default as bfl } from './bfl';
export { default as cerebras } from './cerebras';
export { default as cloudflare } from './cloudflare';
export { default as cohere } from './cohere';
export { default as dashscope } from './dashscope';
export { default as deepseek } from './deepseek';
export { default as fal } from './fal';
export { default as fireworksai } from './fireworksai';
export { default as giteeai } from './giteeai';
export { default as github } from './github';
export { default as google } from './google';
export { default as groq } from './groq';
export { default as higress } from './higress';
export { default as huggingface } from './huggingface';
export { default as hunyuan } from './hunyuan';
export { default as infiniai } from './infiniai';
export { default as internlm } from './internlm';
export { default as jina } from './jina';
export { default as lmstudio } from './lmstudio';
export { default as minimax } from './minimax';
export { default as mistral } from './mistral';
export { default as modelscope } from './modelscope';
export { default as moonshot } from './moonshot';
export { default as nebius } from './nebius';
export { default as novita } from './novita';
export { default as nvidia } from './nvidia';
export { default as ollama } from './ollama';
export { default as openai } from './openai';
export { default as openrouter } from './openrouter';
export { default as perplexity } from './perplexity';
export { default as ppio } from './ppio';
export { default as qiniu } from './qiniu';
export { default as sambanova } from './sambanova';
export { default as search1api } from './search1api';
export { default as sensenova } from './sensenova';
export { default as silicon } from './silicon';
export { default as spark } from './spark';
export { default as stepfun } from './stepfun';
export { default as taichu } from './taichu';
export { default as tencentcloud } from './tencentcloud';
export { default as togetherai } from './togetherai';
export { default as upstage } from './upstage';
export { default as vertexai } from './vertexai';
export { default as vllm } from './vllm';
export { default as volcengine } from './volcengine';
export { default as wenxin } from './wenxin';
export { default as xai } from './xai';
export { default as xiaomimimo } from './xiaomimimo';
export { default as xinference } from './xinference';
export { default as yi } from './yi';
export { default as zhipu } from './zhipu';
