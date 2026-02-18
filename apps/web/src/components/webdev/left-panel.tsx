'use client';

import { cn, ScrollArea } from '@lmring/ui';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useWebDevStore, useWebDevStoreShallow } from '@/stores/webdev-store';
import { useWorkflowStore, useWorkflowStoreShallow } from '@/stores/workflow-store';
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

  const workflowModelIds = useWorkflowStoreShallow((s) => {
    const result: Record<string, string> = {};
    for (const [id, wf] of s.workflows) {
      result[id] = wf.modelId;
    }
    return result;
  });
  const workflowOrder = useWorkflowStore((s) => s.workflowOrder);
  const webdevPrompt = useWebDevStore((s) => s.prompt);

  const displayPrompt = webdevPrompt.trim();
  const hasPrompt = phase !== 'idle' && displayPrompt.length > 0;
  const showOptions = sandboxes.size > 0 || (workflowOrder.length > 0 && phase === 'generating');
  const showVote = sandboxes.size > 1;

  return (
    <div className={cn('flex h-full flex-col bg-white', className)}>
      <div className="flex h-14 shrink-0 items-center border-b border-[#E8E4DF] px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-[#F5F0EB] px-3 py-1.5"
          >
            <span className="text-sm font-semibold text-[#1A1A1A]">Battle</span>
            <ChevronDown className="h-4 w-4 text-[#71717A]" />
          </button>
          <button type="button" className="rounded-lg bg-[#F5F0EB] p-2" aria-label="More options">
            <MoreHorizontal className="h-[18px] w-[18px] text-[#71717A]" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {hasPrompt && <PromptCard prompt={displayPrompt} />}

          {showOptions &&
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
              <p className="text-sm text-muted-foreground">Enter a prompt to start generating</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-[#E8E4DF] p-4">
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
