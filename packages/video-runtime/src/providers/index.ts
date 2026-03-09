/**
 * Video Providers
 *
 * Export all video provider implementations.
 */

// Base provider
export { BaseVideoProvider, stripProviderPrefix } from './base';
// DashScope (Aliyun Bailian)
export { createDashScopeProvider, DashScopeVideoProvider } from './dashscope';
// Google Veo
export { createGoogleProvider, GoogleVideoProvider } from './google';
// Kling AI
export { createKlingProvider, KlingVideoProvider } from './kling';
// MiniMax Hailuo
export { createMiniMaxProvider, MiniMaxVideoProvider } from './minimax';
// OpenAI Sora
export { createOpenAIProvider, OpenAIVideoProvider } from './openai';
// OpenAI Compatible
export {
  createOpenAICompatibleProvider,
  type OpenAICompatibleConfig,
  OpenAICompatibleVideoProvider,
} from './openai-compatible';
// ByteDance Seedance
export { createSeedanceProvider, SeedanceVideoProvider } from './seedance';
// Vidu
export { createViduProvider, ViduVideoProvider } from './vidu';
