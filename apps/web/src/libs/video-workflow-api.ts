import type { WorkflowStreamEvent } from '@/types/workflow';

export interface VideoStreamRequest {
  workflowId: string;
  modelId: string;
  keyId: string;
  prompt: string;
}

export function buildVideoStreamRequest(
  workflowId: string,
  modelId: string,
  keyId: string,
  prompt: string,
): VideoStreamRequest {
  const modelName = modelId.includes(':') ? modelId.split(':').slice(1).join(':') : modelId;

  return {
    workflowId,
    modelId: modelName,
    keyId,
    prompt,
  };
}

export async function* streamVideoWorkflow(
  request: VideoStreamRequest,
  signal?: AbortSignal,
): AsyncGenerator<WorkflowStreamEvent> {
  const response = await fetch('/api/workflow/video-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to stream video workflow';
    try {
      const errorData = await response.json();
      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // ignore
    }

    yield {
      type: 'error',
      workflowId: request.workflowId,
      error: errorMessage,
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
