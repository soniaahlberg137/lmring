import { DEFAULT_MODEL_LIST } from '../models';

/**
 * Check if a model is a video model based on its model ID.
 * Video models cannot be tested via chat/completions endpoints.
 */
export function isVideoModel(modelId: string): boolean {
  const model = DEFAULT_MODEL_LIST.find((m) => m.id === modelId);
  return model?.type === 'video';
}

/**
 * Get the runtime model ID for a given internal model ID.
 * Returns the runtimeModelId if defined, otherwise returns null.
 */
export function getRuntimeModelId(modelId: string): string | null {
  const model = DEFAULT_MODEL_LIST.find((m) => m.id === modelId);
  if (model && 'runtimeModelId' in model && model.runtimeModelId) {
    return model.runtimeModelId;
  }
  return null;
}

/**
 * Get the runtime provider for a given video model ID.
 * Returns the runtimeProvider if defined, otherwise returns null.
 */
export function getRuntimeProvider(modelId: string): string | null {
  const model = DEFAULT_MODEL_LIST.find((m) => m.id === modelId);
  if (model && 'runtimeProvider' in model && model.runtimeProvider) {
    return model.runtimeProvider;
  }
  return null;
}
