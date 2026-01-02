import type { AiModelType, DefaultModelListItem, ModelAbilities } from '@lmring/model-depot';
import { getEndpointConfig, getModelsForProvider, resolveProviderType } from '@lmring/model-depot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lmring/ui';
import {
  AlertCircleIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  Loader2Icon,
  LockIcon,
  MessageSquareIcon,
  MicIcon,
  PencilIcon,
  RadioIcon,
  SearchIcon,
  Trash2Icon,
  VolumeIcon,
  WrenchIcon,
  ZapIcon,
} from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AddModelDialog } from './AddModelDialog';
import { EditModelDialog } from './EditModelDialog';
import type { ConnectionCheckResponse, Provider, SaveApiKeyResponse } from './types';

// Model override type from database
interface ModelOverrideData {
  modelId: string;
  displayName?: string | null;
  groupName?: string | null;
  abilities?: Record<string, boolean> | null;
  supportsStreaming?: boolean | null;
  priceCurrency?: string | null;
  inputPrice?: number | null;
  outputPrice?: number | null;
}

const MODEL_TYPE_CONFIG: Record<
  AiModelType,
  { label: string; icon: React.ElementType; color: string }
> = {
  chat: { label: 'Chat', icon: MessageSquareIcon, color: 'text-blue-500' },
  embedding: { label: 'Embedding', icon: ZapIcon, color: 'text-purple-500' },
  image: { label: 'Image', icon: ImageIcon, color: 'text-green-500' },
  tts: { label: 'TTS', icon: VolumeIcon, color: 'text-orange-500' },
  stt: { label: 'STT', icon: MicIcon, color: 'text-pink-500' },
  realtime: { label: 'Realtime', icon: RadioIcon, color: 'text-red-500' },
};

interface ProviderDetailProps {
  provider: Provider;
  onToggle: (id: string, enabled: boolean, apiKeyId?: string) => void;
  onSave?: (providerId: string, apiKeyId: string) => void;
  onDelete?: (providerId: string) => void;
}

type CheckStatus = 'idle' | 'checking' | 'success' | 'error';

export function ProviderDetail({ provider, onToggle, onSave, onDelete }: ProviderDetailProps) {
  const t = useTranslations();
  const [apiKey, setApiKey] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle');
  const [checkError, setCheckError] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [isFetchingKey, setIsFetchingKey] = useState(false);
  const [fetchedApiKey, setFetchedApiKey] = useState<string | null>(null);

  const [modelEnabledStates, setModelEnabledStates] = useState<Record<string, boolean>>({});
  const [customModels, setCustomModels] = useState<DefaultModelListItem[]>([]);
  const [modelOverrides, setModelOverrides] = useState<Map<string, ModelOverrideData>>(new Map());
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<{
    id: string;
    displayName?: string;
    abilities?: ModelAbilities;
    supportsStreaming?: boolean;
    pricing?: { currency?: string; input?: number; output?: number };
    isCustomModel: boolean;
  } | null>(null);
  const [connectivityCheckOpen, setConnectivityCheckOpen] = useState(false);

  const hasExistingApiKey = Boolean(provider.hasApiKey);

  // biome-ignore lint/correctness/useExhaustiveDependencies: provider.id is intentionally included to reset form when provider changes
  useEffect(() => {
    if (provider.apiKey) {
      setApiKey(provider.apiKey);
    } else if (provider.apiKeyId) {
      setApiKey('');
    } else {
      setApiKey('');
    }
    if (provider.proxyUrl) {
      setProxyUrl(provider.proxyUrl);
    } else {
      setProxyUrl('');
    }
    setCheckStatus('idle');
    setCheckError('');
    setResponseTime(null);
    setFetchedApiKey(null);
    setShowKey(false);
  }, [provider.id, provider.apiKey, provider.proxyUrl, provider.apiKeyId]);

  useEffect(() => {
    const fetchModelStates = async () => {
      if (!provider.apiKeyId) {
        setModelEnabledStates({});
        return;
      }

      try {
        // Use dedicated enabled-models endpoint that returns raw database records
        // This ensures model IDs match exactly what was saved, regardless of provider API differences
        const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}/enabled-models`);
        if (response.ok) {
          const data = await response.json();
          const statesMap: Record<string, boolean> = {};
          for (const model of data.models || []) {
            statesMap[model.modelId] = model.enabled;
          }
          setModelEnabledStates(statesMap);
        }
      } catch (error) {
        console.error('Failed to fetch model states:', error);
      }
    };

    fetchModelStates();
  }, [provider.apiKeyId]);

  useEffect(() => {
    const fetchCustomModels = async () => {
      if (!provider.apiKeyId) {
        setCustomModels([]);
        return;
      }

      try {
        const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}/custom-models`);
        if (response.ok) {
          const data = await response.json();
          const models = (data.models || []).map(
            (m: { modelId: string; displayName?: string }) => ({
              id: m.modelId,
              displayName: m.displayName || m.modelId,
              type: 'chat' as const,
              abilities: {},
              providerId: provider.id.toLowerCase(),
              source: 'custom' as const,
            }),
          );
          setCustomModels(models);
        }
      } catch (error) {
        console.error('Failed to fetch custom models:', error);
      }
    };

    fetchCustomModels();
  }, [provider.apiKeyId, provider.id]);

  // Fetch model overrides
  useEffect(() => {
    const fetchModelOverrides = async () => {
      if (!provider.apiKeyId) {
        setModelOverrides(new Map());
        return;
      }

      try {
        const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}/model-overrides`);
        if (response.ok) {
          const data = await response.json();
          const overridesMap = new Map<string, ModelOverrideData>();
          for (const override of data.overrides || []) {
            overridesMap.set(override.modelId, override);
          }
          setModelOverrides(overridesMap);
        }
      } catch (error) {
        console.error('Failed to fetch model overrides:', error);
      }
    };

    fetchModelOverrides();
  }, [provider.apiKeyId]);

  const models = useMemo(() => {
    const staticModels = getModelsForProvider(resolveProviderType(provider));
    const staticIds = new Set(staticModels.map((m) => m.id));

    // Apply overrides to static models
    const modelsWithOverrides = staticModels.map((model) => {
      const override = modelOverrides.get(model.id);
      if (override) {
        return {
          ...model,
          displayName: override.displayName || model.displayName,
          abilities: override.abilities
            ? ({ ...model.abilities, ...override.abilities } as ModelAbilities)
            : model.abilities,
          pricing:
            override.inputPrice != null || override.outputPrice != null
              ? {
                  ...model.pricing,
                  currency: (override.priceCurrency as 'USD' | 'CNY') || model.pricing?.currency,
                  input: override.inputPrice ?? model.pricing?.input,
                  output: override.outputPrice ?? model.pricing?.output,
                }
              : model.pricing,
        };
      }
      return model;
    });

    const dbCustomModels = Object.keys(modelEnabledStates)
      .filter((id) => !staticIds.has(id))
      .map((id) => ({
        id,
        displayName: id,
        type: 'chat' as const,
        abilities: {},
      }));

    const mergedCustomModelsMap = new Map();

    for (const model of dbCustomModels) {
      mergedCustomModelsMap.set(model.id, model);
    }

    for (const model of customModels) {
      mergedCustomModelsMap.set(model.id, {
        ...model,
      });
    }

    return [...modelsWithOverrides, ...mergedCustomModelsMap.values()] as typeof staticModels;
  }, [provider, modelEnabledStates, customModels, modelOverrides]);

  const filteredModels = useMemo(() => {
    if (!searchQuery) return models;
    return models.filter(
      (model) =>
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [models, searchQuery]);

  const modelsByType = useMemo(() => {
    const grouped: Partial<Record<AiModelType, typeof filteredModels>> = {};
    for (const model of filteredModels) {
      const type = model.type || 'chat';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(model);
    }
    return grouped;
  }, [filteredModels]);

  const sortedModelTypes = useMemo(() => {
    const typeOrder: AiModelType[] = ['chat', 'image', 'embedding', 'tts', 'stt', 'realtime'];
    return typeOrder.filter((type) => modelsByType[type] && modelsByType[type].length > 0);
  }, [modelsByType]);

  const defaultUrl = useMemo(() => {
    const endpoint = getEndpointConfig(resolveProviderType(provider));
    return endpoint?.baseURL || '';
  }, [provider]);

  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: provider.id.toLowerCase(),
          apiKey: apiKey.trim(),
          proxyUrl: proxyUrl.trim() || undefined,
          enabled: provider.connected,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save API key');
      }

      const result: SaveApiKeyResponse = await response.json();

      onSave?.(provider.id, result.id);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('arena_models_need_refresh', 'true');
      }

      toast.success('Saved', {
        description: 'API key configuration saved successfully',
      });
    } catch (error) {
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save configuration',
      });
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, proxyUrl, provider.id, provider.connected, onSave]);

  const handleCheck = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('API Key Required', {
        description: 'Please enter your API key before testing the connection.',
      });
      return;
    }

    if (!selectedModel) {
      toast.error('Model Required', {
        description: 'Please select a model to test the connection.',
      });
      return;
    }

    setCheckStatus('checking');
    setCheckError('');
    setResponseTime(null);

    try {
      const response = await fetch('/api/settings/api-keys/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: provider.id.toLowerCase(),
          providerType: provider.providerType,
          apiKey: apiKey.trim(),
          proxyUrl: proxyUrl.trim() || undefined,
          model: selectedModel,
        }),
      });

      const result: ConnectionCheckResponse = await response.json();

      if (result.success) {
        setCheckStatus('success');
        setResponseTime(result.responseTimeMs ?? null);
        toast.success('Connection Successful', {
          description: `Connected in ${result.responseTimeMs}ms`,
        });

        await handleSave();
      } else {
        setCheckStatus('error');
        setCheckError(result.message || 'Connection failed');
        toast.error('Connection Failed', {
          description: result.message || 'Unable to connect to the provider',
        });
      }
    } catch (error) {
      setCheckStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setCheckError(errorMessage);
      toast.error('Connection Error', {
        description: errorMessage,
      });
    }
  }, [apiKey, proxyUrl, selectedModel, provider.id, provider.providerType, handleSave]);

  const handleToggle = useCallback(async () => {
    const newEnabled = !provider.connected;

    if (newEnabled && !apiKey.trim() && !provider.apiKeyId) {
      onToggle(provider.id, newEnabled);
      return;
    }

    setIsToggling(true);
    try {
      if (provider.apiKeyId) {
        const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: newEnabled }),
        });

        if (!response.ok) {
          throw new Error('Failed to update provider status');
        }

        onToggle(provider.id, newEnabled, provider.apiKeyId);
      } else if (apiKey.trim()) {
        const response = await fetch('/api/settings/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerName: provider.id.toLowerCase(),
            apiKey: apiKey.trim(),
            proxyUrl: proxyUrl.trim() || undefined,
            enabled: newEnabled,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save provider configuration');
        }

        const result: SaveApiKeyResponse = await response.json();
        onToggle(provider.id, newEnabled, result.id);
        onSave?.(provider.id, result.id);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arena_models_need_refresh', 'true');
        }
      } else {
        onToggle(provider.id, newEnabled);
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update status',
      });
    } finally {
      setIsToggling(false);
    }
  }, [provider.id, provider.connected, provider.apiKeyId, apiKey, proxyUrl, onToggle, onSave]);

  const handleModelToggle = useCallback(
    async (modelId: string, enabled: boolean) => {
      // If trying to enable a model but no API key is configured or entered, show warning
      if (enabled && !provider.hasApiKey && !apiKey.trim()) {
        setShowApiKeyWarning(true);
        return;
      }

      setModelEnabledStates((prev) => ({ ...prev, [modelId]: enabled }));

      if (provider.apiKeyId) {
        try {
          await fetch(`/api/settings/api-keys/${provider.apiKeyId}/models`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              models: [{ modelId, enabled }],
            }),
          });

          if (typeof window !== 'undefined') {
            sessionStorage.setItem('arena_models_need_refresh', 'true');
          }
        } catch {
          setModelEnabledStates((prev) => ({ ...prev, [modelId]: !enabled }));
          toast.error('Error', {
            description: 'Failed to update model status',
          });
        }
      }
    },
    [provider.apiKeyId, provider.hasApiKey, apiKey],
  );

  const handleAddModel = useCallback(
    async (model: { id: string; name: string }) => {
      if (!provider.apiKeyId) {
        toast.error('Please save your API key first');
        return;
      }

      try {
        const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}/custom-models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: model.id,
            displayName: model.name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to add model');
        }

        setCustomModels((prev) => [
          ...prev,
          {
            id: model.id,
            displayName: model.name,
            type: 'chat' as const,
            abilities: {},
            providerId: provider.id.toLowerCase(),
            source: 'custom' as const,
          },
        ]);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arena_models_need_refresh', 'true');
        }

        toast.success('Model Added');
      } catch (error) {
        toast.error('Failed to add model', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [provider.apiKeyId, provider.id],
  );

  const handleEditModel = useCallback(
    (model: DefaultModelListItem) => {
      const isCustom = customModels.some((cm) => cm.id === model.id);
      const override = modelOverrides.get(model.id);

      setModelToEdit({
        id: model.id,
        displayName: override?.displayName ?? model.displayName,
        abilities: (override?.abilities as ModelAbilities) || model.abilities,
        supportsStreaming: override?.supportsStreaming ?? undefined,
        pricing: {
          currency: override?.priceCurrency ?? model.pricing?.currency,
          input: override?.inputPrice ?? model.pricing?.input,
          output: override?.outputPrice ?? model.pricing?.output,
        },
        isCustomModel: isCustom,
      });
    },
    [customModels, modelOverrides],
  );

  const handleSaveModelEdit = useCallback(
    async (data: {
      displayName?: string;
      abilities?: ModelAbilities;
      supportsStreaming?: boolean;
      priceCurrency?: string;
      inputPrice?: number;
      outputPrice?: number;
    }) => {
      if (!provider.apiKeyId || !modelToEdit) return;

      const isCustomModel = modelToEdit.isCustomModel;
      const endpoint = isCustomModel
        ? `/api/settings/api-keys/${provider.apiKeyId}/custom-models/${encodeURIComponent(modelToEdit.id)}`
        : `/api/settings/api-keys/${provider.apiKeyId}/model-overrides`;

      const body = isCustomModel
        ? data
        : {
            modelId: modelToEdit.id,
            ...data,
          };

      try {
        const response = await fetch(endpoint, {
          method: isCustomModel ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save model');
        }

        await response.json();

        // Update local state
        if (isCustomModel) {
          setCustomModels((prev) =>
            prev.map((m) =>
              m.id === modelToEdit.id
                ? {
                    ...m,
                    displayName: data.displayName || m.displayName,
                    abilities: data.abilities || m.abilities,
                  }
                : m,
            ),
          );
        } else {
          setModelOverrides((prev) => {
            const newMap = new Map(prev);
            newMap.set(modelToEdit.id, {
              modelId: modelToEdit.id,
              displayName: data.displayName,
              abilities: data.abilities as Record<string, boolean>,
              supportsStreaming: data.supportsStreaming,
              priceCurrency: data.priceCurrency,
              inputPrice: data.inputPrice,
              outputPrice: data.outputPrice,
            });
            return newMap;
          });
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arena_models_need_refresh', 'true');
        }

        toast.success('Model updated successfully');
      } catch (error) {
        toast.error('Failed to update model', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [provider.apiKeyId, modelToEdit],
  );

  const handleDeleteCustomModel = useCallback(
    async (modelId: string) => {
      if (!provider.apiKeyId) return;

      try {
        const response = await fetch(
          `/api/settings/api-keys/${provider.apiKeyId}/custom-models/${encodeURIComponent(modelId)}`,
          { method: 'DELETE' },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete model');
        }

        setCustomModels((prev) => prev.filter((m) => m.id !== modelId));
        setModelEnabledStates((prev) => {
          const newState = { ...prev };
          delete newState[modelId];
          return newState;
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arena_models_need_refresh', 'true');
        }

        toast.success('Model Deleted');
      } catch (error) {
        toast.error('Failed to delete model', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [provider.apiKeyId],
  );

  const handleDeleteProvider = useCallback(async () => {
    if (!provider.apiKeyId || !provider.isCustom) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete provider');
      }

      toast.success('Provider Deleted', {
        description: `${provider.name} has been removed successfully`,
      });

      onDelete?.(provider.id);
    } catch (error) {
      toast.error('Delete Failed', {
        description: error instanceof Error ? error.message : 'Failed to delete provider',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [provider.apiKeyId, provider.isCustom, provider.name, provider.id, onDelete]);

  const handleShowKey = useCallback(async () => {
    if (showKey) {
      setShowKey(false);
      return;
    }

    if (fetchedApiKey) {
      setShowKey(true);
      return;
    }

    if (!provider.apiKeyId || !provider.hasApiKey) {
      setShowKey(true);
      return;
    }

    setIsFetchingKey(true);
    try {
      const response = await fetch(`/api/settings/api-keys/${provider.apiKeyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          setFetchedApiKey(data.apiKey);
          setApiKey(data.apiKey);
        }
        setShowKey(true);
      } else {
        toast.error('Failed to fetch API key');
      }
    } catch (error) {
      toast.error('Failed to fetch API key', {
        description: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsFetchingKey(false);
    }
  }, [showKey, fetchedApiKey, provider.apiKeyId, provider.hasApiKey]);

  const renderProviderIcon = (size = 20, className?: string) => {
    if (provider.Icon) {
      return (
        <provider.Icon
          size={size}
          className={cn(
            'text-foreground',
            !provider.connected && 'grayscale opacity-70',
            className,
          )}
        />
      );
    }
    return null;
  };

  const renderModelListIcon = (size = 20, className?: string) => {
    if (provider.Icon) {
      return <provider.Icon size={size} className={cn('text-foreground', className)} />;
    }
    return null;
  };

  const renderAbilityIcons = (abilities: ModelAbilities) => {
    const iconSize = 'h-3.5 w-3.5';
    return (
      <TooltipProvider>
        <div className="flex gap-2 items-center">
          {abilities.vision && (
            <Tooltip>
              <TooltipTrigger>
                <EyeIcon className={cn(iconSize, 'text-green-500')} />
              </TooltipTrigger>
              <TooltipContent>Vision</TooltipContent>
            </Tooltip>
          )}
          {abilities.imageOutput && (
            <Tooltip>
              <TooltipTrigger>
                <ImageIcon className={cn(iconSize, 'text-green-500')} />
              </TooltipTrigger>
              <TooltipContent>Image Generation</TooltipContent>
            </Tooltip>
          )}
          {abilities.reasoning && (
            <Tooltip>
              <TooltipTrigger>
                <BrainCircuitIcon className={cn(iconSize, 'text-purple-500')} />
              </TooltipTrigger>
              <TooltipContent>Reasoning / Deep Thinking</TooltipContent>
            </Tooltip>
          )}
          {abilities.search && (
            <Tooltip>
              <TooltipTrigger>
                <SearchIcon className={cn(iconSize, 'text-blue-500')} />
              </TooltipTrigger>
              <TooltipContent>Online Search</TooltipContent>
            </Tooltip>
          )}
          {abilities.functionCall && (
            <Tooltip>
              <TooltipTrigger>
                <WrenchIcon className={cn(iconSize, 'text-orange-500')} />
              </TooltipTrigger>
              <TooltipContent>Function Calls</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  };

  const renderCheckStatus = () => {
    if (checkStatus === 'success') {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2Icon className="h-4 w-4" />
          <span>Connected{responseTime ? ` in ${responseTime}ms` : ''}</span>
        </div>
      );
    }
    if (checkStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircleIcon className="h-4 w-4" />
          <span>{checkError || 'Connection failed'}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {renderProviderIcon(25)}
          <div>
            <h2 className="text-lg font-semibold">{provider.name}</h2>
            {provider.description && (
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider.isCustom && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          )}
          <Switch
            checked={provider.connected}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="api-key">{t('Provider.detail_api_key')}</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onPaste={(e) => {
                const input = e.currentTarget;
                setTimeout(() => {
                  if (input.value !== apiKey) {
                    setApiKey(input.value);
                  }
                }, 0);
              }}
              autoComplete="off"
              placeholder={
                hasExistingApiKey
                  ? t('Provider.detail_api_key_saved_placeholder')
                  : t('Provider.detail_api_key_placeholder')
              }
              className="pr-10 h-9"
            />
            <button
              type="button"
              onClick={handleShowKey}
              disabled={isFetchingKey}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isFetchingKey ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : showKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {hasExistingApiKey && !apiKey && (
            <p className="text-xs text-muted-foreground">{t('Provider.detail_api_key_stored_hint')}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="proxy-url">{t('Provider.detail_api_proxy_url')}</Label>
          <Input
            id="proxy-url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder={defaultUrl || 'https://api.example.com/v1'}
            className="h-9"
          />
        </div>

        <div className="space-y-3">
          <Label>{t('Provider.detail_connectivity_check')}</Label>
          <div className="flex gap-3 w-full items-start">
            <Popover open={connectivityCheckOpen} onOpenChange={setConnectivityCheckOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={connectivityCheckOpen}
                  className="flex-1 h-9 justify-between font-normal"
                >
                  {selectedModel ? (
                    <div className="flex items-center gap-2 truncate">
                      {renderModelListIcon(16)}
                      <span className="truncate">
                        {models.find((m) => m.id === selectedModel)?.displayName || selectedModel}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {t('Provider.detail_select_model_to_check')}
                    </span>
                  )}
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('Provider.detail_search_models')} />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No models found.</CommandEmpty>
                    <CommandGroup>
                      {models.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={`${model.displayName || model.id} ${model.id}`}
                          onSelect={() => {
                            setSelectedModel(model.id);
                            setConnectivityCheckOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {renderModelListIcon(16)}
                            <span className="truncate">{model.displayName || model.id}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              className="gap-2 h-9 min-w-[100px] transition-all hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-500"
              onClick={handleCheck}
              disabled={checkStatus === 'checking' || isSaving}
            >
              {checkStatus === 'checking' ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  {t('Provider.detail_checking')}
                </>
              ) : (
                t('Provider.detail_check')
              )}
            </Button>
          </div>

          {renderCheckStatus()}

          <div className="flex items-center justify-center gap-2 text-[0.8rem] text-muted-foreground pt-2">
            <LockIcon className="h-3 w-3" />
            <span>{t('Provider.detail_encryption_hint')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium leading-none">{t('Provider.detail_model_list')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('Provider.detail_models_available', {
                count: models.length,
                categories: sortedModelTypes.length,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Provider.detail_search_models_placeholder')}
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <AddModelDialog onAdd={handleAddModel} />
          </div>
        </div>

        {sortedModelTypes.length > 0 ? (
          <Tabs defaultValue={sortedModelTypes[0]} className="w-full">
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 flex-nowrap md:flex-wrap">
                {sortedModelTypes.map((type) => {
                  const config = MODEL_TYPE_CONFIG[type];
                  const TypeIcon = config.icon;
                  const typeModels = modelsByType[type] || [];
                  return (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="group w-auto flex-none rounded-full border border-transparent bg-transparent data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground hover:bg-muted/50 px-4 py-2 transition-all"
                    >
                      <TypeIcon className={cn('mr-2 h-4 w-4', config.color)} />
                      <span>{config.label}</span>
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 min-w-5 px-1 justify-center bg-muted text-muted-foreground group-data-[state=active]:bg-background/50 group-data-[state=active]:text-foreground"
                      >
                        {typeModels.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {sortedModelTypes.map((type) => {
              const typeModels = [...(modelsByType[type] || [])].sort((a, b) => {
                const aEnabled = modelEnabledStates[a.id] ?? false;
                const bEnabled = modelEnabledStates[b.id] ?? false;
                if (aEnabled === bEnabled) return 0;
                return aEnabled ? -1 : 1;
              });
              return (
                <TabsContent key={type} value={type} className="space-y-2 mt-4">
                  {typeModels.map((model) => {
                    const isEnabled = modelEnabledStates[model.id] ?? false;
                    return (
                      <div
                        key={model.id}
                        className="group flex items-center justify-between p-3 rounded-lg border border-transparent bg-transparent hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                            {renderModelListIcon(32)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-medium leading-tight cursor-default">
                                      {model.displayName || model.id}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{model.id}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <button
                                type="button"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#00b96b]/10 rounded"
                                onClick={() => handleEditModel(model)}
                              >
                                <PencilIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-[#00b96b]" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground leading-tight">
                              {model.releasedAt && <span>{model.releasedAt}</span>}
                              {model.pricing?.input && (
                                <span>Input ${(model.pricing.input || 0).toFixed(2)}/M</span>
                              )}
                              {model.pricing?.output && (
                                <span>Output ${(model.pricing.output || 0).toFixed(2)}/M</span>
                              )}
                              {model.contextWindowTokens && (
                                <span>{(model.contextWindowTokens / 1000).toFixed(0)}K</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {model.abilities && renderAbilityIcons(model.abilities)}
                          {customModels.some((cm) => cm.id === model.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive border border-transparent"
                              onClick={() => setModelToDelete(model.id)}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          )}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleModelToggle(model.id, checked)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : (
          <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
            {t('Provider.detail_no_models_found')}
          </div>
        )}
      </div>

      <AlertDialog open={!!modelToDelete} onOpenChange={(open) => !open && setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Provider.delete_model_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Provider.delete_model_dialog_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModelToDelete(null)}>
              {t('Provider.delete_model_dialog_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (modelToDelete) handleDeleteCustomModel(modelToDelete);
                setModelToDelete(null);
              }}
            >
              {t('Provider.delete_model_dialog_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Provider Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Provider.delete_provider_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {t('Provider.delete_provider_dialog_description', { name: provider.name })}
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('Provider.delete_provider_dialog_item_api_key')}</li>
                  <li>{t('Provider.delete_provider_dialog_item_model_settings')}</li>
                  <li>{t('Provider.delete_provider_dialog_item_custom_models')}</li>
                </ul>
                <p className="mt-2">{t('Provider.delete_provider_dialog_cannot_undo')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('Provider.delete_provider_dialog_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProvider}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t('Provider.delete_provider_dialog_deleting')}
                </>
              ) : (
                t('Provider.delete_provider_dialog_delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* API Key Required Warning Dialog */}
      <AlertDialog open={showApiKeyWarning} onOpenChange={setShowApiKeyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Provider.api_key_required_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Provider.api_key_required_dialog_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowApiKeyWarning(false)}>
              {t('Provider.api_key_required_dialog_ok')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Model Dialog */}
      {modelToEdit && (
        <EditModelDialog
          open={!!modelToEdit}
          onOpenChange={(open) => !open && setModelToEdit(null)}
          model={modelToEdit}
          isCustomModel={modelToEdit.isCustomModel}
          onSave={handleSaveModelEdit}
        />
      )}
    </div>
  );
}
