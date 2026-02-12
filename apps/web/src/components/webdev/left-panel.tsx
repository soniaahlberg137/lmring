'use client';

import { cn, ScrollArea } from '@lmring/ui';
import { Settings } from 'lucide-react';
import { useWebDevStore, useWebDevStoreShallow } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import { OptionCard } from './option-card';
import { PromptBar } from './prompt-bar';
import { PromptCard } from './prompt-card';

interface LeftPanelProps {
  onFollowUp: (prompt: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function LeftPanel({ onFollowUp, isLoading = false, className }: LeftPanelProps) {
  const { phase, activeWorkflowId } = useWebDevStoreShallow((s) => ({
    phase: s.phase,
    activeWorkflowId: s.activeWorkflowId,
  }));
  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const sandboxes = useWebDevStore((s) => s.sandboxes);

  const workflows = useWorkflowStore((s) => s.workflows);
  const workflowOrder = useWorkflowStore((s) => s.workflowOrder);
  const globalPrompt = useWorkflowStore((s) => s.globalPrompt);

  const hasPrompt = phase !== 'idle' && globalPrompt.trim().length > 0;
  const showOptions = sandboxes.size > 0;
  const showVote = sandboxes.size > 1;

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {/* Top Nav */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--webdev-border)] px-4">
        <span className="text-sm font-semibold">WebDev</span>
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {hasPrompt && <PromptCard prompt={globalPrompt} />}

          {showOptions &&
            workflowOrder.map((wfId, index) => {
              const wf = workflows.get(wfId);
              if (!wf) return null;

              const modelName = wf.modelId.split(':').pop() ?? wf.modelId;

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
              <p className="text-sm text-muted-foreground">Enter a prompt to start generating</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom prompt bar */}
      <div className="shrink-0 border-t border-[var(--webdev-border)] p-4">
        <PromptBar
          onSubmit={onFollowUp}
          isLoading={isLoading}
          disabled={phase === 'idle'}
          placeholder={phase === 'idle' ? 'Describe your web app...' : 'Ask a follow up...'}
        />
      </div>
    </div>
  );
}
