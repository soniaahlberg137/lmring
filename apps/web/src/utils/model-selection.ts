import type { ModelOption } from '@/types/arena';

/**
 * Select a single random model from available models, excluding specified IDs.
 *
 * @param availableModels - The list of available models to choose from
 * @param excludeIds - Model IDs to exclude from selection
 * @param randomFn - Random number generator function (0-1), defaults to Math.random
 * @returns The selected model ID, or empty string if no models available
 */
export function selectRandomModel(
  availableModels: ModelOption[],
  excludeIds: string[] = [],
  randomFn: () => number = Math.random,
): string {
  if (availableModels.length === 0) {
    return '';
  }

  // Filter out excluded models (Set keeps this O(n) instead of O(n*m))
  const excludedIdSet = new Set(excludeIds);
  const eligibleModels = availableModels.filter((model) => !excludedIdSet.has(model.id));

  // If no eligible models, fall back to all available models
  const poolToSelectFrom = eligibleModels.length > 0 ? eligibleModels : availableModels;

  // Select random model from pool
  const randomIndex = Math.floor(randomFn() * poolToSelectFrom.length);
  return poolToSelectFrom[randomIndex]?.id || '';
}

/**
 * Select multiple unique random models from available models.
 * Each model will be different (when possible). If there are fewer models than
 * requested count, duplicates will be allowed.
 *
 * @param availableModels - The list of available models to choose from
 * @param count - Number of models to select
 * @param excludeIds - Initial model IDs to exclude from selection
 * @param randomFn - Random number generator function (0-1), defaults to Math.random
 * @returns Array of selected model IDs
 */
export function selectUniqueRandomModels(
  availableModels: ModelOption[],
  count: number,
  excludeIds: string[] = [],
  randomFn: () => number = Math.random,
): string[] {
  const selectedIds: string[] = [];
  const allExcludedIds = new Set(excludeIds);

  for (let i = 0; i < count; i++) {
    const modelId = selectRandomModel(availableModels, Array.from(allExcludedIds), randomFn);

    if (!modelId) {
      break;
    }

    selectedIds.push(modelId);
    allExcludedIds.add(modelId);
  }

  return selectedIds;
}
