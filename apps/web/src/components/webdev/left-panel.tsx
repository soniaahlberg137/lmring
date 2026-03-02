'use client';

import { cn, ScrollArea } from '@lmring/ui';
import { useTranslation } from 'react-i18next';
import { useWebDevStore, useWebDevStoreShallow, webdevSelectors } from '@/stores/webdev-store';
import { useWorkflowStore, useWorkflowStoreShallow } from '@/stores/workflow-store';
import { IterationTimeline } from './iteration-timeline';
import { OptionCard } from './option-card';
import { PromptBar } from './prompt-bar';

interface LeftPanelProps {
  onFollowUp: (prompt: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function LeftPanel({ onFollowUp, isLoading = false, className }: LeftPanelProps) {
  const { t } = useTranslation();
  const { phase, activeWorkflowId, activeIterationVersion } = useWebDevStoreShallow((s) => ({
    phase: s.phase,
    activeWorkflowId: s.activeWorkflowId,
    activeIterationVersion: s.activeIterationVersion,
  }));
  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const setActiveIterationVersion = useWebDevStore((s) => s.setActiveIterationVersion);
  const sandboxes = useWebDevStore((s) => s.sandboxes);
  const iterations = useWebDevStore((s) => s.iterations);
  const isLatestIteration = useWebDevStore(webdevSelectors.isLatestIteration);

  const workflowModelIds = useWorkflowStoreShallow((s) => {
    const result: Record<string, string> = {};
    for (const [id, wf] of s.workflows) {
      result[id] = wf.modelId;
    }
    return result;
  });
  const workflowOrder = useWorkflowStore((s) => s.workflowOrder);
  const webdevPrompt = useWebDevStore((s) => s.submittedPrompt);

  const displayPrompt = webdevPrompt.trim();
  const hasPrompt = phase !== 'idle' && displayPrompt.length > 0;
  const showOptions = sandboxes.size > 0 || (workflowOrder.length > 0 && phase === 'generating');
  const showVote = sandboxes.size > 1;

  // Compute the current version (latest = max iteration version + 1, or 1 if no iterations)
  const currentVersion =
    iterations.length > 0 ? Math.max(...iterations.map((it) => it.version)) + 1 : 1;

  // Disable timeline clicks during generation to prevent race conditions
  const timelineDisabled = phase === 'generating';

  return (
    <div className={cn('flex h-full flex-col bg-[var(--webdev-card-bg)]', className)}>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {hasPrompt && (
            <IterationTimeline
              iterations={iterations.map((it) => ({
                version: it.version,
                prompt: it.prompt,
              }))}
              currentPrompt={displayPrompt}
              currentVersion={currentVersion}
              activeVersion={activeIterationVersion || currentVersion}
              onSelectVersion={setActiveIterationVersion}
              disabled={timelineDisabled}
            />
          )}

          {showOptions &&
            isLatestIteration &&
            workflowOrder.map((wfId, index) => {
              const modelId = workflowModelIds[wfId];
              if (!modelId) return null;

              const modelName = modelId.split(':').pop() ?? modelId;

              return (
                <OptionCard
                  key={wfId}
                  workflowId={wfId}
                  index={index}
                  modelName={modelName}
                  isActive={activeWorkflowId === wfId}
                  showVote={showVote}
                  onClick={() => setActiveWorkflowId(wfId)}
                />
              );
            })}

          {!hasPrompt && !showOptions && (
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{t('WebDev.enter_prompt')}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-[var(--webdev-border)] p-4">
        <PromptBar
          onSubmit={onFollowUp}
          isLoading={isLoading}
          disabled={
            phase === 'idle' || phase === 'generating' || phase === 'building' || !isLatestIteration
          }
          placeholder={
            !isLatestIteration
              ? t('WebDev.switch_to_latest')
              : phase === 'idle'
                ? t('WebDev.placeholder_idle')
                : t('WebDev.placeholder_followup')
          }
        />
      </div>
    </div>
  );
}
