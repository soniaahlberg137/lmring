'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lmring/ui';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EraserIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
} from 'lucide-react';
import * as React from 'react';

import { ModelSelectorOverlay, ModelSelectorTrigger } from '@/components/arena/model-selector';
import { ProviderIcon } from '@/components/arena/provider-icon';
import type { ModelConfig, ModelOption } from '@/types/arena';
import type { PendingResponse, WorkflowMessage, WorkflowStatus } from '@/types/workflow';
import { ChatList } from './chat/chat-list';

interface ModelCardProps {
  modelId?: string;
  models: ModelOption[];
  response?: string;
  messages?: WorkflowMessage[];
  pendingResponse?: PendingResponse;
  isLoading?: boolean;
  status?: WorkflowStatus;
  error?: string;
  synced?: boolean;
  customPrompt?: string;
  config?: ModelConfig;
  index?: number;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onModelSelect?: (modelId: string) => void;
  onSyncToggle?: (synced: boolean) => void;
  onConfigChange?: (config: ModelConfig) => void;
  onCustomPromptChange?: (prompt: string) => void;
  onClear?: () => void;
  onDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onAddCard?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onRetry?: (messageId: string) => void;
  onMaximize?: (content: string) => void;
}

const DEFAULT_CONFIG: ModelConfig = {
  maxTokens: 2048,
  temperature: 0.7,
};

export function ModelCard({
  modelId,
  models,
  messages,
  pendingResponse,
  response = '',
  isLoading = false,
  status,
  error,
  synced = true,
  customPrompt = '',
  config = DEFAULT_CONFIG,
  index = 0,
  canMoveLeft = false,
  canMoveRight = false,
  onModelSelect,
  onSyncToggle,
  onConfigChange,
  onCustomPromptChange,
  onClear,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onAddCard,
  onThumbsUp,
  onThumbsDown,
  onRetry,
  onMaximize,
}: ModelCardProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = React.useState(false);

  const selectedModel = models.find((m) => m.id === modelId);

  const handleConfigChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
    if (value !== undefined) {
      onConfigChange?.({ ...config, [key]: value });
    }
  };

  const hasContent = (messages && messages.length > 0) || !!pendingResponse || !!response;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="w-full h-full"
    >
      <Card className="h-full min-h-0 arena-card flex flex-col glass-effect relative overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0 space-y-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <ModelSelectorTrigger
                models={models}
                selectedModel={selectedModel?.id}
                onClick={() => setModelSelectorOpen(true)}
              />
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover-lift text-muted-foreground hover:text-foreground"
                        onClick={() => onSyncToggle?.(!synced)}
                      >
                        {synced ? (
                          <ToggleRightIcon className="h-4 w-4" />
                        ) : (
                          <ToggleLeftIcon className="h-4 w-4" />
                        )}
                      </Button>
                      {synced && (
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 border border-background ring-1 ring-background pointer-events-none" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Sync chat messages with other models</p>
                  </TooltipContent>
                </Tooltip>

                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover-lift">
                          <SlidersHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Model Settings</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-80 glass-effect" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium sr-only">Model Settings</h4>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Max Output Tokens</Label>
                            <span className="text-sm text-muted-foreground">
                              {config.maxTokens}
                            </span>
                          </div>
                          <Slider
                            value={[config.maxTokens]}
                            onValueChange={([value]) =>
                              handleConfigChange('maxTokens', value ?? config.maxTokens)
                            }
                            min={256}
                            max={64000}
                            step={256}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Temperature</Label>
                            <span className="text-sm text-muted-foreground">
                              {config.temperature.toFixed(2)}
                            </span>
                          </div>
                          <Slider
                            value={[config.temperature]}
                            onValueChange={([value]) =>
                              handleConfigChange('temperature', value ?? config.temperature)
                            }
                            min={0}
                            max={2}
                            step={0.01}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Top P</Label>
                            <span className="text-sm text-muted-foreground">
                              {config.topP != null ? config.topP.toFixed(2) : '-'}
                            </span>
                          </div>
                          <Slider
                            value={[config.topP ?? 0.9]}
                            onValueChange={([value]) => handleConfigChange('topP', value)}
                            min={0}
                            max={1}
                            step={0.01}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Frequency Penalty</Label>
                            <span className="text-sm text-muted-foreground">
                              {config.frequencyPenalty != null
                                ? config.frequencyPenalty.toFixed(2)
                                : '-'}
                            </span>
                          </div>
                          <Slider
                            value={[config.frequencyPenalty ?? 0]}
                            onValueChange={([value]) =>
                              handleConfigChange('frequencyPenalty', value)
                            }
                            min={0}
                            max={2}
                            step={0.01}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Presence Penalty</Label>
                            <span className="text-sm text-muted-foreground">
                              {config.presencePenalty != null
                                ? config.presencePenalty.toFixed(2)
                                : '-'}
                            </span>
                          </div>
                          <Slider
                            value={[config.presencePenalty ?? 0]}
                            onValueChange={([value]) =>
                              handleConfigChange('presencePenalty', value)
                            }
                            min={0}
                            max={2}
                            step={0.01}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {onAddCard && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover-lift"
                        onClick={onAddCard}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add Model</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover-lift"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>More Options</p>
                    </TooltipContent>
                  </Tooltip>

                  {dropdownOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                        onKeyDown={(e) => e.key === 'Escape' && setDropdownOpen(false)}
                        aria-label="Close dropdown menu"
                      />
                      <div className="absolute top-full right-0 mt-1 z-20 bg-popover border rounded-xl shadow-lg min-w-[160px] py-1">
                        {onClear && (
                          <button
                            type="button"
                            onClick={() => {
                              onClear();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          >
                            <EraserIcon className="h-4 w-4" />
                            Clear Chat
                          </button>
                        )}
                        {canMoveLeft && onMoveLeft && (
                          <button
                            type="button"
                            onClick={() => {
                              onMoveLeft();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Move Left
                          </button>
                        )}
                        {canMoveRight && onMoveRight && (
                          <button
                            type="button"
                            onClick={() => {
                              onMoveRight();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                            Move Right
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              onDelete();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-destructive"
                          >
                            <Trash2Icon className="h-4 w-4" />
                            Delete Chat
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-0 overflow-hidden pb-4">
          {!hasContent && !isLoading && selectedModel ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 max-w-xl w-full backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ProviderIcon providerId={selectedModel.providerId} size={16} />
                  <span>{selectedModel.name}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedModel.description}
                </p>

                {(selectedModel.context || selectedModel.inputPricing) && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
                    {selectedModel.context && (
                      <div>
                        <span className="font-medium">Context:</span> {selectedModel.context}
                      </div>
                    )}
                    {selectedModel.inputPricing && (
                      <div>
                        <span className="font-medium">Input:</span> {selectedModel.inputPricing}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      Model Page <ExternalLinkIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0">
                <ChatList
                  messages={messages || []}
                  pendingResponse={pendingResponse}
                  isLoading={isLoading}
                  status={status}
                  error={error}
                  providerId={selectedModel?.providerId}
                  onRetry={onRetry}
                  onMaximize={onMaximize}
                />
              </div>
            </div>
          )}

          {!synced && (
            <div className="pt-3 flex-shrink-0">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => onCustomPromptChange?.(e.target.value)}
                placeholder="Type a custom prompt for this model..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
              />
            </div>
          )}

          {hasContent && !isLoading && (
            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onThumbsUp}
                  className="p-2 rounded-lg hover:bg-accent transition-colors hover-lift button-press"
                  aria-label="Thumbs up"
                >
                  <ThumbsUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onThumbsDown}
                  className="p-2 rounded-lg hover:bg-accent transition-colors hover-lift button-press"
                  aria-label="Thumbs down"
                >
                  <ThumbsDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>

        <ModelSelectorOverlay
          models={models}
          selectedModel={selectedModel?.id}
          isOpen={modelSelectorOpen}
          onClose={() => setModelSelectorOpen(false)}
          onModelSelect={(modelId) => onModelSelect?.(modelId)}
        />
      </Card>
    </motion.div>
  );
}
