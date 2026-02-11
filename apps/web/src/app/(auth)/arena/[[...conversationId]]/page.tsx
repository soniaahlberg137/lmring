'use client';

import type { ComparisonType } from '@lmring/database';
import { Button, cn, InitialArenaViewSkeleton, ResponseViewer, ScrollArea } from '@lmring/ui';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';
import { InitialArenaView } from '@/components/arena/initial-arena-view';
import { ModelCard } from '@/components/arena/model-card';
import {
  PromptInput,
  PromptInputActions,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/arena/prompt-input';
import {
  ImagePreviews,
  ModeChip,
  PromptInputFeatureButtons,
} from '@/components/arena/prompt-input-features';
import { VoteBar } from '@/components/arena/vote-bar';
import { CARD_MIN_WIDTH, MAX_COMPARISON_CARDS } from '@/constants/arena';
import { useConversation } from '@/hooks/use-conversation';
import { conversationsKeys } from '@/hooks/use-conversations-query';
import { useProviderMetadata } from '@/hooks/use-provider-metadata';
import { useTranslations } from '@/hooks/use-translations';
import {
  type MessageAttachmentForSave,
  type ResponseAttachmentForSave,
  useWorkflowExecution,
  type WorkflowPersistenceCallbacks,
} from '@/hooks/use-workflow-execution';
import { processAiResponseMedia } from '@/libs/media-response-handler';
import {
  arenaSelectors,
  settingsSelectors,
  useArenaStoreShallow,
  useSettingsStore,
  useVoteStore,
  useWorkflowStoreShallow,
  voteSelectors,
  workflowSelectors,
} from '@/stores';
import type { LoadedConversation } from '@/stores/workflow-store';
import type { ModelComparison, ModelOption } from '@/types/arena';
import { DEFAULT_MODEL_CONFIG } from '@/types/arena';
import type { InputMode, UploadedImage } from '@/types/input-mode';
import { INPUT_MODE_ABILITY_MAP } from '@/types/input-mode';
import type { ArenaWorkflow, WorkflowImageAttachment } from '@/types/workflow';
import { selectUniqueRandomModels } from '@/utils/model-selection';

export default function ArenaPage() {
  const params = useParams();
  const conversationIdParam = params.conversationId as string[] | undefined;
  const conversationId = conversationIdParam?.[0];

  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const providerMetadata = useProviderMetadata();
  const queryClient = useQueryClient();

  const { loadConversation, saveMessage, saveModelResponse, createConversation } =
    useConversation();

  // Arena store
  const {
    comparisons,
    initialized,
    availableModels,
    modelsLastLoadedAt,
    enabledModelsMap,
    customModelsMap,
    modelOverridesMap,
  } = useArenaStoreShallow(arenaSelectors.arenaState);
  const {
    initializeComparisons,
    addComparison,
    selectModel,
    toggleSync,
    updateConfig,
    setCustomPrompt,
    moveLeft,
    moveRight,
    removeComparison,
    setAvailableModels,
    setModelsLastLoadedAt,
    setComparisons,
    resetComparisons,
    setEnabledModelsMap,
    setCustomModelsMap,
    setModelOverridesMap,
    setMainContentReady,
  } = useArenaStoreShallow(arenaSelectors.arenaActions);

  // Settings store
  const savedApiKeys = useSettingsStore(settingsSelectors.savedApiKeys);
  const loadApiKeys = useSettingsStore((state) => state.loadApiKeys);
  const apiKeysLoaded = useSettingsStore(settingsSelectors.apiKeysLoaded);

  // Workflow store
  const {
    workflows,
    workflowOrder,
    globalPrompt: workflowGlobalPrompt,
    isAnyRunning,
    conversationId: storedConversationId,
    isCreatingConversation,
  } = useWorkflowStoreShallow(workflowSelectors.workflowState);
  const {
    createWorkflow,
    deleteWorkflow,
    setGlobalPrompt: setWorkflowGlobalPrompt,
    toggleWorkflowSync,
    setWorkflowConfig,
    setCustomPrompt: setWorkflowCustomPrompt,
    clearWorkflowHistory,
    resetConversation,
    loadConversationHistory,
    setConversationId,
    getConversationId: getWorkflowConversationId,
    setNewConversation,
    setIsCreatingConversation,
  } = useWorkflowStoreShallow(workflowSelectors.workflowActions);

  // Vote store
  const { hoveredVote, isSubmitting: isVoteSubmitting } = useVoteStore(
    useShallow(voteSelectors.voteState),
  );
  const { getVote, setHoveredVote, submitVote, loadVoteForMessage, clearAllVotes } = useVoteStore(
    useShallow(voteSelectors.voteActions),
  );

  const [inputMode, setInputMode] = React.useState<InputMode>('default');
  const [uploadedImages, setUploadedImages] = React.useState<UploadedImage[]>([]);
  const pendingFileIdsRef = React.useRef<Set<string>>(new Set());
  const prevInputModeRef = React.useRef<InputMode>(inputMode);

  const [currentUrlConversationId, setCurrentUrlConversationId] = React.useState<
    string | undefined
  >(conversationId);

  const comparisonWorkflowMap = React.useRef<Map<string, string>>(new Map());
  const hasResetForNewChatRef = React.useRef(false);
  const prevPathnameRef = React.useRef<string>(pathname);

  const handleConversationCreated = React.useCallback(
    (newConversationId: string, title: string) => {
      setConversationId(newConversationId);
      setCurrentUrlConversationId(newConversationId);
      setNewConversation({ id: newConversationId, title, updatedAt: new Date().toISOString() });
      setConversationLoaded(true);
      // Invalidate recent conversations to show new chat in sidebar
      void queryClient.invalidateQueries({ queryKey: conversationsKeys.all });
    },
    [setConversationId, setNewConversation, queryClient],
  );

  const persistenceCallbacks = React.useMemo<WorkflowPersistenceCallbacks>(
    () => ({
      onCreateConversation: async (title: string) => {
        const conversation = await createConversation(title);
        return conversation?.id ?? null;
      },
      onSaveUserMessage: async (
        convId: string,
        content: string,
        attachments?: MessageAttachmentForSave[],
      ) => {
        const message = await saveMessage(convId, 'user', content, attachments);
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
        explicitAttachments?: ResponseAttachmentForSave[],
      ) => {
        // If explicit attachments are provided (e.g., video), use them directly
        // Otherwise, process response for base64 media
        let finalContent = responseContent;
        let finalAttachments = explicitAttachments;

        if (!explicitAttachments || explicitAttachments.length === 0) {
          const { processedContent, attachments } = await processAiResponseMedia(responseContent);
          finalContent = processedContent;
          finalAttachments = attachments.length > 0 ? attachments : undefined;
        }

        let displayPosition = 0;
        for (const [comparisonId, wfId] of comparisonWorkflowMap.current.entries()) {
          if (wfId === workflowId) {
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
          finalContent,
          tokensUsed,
          responseTimeMs,
          displayPosition,
          finalAttachments,
        );
      },
      onConversationCreated: handleConversationCreated,
    }),
    [createConversation, saveMessage, saveModelResponse, handleConversationCreated, comparisons],
  );

  const {
    startAllSyncedWorkflows,
    cancelAllWorkflows,
    regenerateLastResponse,
    startAllSyncedVideoWorkflows,
  } = useWorkflowExecution(persistenceCallbacks);

  const [enabledModelsLoaded, setEnabledModelsLoaded] = React.useState(false);
  const [maximizedContent, setMaximizedContent] = React.useState<string | null>(null);
  const [conversationLoaded, setConversationLoaded] = React.useState(false);
  const [conversationError, setConversationError] = React.useState<string | null>(null);
  const [voteLoadingComplete, setVoteLoadingComplete] = React.useState(false);

  const [votingContext, setVotingContext] = React.useState<{
    messageId: string;
    modelResponses: Array<{ id: string; modelName: string; providerName: string }>;
  } | null>(null);

  React.useEffect(() => {
    if (!apiKeysLoaded) {
      loadApiKeys();
    }
  }, [apiKeysLoaded, loadApiKeys]);

  // Track uploaded file IDs for cleanup
  React.useEffect(() => {
    for (const img of uploadedImages) {
      if (img.fileId && !img.uploadError) {
        pendingFileIdsRef.current.add(img.fileId);
      }
    }
  }, [uploadedImages]);

  // Cleanup orphaned files on unmount
  React.useEffect(() => {
    return () => {
      const fileIdsToCleanup = Array.from(pendingFileIdsRef.current);
      if (fileIdsToCleanup.length > 0) {
        navigator.sendBeacon('/api/files/cleanup', JSON.stringify({ fileIds: fileIdsToCleanup }));
      }
    };
  }, []);

  React.useEffect(() => {
    if (conversationId !== currentUrlConversationId) {
      setCurrentUrlConversationId(conversationId);

      if (isCreatingConversation) {
        setIsCreatingConversation(false);
        return;
      }

      if (!conversationId) {
        resetConversation();
        comparisonWorkflowMap.current.clear();
        // Reset the guard so resetComparisons can be called for this new navigation
        hasResetForNewChatRef.current = false;
        // Trigger model refresh - resetComparisons will be called by a separate effect
        // after models are loaded to avoid race conditions
        setModelsLastLoadedAt(null);
        setConversationLoaded(false);
        setConversationError(null);
        setVoteLoadingComplete(false);
      } else if (conversationId !== storedConversationId) {
        // Reset guard when navigating to an existing conversation
        hasResetForNewChatRef.current = false;
        comparisonWorkflowMap.current.clear();
        setConversationLoaded(false);
        setConversationError(null);
        setVoteLoadingComplete(false);
      }
    }
  }, [
    conversationId,
    currentUrlConversationId,
    storedConversationId,
    isCreatingConversation,
    resetConversation,
    setIsCreatingConversation,
    setModelsLastLoadedAt,
  ]);

  React.useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    const isNewChatPath = pathname === '/arena' || pathname === '/arena/';
    const wasOnConversation = prevPathname.startsWith('/arena/') && prevPathname !== '/arena/';

    if (isNewChatPath && wasOnConversation && storedConversationId) {
      resetConversation();
      comparisonWorkflowMap.current.clear();
      hasResetForNewChatRef.current = false;
      setModelsLastLoadedAt(null);
      setConversationLoaded(false);
      setConversationError(null);
      setVoteLoadingComplete(false);
    }
  }, [pathname, storedConversationId, resetConversation, setModelsLastLoadedAt]);

  // Reset comparisons after models are loaded when navigating to new chat
  // This ensures we use the freshly loaded models to select defaults
  React.useEffect(() => {
    if (
      !conversationId &&
      availableModels.length > 0 &&
      enabledModelsLoaded &&
      !hasResetForNewChatRef.current
    ) {
      hasResetForNewChatRef.current = true;
      resetComparisons(availableModels);
    }
  }, [conversationId, availableModels, enabledModelsLoaded, resetComparisons]);

  React.useEffect(() => {
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

  // Track enabled provider IDs to detect changes
  const enabledProviderIdsRef = React.useRef<string>('');

  React.useEffect(() => {
    const fetchEnabledModels = async () => {
      if (!apiKeysLoaded) return;

      const needsRefresh =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('arena_models_need_refresh') === 'true';

      // Compute current enabled provider IDs
      const currentEnabledIds = savedApiKeys
        .filter((k) => k.enabled && k.id)
        .map((k) => k.id)
        .sort()
        .join(',');

      // Check if enabled providers changed
      const enabledProvidersChanged = currentEnabledIds !== enabledProviderIdsRef.current;

      if (modelsLastLoadedAt && !needsRefresh && !enabledProvidersChanged) {
        setEnabledModelsLoaded(true);
        return;
      }

      // Update the ref to track current enabled providers
      enabledProviderIdsRef.current = currentEnabledIds;

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

        // Only update maps after successful API calls
        setEnabledModelsMap(newEnabledModelsMap);
        setCustomModelsMap(newCustomModelsMap);
        setModelOverridesMap(newModelOverridesMap);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }

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
      // For custom providers, use providerType (e.g., "openai") instead of providerName (e.g., "yzc")
      // This ensures custom providers match against the correct provider metadata
      const configuredProviderIds = savedApiKeys
        .filter((k) => k.enabled)
        .map((k) => {
          if (k.isCustom && k.providerType) {
            return k.providerType.toLowerCase();
          }
          return k.providerName.toLowerCase();
        });
      const filtered = providerMetadata.filter((p) =>
        configuredProviderIds.includes(p.id.toLowerCase()),
      );
      // Fallback to all providers if no configured providers match
      // This can happen with custom/unknown provider names
      if (filtered.length === 0) {
        return providerMetadata;
      }
      return filtered;
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
            const override = providerOverrides?.get(model.id);
            const displayName = override?.displayName || model.displayName || model.id;
            const inputPrice = override?.inputPrice ?? model.pricing?.input;
            const outputPrice = override?.outputPrice ?? model.pricing?.output;

            const abilities = {
              ...model.abilities,
              ...override?.abilities,
            };

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
              abilities,
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
    if (computedModels.length > 0 && enabledModelsLoaded && !initialized) {
      initializeComparisons(computedModels);
    }
  }, [computedModels, enabledModelsLoaded, initialized, initializeComparisons]);

  const displayModels = availableModels.length > 0 ? availableModels : computedModels;

  const filteredDisplayModels = React.useMemo(() => {
    if (inputMode === 'default') {
      return displayModels;
    }

    const abilityKey = INPUT_MODE_ABILITY_MAP[inputMode as keyof typeof INPUT_MODE_ABILITY_MAP];
    if (!abilityKey) {
      return displayModels;
    }

    return displayModels.filter((model) => model.abilities?.[abilityKey] === true);
  }, [displayModels, inputMode]);

  const handleInputModeChange = React.useCallback((mode: InputMode) => {
    setInputMode(mode);
  }, []);

  const handleAddImages = React.useCallback((newImages: UploadedImage[]) => {
    setUploadedImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleUpdateImage = React.useCallback((id: string, updates: Partial<UploadedImage>) => {
    setUploadedImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  }, []);

  const handleRemoveImage = React.useCallback(
    async (id: string, forceRemove = false) => {
      const image = uploadedImages.find((img) => img.id === id);
      if (!image) return;

      if (image.fileId && !forceRemove) {
        const { deleteFileWithRetry } = await import('@/libs/file-upload-api');
        const result = await deleteFileWithRetry(image.fileId);

        if (!result.success) {
          console.error('Failed to delete image from storage:', result.error);
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === id
                ? {
                    ...img,
                    deleteError: result.error,
                    deleteRetryCount: (img.deleteRetryCount ?? 0) + 1,
                  }
                : img,
            ),
          );
          toast.error(t('Arena.image_delete_failed'), {
            description: t('Arena.image_delete_retry_option'),
            action: {
              label: t('Arena.force_remove'),
              onClick: () => handleRemoveImage(id, true),
            },
          });
          return;
        }
      }

      URL.revokeObjectURL(image.previewUrl);
      setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    },
    [uploadedImages, t],
  );

  const handleClearImages = React.useCallback(() => {
    for (const img of uploadedImages) {
      URL.revokeObjectURL(img.previewUrl);
      // Clear from pending since this is a successful submission
      if (img.fileId) {
        pendingFileIdsRef.current.delete(img.fileId);
      }
    }
    setUploadedImages([]);
  }, [uploadedImages]);

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
    let didCancel = false;

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

        if (didCancel) return;

        if (!data) {
          setConversationError('Conversation not found');
          return;
        }

        const modelKeyMap = new Map<string, { modelId: string; keyId: string }>();

        for (const message of data.messages) {
          if (message.responses) {
            for (const response of message.responses) {
              const fullModelId = `${response.providerName}:${response.modelName}`;
              const fullModelKey = `${fullModelId}:${response.displayPosition ?? 0}`;
              if (!modelKeyMap.has(fullModelKey)) {
                const keyId = getKeyIdForModel(fullModelId) || '';
                modelKeyMap.set(fullModelKey, { modelId: fullModelId, keyId });
              }
            }
          }
        }

        if (didCancel) return;

        loadConversationHistory(data as LoadedConversation, modelKeyMap);
        setConversationLoaded(true);
      } catch (error) {
        if (didCancel) return;
        console.error('Failed to load conversation:', error);
        setConversationError('Failed to load conversation');
      }
    };

    loadConversationData();

    return () => {
      didCancel = true;
    };
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
    if (filteredDisplayModels.length === 0) {
      return;
    }

    const prevMode = prevInputModeRef.current;
    const isReturningToDefault = prevMode !== 'default' && inputMode === 'default';

    const validModelIds: string[] = [];
    const indicesToReplace: number[] = [];

    comparisons.forEach((comparison, index) => {
      const isModelInFilteredList = filteredDisplayModels.some(
        (model) => model.id === comparison.modelId,
      );

      const workflow = getWorkflowForComparison(comparison.id);
      const isWorkflowRunning = workflow?.status === 'running';

      if (isWorkflowRunning) {
        validModelIds.push(comparison.modelId);
      } else if (!isModelInFilteredList || isReturningToDefault) {
        indicesToReplace.push(index);
      } else {
        validModelIds.push(comparison.modelId);
      }
    });

    if (indicesToReplace.length > 0) {
      const replacementModels = selectUniqueRandomModels(
        filteredDisplayModels,
        indicesToReplace.length,
        validModelIds,
      );

      indicesToReplace.forEach((index, i) => {
        const modelId = replacementModels[i] || filteredDisplayModels[0]?.id || '';
        selectModel(index, modelId);
      });
    }

    prevInputModeRef.current = inputMode;
  }, [inputMode, filteredDisplayModels, comparisons, selectModel, getWorkflowForComparison]);

  React.useEffect(() => {
    if (!conversationId || !storedConversationId || storedConversationId !== conversationId) {
      return;
    }
    if (!conversationLoaded || workflows.size === 0) {
      return;
    }

    const orderedWorkflows =
      workflowOrder.length > 0
        ? workflowOrder
            .map((id) => {
              const workflow = workflows.get(id);
              return workflow ? ([id, workflow] as const) : null;
            })
            .filter((entry): entry is [string, ArenaWorkflow] => entry !== null)
        : Array.from(workflows.entries());

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
      toast.warning(t('Arena.configure_api_keys_title'), {
        description: t('Arena.configure_api_keys_description'),
        action: {
          label: t('Arena.go_to_settings'),
          onClick: () => router.push('/settings?tab=provider'),
        },
      });
      return;
    }

    const syncedComparisons = comparisons.filter((comp) => comp.synced);

    const missingModelCards = syncedComparisons.filter((comp) => !comp.modelId);
    if (missingModelCards.length > 0) {
      toast.warning(t('Arena.select_model_for_all_cards_title'), {
        description: t('Arena.select_model_for_all_cards_description'),
      });
      return;
    }

    if (syncedComparisons.length === 0) {
      toast.warning(t('Arena.select_model_title'), {
        description: t('Arena.select_model_description'),
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
      toast.error(t('Arena.missing_api_key_title'), {
        description: t('Arena.missing_api_key_description', { providers: missingKeys.join(', ') }),
        action: {
          label: t('Arena.go_to_settings'),
          onClick: () => router.push('/settings?tab=provider'),
        },
      });
      return;
    }

    let attachments: WorkflowImageAttachment[] | undefined;
    let dbAttachments: MessageAttachmentForSave[] | undefined;
    if (uploadedImages.length > 0) {
      const stillUploading = uploadedImages.some((img) => img.isUploading);
      if (stillUploading) {
        toast.error(t('Arena.images_still_uploading'));
        return;
      }

      const failedUploads = uploadedImages.filter((img) => img.uploadError);
      if (failedUploads.length > 0) {
        toast.error(t('Arena.image_upload_failed'), {
          description: failedUploads.map((img) => img.filename).join(', '),
        });
        return;
      }

      attachments = uploadedImages
        .filter((img) => img.url)
        .map((img) => ({
          type: 'image' as const,
          data: img.url as string,
          mediaType: img.file.type,
          filename: img.filename,
        }));

      // Convert to DB attachment format for persistence
      dbAttachments = uploadedImages
        .filter((img) => img.fileId)
        .map((img) => ({
          type: 'image' as const,
          fileId: img.fileId as string,
          mimeType: img.file.type,
          filename: img.filename,
          sizeBytes: img.size,
        }));
    }

    setWorkflowGlobalPrompt('');
    handleClearImages();
    const currentInputMode = inputMode;
    setInputMode('default');

    if (currentInputMode === 'videoGenerate') {
      await startAllSyncedVideoWorkflows();
    } else {
      await startAllSyncedWorkflows(attachments, dbAttachments);
    }
    if (isNewConversationSubmit) {
      const convId = getWorkflowConversationId();
      const currentWindowPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const basePath = submitWindowPath.replace(/\/$/, '');
      const shouldUpdateUrl =
        !!convId &&
        currentWindowPath.replace(/\/$/, '') === basePath &&
        basePath.endsWith('/arena');
      if (shouldUpdateUrl) {
        window.history.replaceState(null, '', `${basePath}/${convId}`);
      }
    }
  }, [
    workflowGlobalPrompt,
    comparisons,
    storedConversationId,
    getWorkflowConversationId,
    getOrCreateWorkflow,
    startAllSyncedWorkflows,
    startAllSyncedVideoWorkflows,
    hasConfiguredProviders,
    router,
    t,
    setWorkflowGlobalPrompt,
    uploadedImages,
    handleClearImages,
    inputMode,
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

  const fetchVotingContext = React.useCallback(async () => {
    const effectiveConversationId = conversationId || storedConversationId;
    if (!effectiveConversationId) return null;

    try {
      const response = await fetch(`/api/conversations/${effectiveConversationId}/full`);
      if (!response.ok) return null;

      const data = (await response.json()) as {
        messages: Array<{
          id: string;
          role: string;
          responses?: Array<{ id: string; modelName: string; providerName: string }>;
        }>;
      };

      const userMessages = data.messages.filter((m) => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      if (!lastUserMessage) return null;

      const context = {
        messageId: lastUserMessage.id,
        modelResponses: lastUserMessage.responses || [],
      };

      setVotingContext(context);
      return context;
    } catch {
      return null;
    }
  }, [conversationId, storedConversationId]);

  const lastUserMessageId = React.useMemo(() => {
    for (const comparison of comparisons) {
      const workflow = getWorkflowForComparison(comparison.id);
      if (workflow?.messages?.length) {
        const userMessages = workflow.messages.filter((m) => m.role === 'user');
        const lastUserMsg = userMessages[userMessages.length - 1];
        if (lastUserMsg?.id) {
          return lastUserMsg.id;
        }
      }
    }
    return null;
  }, [comparisons, getWorkflowForComparison]);

  const modelResponses = React.useMemo(() => {
    const responses: Array<{
      id: string;
      modelName: string;
      providerName: string;
      comparisonId: string;
    }> = [];

    for (const comparison of comparisons) {
      const workflow = getWorkflowForComparison(comparison.id);
      if (workflow?.messages?.length) {
        const assistantMessages = workflow.messages.filter((m) => m.role === 'assistant');
        const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
        if (lastAssistantMsg?.id && comparison.modelId) {
          const [providerName, ...modelParts] = comparison.modelId.split(':');
          const modelName = modelParts.join(':');
          responses.push({
            id: lastAssistantMsg.id,
            modelName,
            providerName: providerName ?? '',
            comparisonId: comparison.id,
          });
        }
      }
    }

    return responses;
  }, [comparisons, getWorkflowForComparison]);

  const isVotingAvailable = React.useMemo(() => {
    const syncedComparisons = comparisons.filter((c) => c.synced);
    if (syncedComparisons.length < 2) return false;

    const allCompleted = syncedComparisons.every((comparison) => {
      const workflow = getWorkflowForComparison(comparison.id);
      return (
        workflow?.status === 'completed' && workflow?.messages?.some((m) => m.role === 'assistant')
      );
    });

    return allCompleted && !!lastUserMessageId;
  }, [comparisons, getWorkflowForComparison, lastUserMessageId]);

  const getVoteStateForComparison = React.useCallback(
    (comparisonId: string): 'none' | 'winner' | 'loser' | 'tie' | 'all_bad' => {
      const dbMessageId = votingContext?.messageId;
      if (!dbMessageId) return 'none';

      const vote = getVote(dbMessageId);
      if (!vote) return 'none';

      const comparison = comparisons.find((c) => c.id === comparisonId);
      if (!comparison?.modelId) return 'none';

      const [providerName, ...modelParts] = comparison.modelId.split(':');
      const modelName = modelParts.join(':');

      const result = vote.results.find(
        (r) => r.modelName === modelName && r.providerName === providerName,
      );
      if (!result) return 'none';

      return result.outcome as 'winner' | 'loser' | 'tie' | 'all_bad';
    },
    [votingContext, getVote, comparisons],
  );

  const getHoverStateForComparison = React.useCallback(
    (comparisonId: string): 'winner' | 'loser' | 'tie' | 'all_bad' | null => {
      const dbMessageId = votingContext?.messageId;
      if (!dbMessageId || !hoveredVote || hoveredVote.messageId !== dbMessageId) {
        return null;
      }

      if (getVote(dbMessageId)) {
        return null;
      }

      const modelResponse = modelResponses.find((r) => r.comparisonId === comparisonId);
      if (!modelResponse) return null;

      const participantIds = modelResponses.map((r) => r.id);
      if (!participantIds.includes(modelResponse.id)) return null;

      if (hoveredVote.voteType === 'winner') {
        return modelResponse.id === hoveredVote.winnerId ? 'winner' : 'loser';
      }

      return hoveredVote.voteType;
    },
    [hoveredVote, modelResponses, votingContext, getVote],
  );

  const handleVoteCardClick = React.useCallback(
    async (comparisonId: string) => {
      if (!isVotingAvailable || isVoteSubmitting) return;

      let context = votingContext;
      if (!context) {
        context = await fetchVotingContext();
        if (!context) {
          toast.error(t('Arena.vote_failed'));
          return;
        }
      }

      const existingVote = getVote(context.messageId);
      if (existingVote) return;

      const comparison = comparisons.find((c) => c.id === comparisonId);
      if (!comparison?.modelId) return;

      const [providerName, ...modelParts] = comparison.modelId.split(':');
      const modelName = modelParts.join(':');

      const dbResponse = context.modelResponses.find(
        (r) => r.modelName === modelName && r.providerName === providerName,
      );
      if (!dbResponse) return;

      const participantIds = context.modelResponses.map((r) => r.id);
      const comparisonType: ComparisonType = 'text';

      const result = await submitVote({
        messageId: context.messageId,
        voteType: 'winner',
        winnerId: dbResponse.id,
        comparisonType,
        participantIds,
      });

      if (result) {
        toast.success(t('Arena.vote_success'));
      } else {
        toast.error(t('Arena.vote_failed'));
      }
    },
    [
      isVotingAvailable,
      isVoteSubmitting,
      votingContext,
      fetchVotingContext,
      getVote,
      comparisons,
      submitVote,
      t,
    ],
  );

  const handleVoteCardHover = React.useCallback(
    (comparisonId: string) => {
      if (!lastUserMessageId || !isVotingAvailable || isVoteSubmitting) return;

      const dbMessageId = votingContext?.messageId;
      if (dbMessageId && getVote(dbMessageId)) return;

      const modelResponse = modelResponses.find((r) => r.comparisonId === comparisonId);
      if (!modelResponse) return;

      setHoveredVote({
        messageId: lastUserMessageId,
        voteType: 'winner',
        winnerId: modelResponse.id,
      });
    },
    [
      lastUserMessageId,
      isVotingAvailable,
      isVoteSubmitting,
      votingContext,
      getVote,
      modelResponses,
      setHoveredVote,
    ],
  );

  const handleVoteCardHoverLeave = React.useCallback(() => {
    setHoveredVote(null);
  }, [setHoveredVote]);

  React.useEffect(() => {
    if (!conversationId) {
      clearAllVotes();
      setVotingContext(null);
    }
  }, [conversationId, clearAllVotes]);

  React.useEffect(() => {
    const loadVotes = async () => {
      if (!conversationId) {
        if (isVotingAvailable && storedConversationId) {
          await fetchVotingContext();
        }
        setVoteLoadingComplete(true);
        return;
      }

      if (!conversationLoaded && !isVotingAvailable) return;

      const context = await fetchVotingContext();
      if (context) {
        await loadVoteForMessage(context.messageId);
      }
      setVoteLoadingComplete(true);
    };

    loadVotes();
  }, [
    conversationId,
    conversationLoaded,
    isVotingAvailable,
    storedConversationId,
    fetchVotingContext,
    loadVoteForMessage,
  ]);

  React.useEffect(() => {
    return () => {
      cancelAllWorkflows();
    };
  }, [cancelAllWorkflows]);

  React.useEffect(() => {
    const isLoadingConv =
      conversationId &&
      !conversationLoaded &&
      storedConversationId !== conversationId &&
      !isCreatingConversation;
    const isLoadingVts = conversationId && conversationLoaded && !voteLoadingComplete;
    const isReady = initialized && enabledModelsLoaded && !isLoadingConv && !isLoadingVts;
    setMainContentReady(isReady);
  }, [
    initialized,
    enabledModelsLoaded,
    conversationId,
    conversationLoaded,
    storedConversationId,
    isCreatingConversation,
    voteLoadingComplete,
    setMainContentReady,
  ]);

  React.useEffect(() => {
    return () => {
      setMainContentReady(false);
    };
  }, [setMainContentReady]);

  const getCardStyles = React.useCallback((cardCount: number): React.CSSProperties => {
    if (cardCount === 1) {
      return {
        width: '80%',
        minWidth: `${CARD_MIN_WIDTH}px`,
        flexShrink: 0,
      };
    }

    return {
      flex: '1 1 0%',
      minWidth: `${CARD_MIN_WIDTH}px`,
      width: 'auto',
    };
  }, []);

  const handleStartNewConversation = React.useCallback(() => {
    resetConversation();
    setModelsLastLoadedAt(null);
    router.push('/arena');
  }, [resetConversation, setModelsLastLoadedAt, router]);

  if (conversationError) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive">{conversationError}</div>
          <Button onClick={handleStartNewConversation}>Start New Conversation</Button>
        </div>
      </div>
    );
  }

  const isLoadingConversation =
    conversationId &&
    !conversationLoaded &&
    storedConversationId !== conversationId &&
    !isCreatingConversation;

  const isLoadingVotes = conversationId && conversationLoaded && !voteLoadingComplete;

  if (!initialized || !enabledModelsLoaded || isLoadingConversation || isLoadingVotes) {
    return <InitialArenaViewSkeleton />;
  }

  // Determine if a conversation has started by checking if there are workflows with messages
  const hasConversationStarted =
    storedConversationId !== null ||
    Array.from(workflows.values()).some((wf) => wf.messages && wf.messages.length > 0);

  if (!hasConversationStarted) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <InitialArenaView
          comparisons={comparisons}
          availableModels={filteredDisplayModels}
          globalPrompt={workflowGlobalPrompt}
          isLoading={isAnyRunning}
          uploadedImages={uploadedImages}
          onPromptChange={setWorkflowGlobalPrompt}
          onSubmit={handleSubmit}
          onStop={cancelAllWorkflows}
          onModelSelect={handleModelSelect}
          onAddComparison={addComparison}
          onRemoveComparison={handleDelete}
          onAddImages={handleAddImages}
          onUpdateImage={handleUpdateImage}
          onRemoveImage={handleRemoveImage}
          onModeChange={handleInputModeChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar p-4">
          <div
            className={cn('h-full flex gap-4', comparisons.length === 1 && 'justify-center')}
            style={comparisons.length >= 3 ? { minWidth: 'fit-content' } : undefined}
          >
            {comparisons.map((comparison, index) => {
              const workflow = getWorkflowForComparison(comparison.id);
              const lastAssistantMessage = workflow?.messages
                .filter((m) => m.role === 'assistant')
                .pop();
              const response =
                workflow?.pendingResponse?.content || lastAssistantMessage?.content || '';
              const isLoading = workflow?.status === 'running';

              const voteState = getVoteStateForComparison(comparison.id);
              const hoverState = getHoverStateForComparison(comparison.id);
              const hasVoted = voteState !== 'none';
              const isVotable = isVotingAvailable && !hasVoted && comparison.synced;

              return (
                <motion.div
                  key={comparison.id}
                  layout
                  className="h-full"
                  style={getCardStyles(comparisons.length)}
                >
                  <ModelCard
                    modelId={workflow?.modelId || comparison.modelId}
                    models={filteredDisplayModels}
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
                    voteState={voteState}
                    hoverState={hoverState}
                    isVotable={isVotable}
                    isVoteSubmitting={isVoteSubmitting}
                    onVoteClick={() => handleVoteCardClick(comparison.id)}
                    onVoteHover={() => handleVoteCardHover(comparison.id)}
                    onVoteHoverLeave={handleVoteCardHoverLeave}
                    onModelSelect={(modelId) => handleModelSelect(index, modelId)}
                    onSyncToggle={(synced) => handleSyncToggle(index, synced)}
                    onConfigChange={(config) => handleConfigChange(index, config)}
                    onCustomPromptChange={(prompt) => handleCustomPromptChange(index, prompt)}
                    onClear={() => handleClear(index)}
                    onDelete={() => handleDelete(index)}
                    onMoveLeft={() => moveLeft(index)}
                    onMoveRight={() => moveRight(index)}
                    onAddCard={
                      index === comparisons.length - 1 && comparisons.length < MAX_COMPARISON_CARDS
                        ? addComparison
                        : undefined
                    }
                    onRetry={(messageId) => handleRetry(comparison.id, messageId)}
                    onMaximize={handleMaximize}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="px-4 pt-1 pb-4 space-y-2">
          <VoteBar
            messageId={votingContext?.messageId ?? ''}
            modelResponses={votingContext?.modelResponses ?? []}
            comparisonType="text"
            disabled={
              !isVotingAvailable ||
              !votingContext ||
              (votingContext?.modelResponses?.length ?? 0) < 2
            }
          />
          <PromptInput
            value={workflowGlobalPrompt}
            onChange={setWorkflowGlobalPrompt}
            onSubmit={handleSubmit}
            onStop={cancelAllWorkflows}
            isLoading={isAnyRunning}
            uploadedImages={uploadedImages}
            onAddImages={handleAddImages}
            onUpdateImage={handleUpdateImage}
            onRemoveImage={handleRemoveImage}
            onModeChange={handleInputModeChange}
            className="border-input"
          >
            <ImagePreviews />
            <PromptInputTextarea placeholder={t('Arena.prompt_placeholder')} />
            <PromptInputFooter>
              <PromptInputActions>
                <PromptInputFeatureButtons />
                <ModeChip />
              </PromptInputActions>
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
          <ScrollArea key="maximized-scroll" className="flex-1">
            <div className="max-w-4xl mx-auto p-8 pb-20">
              <ResponseViewer content={maximizedContent} isStreaming={false} />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
