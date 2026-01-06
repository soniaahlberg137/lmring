import type {
  WorkflowImageAttachment,
  WorkflowMetrics,
  WorkflowStreamEvent,
  WorkflowStreamRequest,
} from '@/types/workflow';

export async function* streamWorkflow(
  request: WorkflowStreamRequest,
  signal?: AbortSignal,
): AsyncGenerator<WorkflowStreamEvent> {
  const response = await fetch('/api/workflow/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to stream workflow';
    let detailedMessage: string | undefined;
    try {
      const errorData = await response.json();
      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      if (errorData.message && errorData.message !== errorMessage) {
        detailedMessage = errorData.message;
      }
    } catch {
      // ignore
    }

    yield {
      type: 'error',
      workflowId: request.workflowId,
      error: detailedMessage ? `${errorMessage}\n${detailedMessage}` : errorMessage,
    };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield {
      type: 'error',
      workflowId: request.workflowId,
      error: 'Response body is not readable',
    };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const event = JSON.parse(data) as WorkflowStreamEvent;
            yield event;
          } catch {
            console.error('Failed to parse SSE event:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function buildWorkflowStreamRequest(
  workflowId: string,
  modelId: string,
  keyId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  config: {
    temperature: number;
    maxTokens: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  },
  attachments?: WorkflowImageAttachment[],
): WorkflowStreamRequest {
  const modelName = modelId.includes(':') ? modelId.split(':').slice(1).join(':') : modelId;

  return {
    workflowId,
    modelId: modelName,
    keyId,
    messages,
    config,
    ...(attachments && attachments.length > 0 && { attachments }),
  };
}

export function parseWorkflowMetrics(event: WorkflowStreamEvent): WorkflowMetrics | undefined {
  if (event.type === 'complete' && event.metrics) {
    return event.metrics;
  }
  return undefined;
}
