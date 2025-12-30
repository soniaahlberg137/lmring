'use client';

import { Button, ModelCardSkeleton, ResponseViewer, ScrollArea } from '@lmring/ui';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { toast } from 'sonner';
import { ModelCard } from '@/components/arena/model-card';
import {
  PromptInput,
  PromptInputActions,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/arena/prompt-input';
import { useConversation } from '@/hooks/use-conversation';
import { useProviderMetadata } from '@/hooks/use-provider-metadata';
import {
  useWorkflowExecution,
  type WorkflowPersistenceCallbacks,
} from '@/hooks/use-workflow-execution';
import {
  arenaSelectors,
  settingsSelectors,
  useArenaStore,
  useSettingsStore,
  useWorkflowStore,
  workflowSelectors,
} from '@/stores';
import type { LoadedConversation } from '@/stores/workflow-store';
import type { ModelComparison, ModelOption } from '@/types/arena';
import { DEFAULT_MODEL_CONFIG } from '@/types/arena';
import type { ArenaWorkflow } from '@/types/workflow';

export default function ArenaPage() {
  const params = useParams();
  const conversationIdParam = params.conversationId as string[] | undefined;
  const conversationId = conversationIdParam?.[0];

  const router = useRouter();
  const t = useTranslations('Arena');
  const providerMetadata = useProviderMetadata();

  const { loadConversation, saveMessage, saveModelResponse, createConversation } =
    useConversation();

  const comparisons = useArenaStore(arenaSelectors.comparisons);
  const initialized = useArenaStore(arenaSelectors.initialized);
  const initializeComparisons = useArenaStore((state) => state.initializeComparisons);
  const addComparison = useArenaStore((state) => state.addComparison);
  const selectModel = useArenaStore((state) => state.selectModel);
  const toggleSync = useArenaStore((state) => state.toggleSync);
  const updateConfig = useArenaStore((state) => state.updateConfig);
  const setCustomPrompt = useArenaStore((state) => state.setCustomPrompt);
  const moveLeft = useArenaStore((state) => state.moveLeft);
  const moveRight = useArenaStore((state) => state.moveRight);
  const removeComparison = useArenaStore((state) => state.removeComparison);
  const availableModels = useArenaStore(arenaSelectors.availableModels);
  const setAvailableModels = useArenaStore((state) => state.setAvailableModels);
  const modelsLastLoadedAt = useArenaStore(arenaSelectors.modelsLastLoadedAt);
  const setModelsLastLoadedAt = useArenaStore((state) => state.setModelsLastLoadedAt);
  const setComparisons = useArenaStore((state) => state.setComparisons);
  const resetComparisons = useArenaStore((state) => state.resetComparisons);
  const enabledModelsMap = useArenaStore(arenaSelectors.enabledModelsMap);
  const setEnabledModelsMap = useArenaStore((state) => state.setEnabledModelsMap);
  const customModelsMap = useArenaStore(arenaSelectors.customModelsMap);
  const setCustomModelsMap = useArenaStore((state) => state.setCustomModelsMap);
  const modelOverridesMap = useArenaStore(arenaSelectors.modelOverridesMap);
  const setModelOverridesMap = useArenaStore((state) => state.setModelOverridesMap);

  const savedApiKeys = useSettingsStore(settingsSelectors.savedApiKeys);
  const loadApiKeys = useSettingsStore((state) => state.loadApiKeys);
  const apiKeysLoaded = useSettingsStore(settingsSelectors.apiKeysLoaded);

  const workflows = useWorkflowStore(workflowSelectors.workflows);
  const createWorkflow = useWorkflowStore((state) => state.createWorkflow);
  const deleteWorkflow = useWorkflowStore((state) => state.deleteWorkflow);
  const setWorkflowGlobalPrompt = useWorkflowStore((state) => state.setGlobalPrompt);
  const workflowGlobalPrompt = useWorkflowStore(workflowSelectors.globalPrompt);
  const isAnyRunning = useWorkflowStore(workflowSelectors.isAnyRunning);
  const toggleWorkflowSync = useWorkflowStore((state) => state.toggleWorkflowSync);
  const setWorkflowConfig = useWorkflowStore((state) => state.setWorkflowConfig);
  const setWorkflowCustomPrompt = useWorkflowStore((state) => state.setCustomPrompt);
  const clearWorkflowHistory = useWorkflowStore((state) => state.clearWorkflowHistory);
  const resetConversation = useWorkflowStore((state) => state.resetConversation);
  const loadConversationHistory = useWorkflowStore((state) => state.loadConversationHistory);
  const setConversationId = useWorkflowStore((state) => state.setConversationId);
  const getWorkflowConversationId = useWorkflowStore((state) => state.getConversationId);
  const storedConversationId = useWorkflowStore(workflowSelectors.conversationId);
  const setNewConversation = useWorkflowStore((state) => state.setNewConversation);
  const isCreatingConversation = useWorkflowStore(workflowSelectors.isCreatingConversation);
  const workflowOrder = useWorkflowStore(workflowSelectors.workflowOrder);
  const setIsCreatingConversation = useWorkflowStore((state) => state.setIsCreatingConversation);

  const [currentUrlConversationId, setCurrentUrlConversationId] = React.useState<
    string | undefined
  >(conversationId);

  const comparisonWorkflowMap = React.useRef<Map<string, string>>(new Map());

  const handleConversationCreated = React.useCallback(
    (newConversationId: string, title: string) => {
      setConversationId(newConversationId);
      setCurrentUrlConversationId(newConversationId);
      setNewConversation({ id: newConversationId, title, updatedAt: new Date().toISOString() });
      setConversationLoaded(true);
    },
    [setConversationId, setNewConversation],
  );

  const persistenceCallbacks = React.useMemo<WorkflowPersistenceCallbacks>(
    () => ({
      onCreateConversation: async (title: string) => {
        const conversation = await createConversation(title);
        return conversation?.id ?? null;
      },
      onSaveUserMessage: async (convId: string, content: string) => {
        const message = await saveMessage(convId, 'user', content);
        return message?.id ?? null;
      },
      onSaveModelResponse: async (
        workflowId: string,
        messageId: string,
        modelName: string,
        providerName: string,
        responseContent: string,
        tokensUsed?: number,
        responseTimeMs?: number,
      ) => {
        // Find the displayPosition by looking up the workflowId in comparisonWorkflowMap
        let displayPosition = 0;
        for (const [comparisonId, wfId] of comparisonWorkflowMap.current.entries()) {
          if (wfId === workflowId) {
            // Find the index of this comparison in the comparisons array
            const index = comparisons.findIndex((c) => c.id === comparisonId);
            if (index >= 0) {
              displayPosition = index;
            }
            break;
          }
        }

        await saveModelResponse(
          messageId,
          modelName,
          providerName,
          responseContent,
          tokensUsed,
          responseTimeMs,
          displayPosition,
        );
      },
      onConversationCreated: handleConversationCreated,
    }),
    [createConversation, saveMessage, saveModelResponse, handleConversationCreated, comparisons],
  );

  const { startAllSyncedWorkflows, cancelAllWorkflows, regenerateLastResponse } =
    useWorkflowExecution(persistenceCallbacks);

  const [enabledModelsLoaded, setEnabledModelsLoaded] = React.useState(false);
  const [maximizedContent, setMaximizedContent] = React.useState<string | null>(null);
  const [conversationLoaded, setConversationLoaded] = React.useState(false);
  const [conversationError, setConversationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!apiKeysLoaded) {
      loadApiKeys();
    }
  }, [apiKeysLoaded, loadApiKeys]);

  React.useEffect(() => {
    if (conversationId !== currentUrlConversationId) {
      setCurrentUrlConversationId(conversationId);

      if (isCreatingConversation) {
        setIsCreatingConversation(false);
        return;
      }

      if (!conversationId) {
        // Always reset when navigating to new chat, regardless of storedConversationId
        resetConversation();
        comparisonWorkflowMap.current.clear();
        if (availableModels.length > 0) {
          resetComparisons(availableModels);
        }
        setConversationLoaded(false);
        setConversationError(null);
      } else if (conversationId !== storedConversationId) {
        setConversationLoaded(false);
        setConversationError(null);
      }
    }
  }, [
    conversationId,
    currentUrlConversationId,
    storedConversationId,
    isCreatingConversation,
    resetConversation,
    setIsCreatingConversation,
    availableModels,
    resetComparisons,
  ]);

  React.useEffect(() => {
    // When "New Chat" resets the workflow store without a route param change,
    // make sure we don't keep "conversationLoaded" or old workflow mappings around.
    if (storedConversationId !== null) return;

    if (comparisonWorkflowMap.current.size > 0) {
      comparisonWorkflowMap.current.clear();
    }
    if (conversationLoaded) {
      setConversationLoaded(false);
    }
  }, [conversationLoaded, storedConversationId]);

  const hasConfiguredProviders = React.useMemo(() => {
    return savedApiKeys.some((k) => k.enabled);
  }, [savedApiKeys]);

  // Fetch enabled and custom models with caching
  React.useEffect(() => {
    const fetchEnabledModels = async () => {
      if (!apiKeysLoaded) return;

      const needsRefresh =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('arena_models_need_refresh') === 'true';

      if (modelsLastLoadedAt && !needsRefresh) {
        setEnabledModelsLoaded(true);
        return;
      }

      const enabledProviders = savedApiKeys.filter((k) => k.enabled && k.id);
      if (enabledProviders.length === 0) {
        setEnabledModelsLoaded(true);
        setModelsLastLoadedAt(Date.now());
        return;
      }

      const apiKeyIdToProviderName = new Map<string, string>();
      for (const provider of enabledProviders) {
        if (provider.id) {
          apiKeyIdToProviderName.set(provider.id, provider.providerName.toLowerCase());
        }
      }

      const newEnabledModelsMap = new Map<string, Set<string>>();
      const newCustomModelsMap = new Map<string, Array<{ modelId: string; displayName: string }>>();
      const newModelOverridesMap = new Map<
        string,
        Map<
          string,
          {
            modelId: string;
            displayName?: string | null;
            groupName?: string | null;
            abilities?: Record<string, boolean> | null;
            supportsStreaming?: boolean | null;
            priceCurrency?: string | null;
            inputPrice?: number | null;
            outputPrice?: number | null;
          }
        >
      >();

      try {
        const [enabledResponse, customResponse, overridesResponse] = await Promise.all([
          fetch('/api/settings/api-keys/all/enabled-models'),
          fetch('/api/settings/api-keys/all/custom-models'),
          fetch('/api/settings/api-keys/all/model-overrides'),
        ]);

        if (enabledResponse.ok) {
          const data = await enabledResponse.json();
          const modelsByApiKeyId = data.models || {};

          for (const [apiKeyId, models] of Object.entries(modelsByApiKeyId)) {
            const providerName = apiKeyIdToProviderName.get(apiKeyId);
            if (providerName) {
              const enabledModelIds = new Set<string>();
              for (const model of models as Array<{ modelId: string; enabled: boolean }>) {
                if (model.enabled) {
                  enabledModelIds.add(model.modelId);
                }
              }
              newEnabledModelsMap.set(providerName, enabledModelIds);
            }
          }
        }

        if (customResponse.ok) {
          const data = await customResponse.json();
          const modelsByApiKeyId = data.models || {};

          for (const [apiKeyId, models] of Object.entries(modelsByApiKeyId)) {
            const providerName = apiKeyIdToProviderName.get(apiKeyId);
            if (providerName) {
              const customModels = (models as Array<{ modelId: string; displayName?: string }>).map(
                (m) => ({
                  modelId: m.modelId,
                  displayName: m.displayName || m.modelId,
                }),
              );
              if (customModels.length > 0) {
                newCustomModelsMap.set(providerName, customModels);
              }
            }
          }
        }

        if (overridesResponse.ok) {
          const data = await overridesResponse.json();
          const overridesByApiKeyId = data.overrides || {};

          for (const [apiKeyId, overrides] of Object.entries(overridesByApiKeyId)) {
            const providerName = apiKeyIdToProviderName.get(apiKeyId);
            if (providerName) {
              const providerOverrides = new Map<
                string,
                {
                  modelId: string;
                  displayName?: string | null;
                  groupName?: string | null;
                  abilities?: Record<string, boolean> | null;
                  supportsStreaming?: boolean | null;
                  priceCurrency?: string | null;
                  inputPrice?: number | null;
                  outputPrice?: number | null;
                }
              >();
              for (const override of overrides as Array<{
                modelId: string;
                displayName?: string | null;
                groupName?: string | null;
                abilities?: Record<string, boolean> | null;
                supportsStreaming?: boolean | null;
                priceCurrency?: string | null;
                inputPrice?: number | null;
                outputPrice?: number | null;
              }>) {
                providerOverrides.set(override.modelId, override);
              }
              if (providerOverrides.size > 0) {
                newModelOverridesMap.set(providerName, providerOverrides);
              }
            }
          }
        }

        setModelsLastLoadedAt(Date.now());
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('arena_models_need_refresh');
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }

      setEnabledModelsMap(newEnabledModelsMap);
      setCustomModelsMap(newCustomModelsMap);
      setModelOverridesMap(newModelOverridesMap);
      setEnabledModelsLoaded(true);
    };

    fetchEnabledModels();
  }, [
    apiKeysLoaded,
    modelsLastLoadedAt,
    setModelsLastLoadedAt,
    setEnabledModelsMap,
    setCustomModelsMap,
    setModelOverridesMap,
    savedApiKeys,
  ]);

  const filteredProviders = React.useMemo(() => {
    if (hasConfiguredProviders) {
      const configuredProviderIds = savedApiKeys
        .filter((k) => k.enabled)
        .map((k) => k.providerName.toLowerCase());
      return providerMetadata.filter((p) => configuredProviderIds.includes(p.id.toLowerCase()));
    }
    return providerMetadata;
  }, [savedApiKeys, providerMetadata, hasConfiguredProviders]);

  const computedModels = React.useMemo(() => {
    const models: ModelOption[] = [];
    const addedModelIds = new Set<string>();

    for (const provider of filteredProviders) {
      if (provider.models) {
        const providerEnabledModels = enabledModelsMap.get(provider.id.toLowerCase());
        const providerOverrides = modelOverridesMap.get(provider.id.toLowerCase());

        for (const model of provider.models) {
          const shouldInclude =
            !hasConfiguredProviders ||
            !enabledModelsLoaded ||
            !providerEnabledModels ||
            providerEnabledModels.size === 0 ||
            providerEnabledModels.has(model.id);

          if (shouldInclude) {
            const modelId = `${provider.id}:${model.id}`;
            // Apply model override if exists
            const override = providerOverrides?.get(model.id);
            const displayName = override?.displayName || model.displayName || model.id;
            const inputPrice = override?.inputPrice ?? model.pricing?.input;
            const outputPrice = override?.outputPrice ?? model.pricing?.output;

            models.push({
              id: modelId,
              name: displayName,
              provider: provider.name,
              providerId: provider.id,
              description: provider.description || `${displayName} from ${provider.name}`,
              context: model.contextWindowTokens
                ? `${model.contextWindowTokens.toLocaleString()} tokens`
                : undefined,
              inputPricing: inputPrice ? `$${inputPrice} / million tokens` : undefined,
              outputPricing: outputPrice ? `$${outputPrice} / million tokens` : undefined,
              type: 'pro',
              isNew: false,
              isCustom: false,
            });
            addedModelIds.add(modelId);
          }
        }
      }

      const providerCustomModels = customModelsMap.get(provider.id.toLowerCase());
      if (providerCustomModels) {
        for (const customModel of providerCustomModels) {
          const modelId = `${provider.id}:${customModel.modelId}`;
          if (!addedModelIds.has(modelId)) {
            models.push({
              id: modelId,
              name: customModel.displayName,
              provider: provider.name,
              providerId: provider.id,
              description: `${customModel.displayName} from ${provider.name}`,
              type: 'pro',
              isNew: false,
              isCustom: true,
            });
            addedModelIds.add(modelId);
          }
        }
      }
    }

    const customProviders = savedApiKeys.filter((k) => k.isCustom && k.enabled);
    for (const customProvider of customProviders) {
      const providerCustomModels = customModelsMap.get(customProvider.providerName.toLowerCase());
      if (providerCustomModels) {
        for (const customModel of providerCustomModels) {
          const modelId = `${customProvider.providerName}:${customModel.modelId}`;
          if (!addedModelIds.has(modelId)) {
            const iconProviderId = customProvider.providerType || customProvider.providerName;
            models.push({
              id: modelId,
              name: customModel.displayName,
              provider: customProvider.providerName,
              providerId: iconProviderId,
              description: `${customModel.displayName} (Custom Provider)`,
              type: 'pro',
              isNew: false,
              isCustom: true,
            });
            addedModelIds.add(modelId);
          }
        }
      }
    }

    return models;
  }, [
    filteredProviders,
    enabledModelsMap,
    customModelsMap,
    modelOverridesMap,
    hasConfiguredProviders,
    enabledModelsLoaded,
    savedApiKeys,
  ]);

  React.useEffect(() => {
    if (computedModels.length > 0 && enabledModelsLoaded) {
      setAvailableModels(computedModels);
    }
  }, [computedModels, enabledModelsLoaded, setAvailableModels]);

  React.useEffect(() => {
    if (computedModels.length > 0 && !initialized) {
      initializeComparisons(computedModels);
    }
  }, [computedModels, initialized, initializeComparisons]);

  const displayModels = availableModels.length > 0 ? availableModels : computedModels;

  const getKeyIdForModel = React.useCallback(
    (modelId: string): string | undefined => {
      const providerId = modelId.split(':')[0] || '';
      if (!providerId) return undefined;
      const key = savedApiKeys.find(
        (k) => k.providerName.toLowerCase() === providerId.toLowerCase() && k.enabled,
      );
      return key?.id;
    },
    [savedApiKeys],
  );

  React.useEffect(() => {
    const loadConversationData = async () => {
      if (!conversationId) {
        return;
      }

      if (conversationLoaded && storedConversationId === conversationId) {
        return;
      }

      if (!apiKeysLoaded || !enabledModelsLoaded) {
        return;
      }

      try {
        const data = await loadConversation(conversationId);
        if (!data) {
          setConversationError('Conversation not found');
          return;
        }

        const modelKeyMap = new Map<string, { modelId: string; keyId: string }>();

        for (const message of data.messages) {
          if (message.responses) {
            for (const response of message.responses) {
              const fullModelId = `${response.providerName}:${response.modelName}`;
              if (!modelKeyMap.has(fullModelId)) {
                // Always add the model to the map, even if keyId is missing
                // This ensures card count matches original conversation
                const keyId = getKeyIdForModel(fullModelId) || '';
                modelKeyMap.set(fullModelId, { modelId: fullModelId, keyId });
              }
            }
          }
        }
        loadConversationHistory(data as LoadedConversation, modelKeyMap);
        setConversationLoaded(true);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        setConversationError('Failed to load conversation');
      }
    };

    loadConversationData();
  }, [
    conversationId,
    conversationLoaded,
    storedConversationId,
    apiKeysLoaded,
    enabledModelsLoaded,
    loadConversation,
    loadConversationHistory,
    getKeyIdForModel,
  ]);

  const getOrCreateWorkflow = React.useCallback(
    (comparisonId: string, modelId: string, synced: boolean): string | undefined => {
      const existingWorkflowId = comparisonWorkflowMap.current.get(comparisonId);
      if (existingWorkflowId) {
        const existingWorkflow = workflows.get(existingWorkflowId);
        if (existingWorkflow && existingWorkflow.modelId === modelId) {
          return existingWorkflowId;
        }
        deleteWorkflow(existingWorkflowId);
        comparisonWorkflowMap.current.delete(comparisonId);
      }

      const keyId = getKeyIdForModel(modelId);
      if (!keyId) {
        return undefined;
      }

      const workflowId = createWorkflow(modelId, keyId, synced);
      comparisonWorkflowMap.current.set(comparisonId, workflowId);

      return workflowId;
    },
    [workflows, deleteWorkflow, createWorkflow, getKeyIdForModel],
  );

  const getWorkflowForComparison = React.useCallback(
    (comparisonId: string) => {
      const workflowId = comparisonWorkflowMap.current.get(comparisonId);
      if (!workflowId) return undefined;
      return workflows.get(workflowId);
    },
    [workflows],
  );

  React.useEffect(() => {
    // Only sync workflows -> comparisons when viewing an existing conversation route.
    // In "New Chat" mode, workflows are created lazily per-card and should not dictate card count.
    if (!conversationId || !storedConversationId || storedConversationId !== conversationId) {
      return;
    }
    if (!conversationLoaded || workflows.size === 0) {
      return;
    }

    // Use workflowOrder for consistent ordering if available, otherwise fall back to entries
    const orderedWorkflows =
      workflowOrder.length > 0
        ? workflowOrder
            .map((id) => {
              const workflow = workflows.get(id);
              return workflow ? ([id, workflow] as const) : null;
            })
            .filter((entry): entry is [string, ArenaWorkflow] => entry !== null)
        : Array.from(workflows.entries());

    // Check if comparisons need to be synced with workflows
    // This happens when:
    // 1. Length mismatch
    // 2. ModelId mismatch (comparisons have default models, workflows have loaded models)
    // 3. ComparisonWorkflowMap is stale (pointing to old workflow IDs from previous conversation)
    const needsSync =
      orderedWorkflows.length !== comparisons.length ||
      orderedWorkflows.some(([workflowId, wf], index) => {
        const comparison = comparisons[index];
        if (!comparison) return true;
        if (comparison.modelId !== wf.modelId) return true;
        const mappedWorkflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (mappedWorkflowId !== workflowId) return true;
        return false;
      });

    if (needsSync) {
      const newComparisons: ModelComparison[] = orderedWorkflows.map(
        ([workflowId, workflow], index) => {
          const existingComparison = comparisons[index];
          const newId = existingComparison?.id || `${Date.now()}-${index}`;
          comparisonWorkflowMap.current.set(newId, workflowId);
          return {
            id: newId,
            modelId: workflow.modelId,
            response: '',
            isLoading: false,
            synced: workflow.synced,
            customPrompt: workflow.customPrompt || '',
            config: { ...DEFAULT_MODEL_CONFIG },
          };
        },
      );

      setComparisons(newComparisons);
      return;
    }

    orderedWorkflows.forEach(([workflowId, _workflow], index) => {
      const comparison = comparisons[index];
      if (comparison) {
        const currentMapping = comparisonWorkflowMap.current.get(comparison.id);
        if (currentMapping !== workflowId) {
          comparisonWorkflowMap.current.set(comparison.id, workflowId);
        }
      }
    });
  }, [
    conversationId,
    storedConversationId,
    conversationLoaded,
    workflows,
    workflowOrder,
    comparisons,
    setComparisons,
  ]);

  // Handle re-entry to the same conversation (e.g., navigating from History to the same conversation)
  React.useEffect(() => {
    if (
      conversationId &&
      conversationId === storedConversationId &&
      !conversationLoaded &&
      workflows.size > 0 &&
      comparisonWorkflowMap.current.size === 0
    ) {
      const orderedWorkflows =
        workflowOrder.length > 0
          ? workflowOrder
              .map((id) => {
                const workflow = workflows.get(id);
                return workflow ? ([id, workflow] as const) : null;
              })
              .filter((entry): entry is [string, ArenaWorkflow] => entry !== null)
          : Array.from(workflows.entries());

      // Check if comparisons need to be synced with workflows
      // This happens when:
      // 1. Length mismatch
      // 2. ModelId mismatch
      // 3. ComparisonWorkflowMap is stale (pointing to old workflow IDs)
      const needsSync =
        orderedWorkflows.length !== comparisons.length ||
        orderedWorkflows.some(([workflowId, wf], index) => {
          const comparison = comparisons[index];
          if (!comparison) return true;
          if (comparison.modelId !== wf.modelId) return true;
          const mappedWorkflowId = comparisonWorkflowMap.current.get(comparison.id);
          if (mappedWorkflowId !== workflowId) return true;
          return false;
        });

      if (needsSync) {
        const newComparisons: ModelComparison[] = orderedWorkflows.map(
          ([workflowId, workflow], index) => {
            const existingComparison = comparisons[index];
            const newId = existingComparison?.id || `${Date.now()}-${index}`;
            comparisonWorkflowMap.current.set(newId, workflowId);
            return {
              id: newId,
              modelId: workflow.modelId,
              response: '',
              isLoading: false,
              synced: workflow.synced,
              customPrompt: workflow.customPrompt || '',
              config: { ...DEFAULT_MODEL_CONFIG },
            };
          },
        );
        setComparisons(newComparisons);
        setConversationLoaded(true);
        return;
      }

      orderedWorkflows.forEach(([workflowId], index) => {
        const comparison = comparisons[index];
        if (comparison) {
          comparisonWorkflowMap.current.set(comparison.id, workflowId);
        }
      });

      setConversationLoaded(true);
    }
  }, [
    conversationId,
    storedConversationId,
    conversationLoaded,
    workflows,
    workflowOrder,
    comparisons,
    setComparisons,
  ]);

  const handleSubmit = React.useCallback(async () => {
    if (!workflowGlobalPrompt.trim()) return;
    const submitWindowPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isNewConversationSubmit = !storedConversationId;

    if (!hasConfiguredProviders) {
      toast.warning(t('configure_api_keys_title'), {
        description: t('configure_api_keys_description'),
        action: {
          label: t('go_to_settings'),
          onClick: () => router.push('/settings?tab=provider'),
        },
      });
      return;
    }

    const syncedComparisons = comparisons.filter((comp) => comp.synced);

    const missingModelCards = syncedComparisons.filter((comp) => !comp.modelId);
    if (missingModelCards.length > 0) {
      toast.warning(t('select_model_for_all_cards_title'), {
        description: t('select_model_for_all_cards_description'),
      });
      return;
    }

    if (syncedComparisons.length === 0) {
      toast.warning(t('select_model_title'), {
        description: t('select_model_description'),
      });
      return;
    }

    const missingKeys: string[] = [];
    for (const comp of syncedComparisons) {
      const workflowId = getOrCreateWorkflow(comp.id, comp.modelId, comp.synced);
      if (!workflowId) {
        const providerId = comp.modelId.split(':')[0] || 'unknown';
        if (!missingKeys.includes(providerId)) {
          missingKeys.push(providerId);
        }
      }
    }

    if (missingKeys.length > 0) {
      toast.error(t('missing_api_key_title'), {
        description: t('missing_api_key_description', { providers: missingKeys.join(', ') }),
        action: {
          label: t('go_to_settings'),
          onClick: () => router.push('/settings?tab=provider'),
        },
      });
      return;
    }

    await startAllSyncedWorkflows();
    if (isNewConversationSubmit) {
      const convId = getWorkflowConversationId();
      const currentWindowPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const basePath = submitWindowPath.replace(/\/$/, '');
      const shouldUpdateUrl =
        !!convId &&
        currentWindowPath.replace(/\/$/, '') === basePath &&
        // avoid navigating if we're already on a conversation route
        basePath.endsWith('/arena');
      if (shouldUpdateUrl) {
        window.history.replaceState(null, '', `${basePath}/${convId}`);
      }
    }
    setWorkflowGlobalPrompt('');
  }, [
    workflowGlobalPrompt,
    comparisons,
    storedConversationId,
    getWorkflowConversationId,
    getOrCreateWorkflow,
    startAllSyncedWorkflows,
    hasConfiguredProviders,
    router,
    t,
    setWorkflowGlobalPrompt,
  ]);

  const handleModelSelect = React.useCallback(
    (index: number, modelId: string) => {
      selectModel(index, modelId);

      const comparison = comparisons[index];
      if (comparison) {
        getOrCreateWorkflow(comparison.id, modelId, comparison.synced);
      }
    },
    [selectModel, comparisons, getOrCreateWorkflow],
  );

  const handleSyncToggle = React.useCallback(
    (index: number, synced: boolean) => {
      toggleSync(index, synced);

      const comparison = comparisons[index];
      if (comparison) {
        const workflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (workflowId) {
          toggleWorkflowSync(workflowId, synced);
        }
      }
    },
    [toggleSync, comparisons, toggleWorkflowSync],
  );

  const handleConfigChange = React.useCallback(
    (index: number, config: Parameters<typeof updateConfig>[1]) => {
      updateConfig(index, config);

      const comparison = comparisons[index];
      if (comparison) {
        const workflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (workflowId) {
          setWorkflowConfig(workflowId, config);
        }
      }
    },
    [updateConfig, comparisons, setWorkflowConfig],
  );

  const handleCustomPromptChange = React.useCallback(
    (index: number, prompt: string) => {
      setCustomPrompt(index, prompt);

      const comparison = comparisons[index];
      if (comparison) {
        const workflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (workflowId) {
          setWorkflowCustomPrompt(workflowId, prompt);
        }
      }
    },
    [setCustomPrompt, comparisons, setWorkflowCustomPrompt],
  );

  const handleClear = React.useCallback(
    (index: number) => {
      const comparison = comparisons[index];
      if (comparison) {
        const workflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (workflowId) {
          clearWorkflowHistory(workflowId);
        }
      }
    },
    [comparisons, clearWorkflowHistory],
  );

  const handleDelete = React.useCallback(
    (index: number) => {
      const comparison = comparisons[index];
      if (comparison) {
        const workflowId = comparisonWorkflowMap.current.get(comparison.id);
        if (workflowId) {
          deleteWorkflow(workflowId);
          comparisonWorkflowMap.current.delete(comparison.id);
        }
      }
      removeComparison(index);
    },
    [comparisons, deleteWorkflow, removeComparison],
  );

  const handleRetry = React.useCallback(
    (comparisonId: string, _messageId: string) => {
      const workflowId = comparisonWorkflowMap.current.get(comparisonId);
      if (workflowId) {
        regenerateLastResponse(workflowId);
      }
    },
    [regenerateLastResponse],
  );

  const handleMaximize = React.useCallback((content: string) => {
    setMaximizedContent(content);
  }, []);

  React.useEffect(() => {
    return () => {
      cancelAllWorkflows();
    };
  }, [cancelAllWorkflows]);

  if (conversationError) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive">{conversationError}</div>
          <Button onClick={() => router.push('/arena')}>Start New Conversation</Button>
        </div>
      </div>
    );
  }

  if (
    !initialized ||
    (conversationId &&
      !conversationLoaded &&
      storedConversationId !== conversationId &&
      !isCreatingConversation)
  ) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div className="flex-1 overflow-hidden p-4">
          <div
            className="h-full gap-4 overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: '1fr',
            }}
          >
            <ModelCardSkeleton count={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden p-4">
        <div
          className="h-full gap-4 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${comparisons.length}, 1fr)`,
            gridTemplateRows: '1fr',
          }}
        >
          {comparisons.map((comparison, index) => {
            const workflow = getWorkflowForComparison(comparison.id);
            const lastAssistantMessage = workflow?.messages
              .filter((m) => m.role === 'assistant')
              .pop();
            const response =
              workflow?.pendingResponse?.content || lastAssistantMessage?.content || '';
            const isLoading = workflow?.status === 'running';

            return (
              <motion.div
                key={comparison.id}
                layout
                className="h-full min-h-0 min-w-0 overflow-hidden"
              >
                <ModelCard
                  modelId={comparison.modelId}
                  models={displayModels}
                  messages={workflow?.messages}
                  pendingResponse={workflow?.pendingResponse}
                  response={response}
                  isLoading={isLoading}
                  status={workflow?.status}
                  error={workflow?.error}
                  synced={comparison.synced}
                  customPrompt={comparison.customPrompt}
                  config={comparison.config}
                  index={index}
                  canMoveLeft={index > 0}
                  canMoveRight={index < comparisons.length - 1}
                  onModelSelect={(modelId) => handleModelSelect(index, modelId)}
                  onSyncToggle={(synced) => handleSyncToggle(index, synced)}
                  onConfigChange={(config) => handleConfigChange(index, config)}
                  onCustomPromptChange={(prompt) => handleCustomPromptChange(index, prompt)}
                  onClear={() => handleClear(index)}
                  onDelete={() => handleDelete(index)}
                  onMoveLeft={() => moveLeft(index)}
                  onMoveRight={() => moveRight(index)}
                  onAddCard={
                    index === comparisons.length - 1 && comparisons.length < 4
                      ? addComparison
                      : undefined
                  }
                  onThumbsUp={() => {}}
                  onThumbsDown={() => {}}
                  onRetry={(messageId) => handleRetry(comparison.id, messageId)}
                  onMaximize={handleMaximize}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="border-t bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="p-4 space-y-4">
          <PromptInput
            value={workflowGlobalPrompt}
            onChange={setWorkflowGlobalPrompt}
            onSubmit={handleSubmit}
            onStop={cancelAllWorkflows}
            isLoading={isAnyRunning}
            className="border-input"
          >
            <PromptInputTextarea placeholder={t('prompt_placeholder')} />
            <PromptInputFooter>
              <PromptInputActions />
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      {maximizedContent && (
        <div className="fixed inset-0 z-20 bg-background flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-end p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => setMaximizedContent(null)}>
              <XIcon className="size-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-8 pb-20">
              <ResponseViewer content={maximizedContent} isStreaming={false} />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
