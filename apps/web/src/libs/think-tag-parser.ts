const OPEN_TAGS = ['<think>', '<thinking>'];
const CLOSE_TAGS = ['</think>', '</thinking>'];

/**
 * Check if the end of `str` could be the beginning of one of the candidate tags.
 * Returns the partial suffix if found, or empty string otherwise.
 */
function findPartialSuffix(str: string, candidates: string[]): string {
  const maxTagLen = Math.max(...candidates.map((c) => c.length));
  for (let len = Math.min(str.length, maxTagLen - 1); len >= 1; len--) {
    const suffix = str.slice(-len).toLowerCase();
    if (candidates.some((tag) => tag.startsWith(suffix))) {
      return str.slice(-len);
    }
  }
  return '';
}

/**
 * Create a stateful streaming parser that intercepts `<think>`/`<thinking>` blocks
 * from text-delta chunks and separates them into text and reasoning output.
 *
 * This handles providers that embed reasoning in `<think>` tags within the
 * main text stream (e.g., Mistral Magistral, MiniMax, Ollama/local models).
 */
export function createThinkTagParser() {
  let insideThink = false;
  let buffer = '';

  function process(chunk: string): { text: string; reasoning: string } {
    buffer += chunk;
    let text = '';
    let reasoning = '';

    while (buffer.length > 0) {
      if (insideThink) {
        const closeMatch = buffer.match(/<\/think(?:ing)?>/i);
        if (closeMatch?.index != null) {
          reasoning += buffer.slice(0, closeMatch.index);
          buffer = buffer.slice(closeMatch.index + closeMatch[0].length);
          insideThink = false;
        } else {
          const partial = findPartialSuffix(buffer, CLOSE_TAGS);
          if (partial) {
            reasoning += buffer.slice(0, -partial.length);
            buffer = partial;
          } else {
            reasoning += buffer;
            buffer = '';
          }
          break;
        }
      } else {
        const openMatch = buffer.match(/<think(?:ing)?>/i);
        if (openMatch?.index != null) {
          text += buffer.slice(0, openMatch.index);
          buffer = buffer.slice(openMatch.index + openMatch[0].length);
          insideThink = true;
        } else {
          const partial = findPartialSuffix(buffer, OPEN_TAGS);
          if (partial) {
            text += buffer.slice(0, -partial.length);
            buffer = partial;
          } else {
            text += buffer;
            buffer = '';
          }
          break;
        }
      }
    }

    return { text, reasoning };
  }

  /**
   * Flush remaining buffer content. Call when the stream ends.
   * Unclosed `<think>` content is treated as reasoning.
   */
  function flush(): { text: string; reasoning: string } {
    const remaining = buffer;
    buffer = '';
    if (insideThink) {
      insideThink = false;
      return { text: '', reasoning: remaining };
    }
    return { text: remaining, reasoning: '' };
  }

  return { process, flush };
}
