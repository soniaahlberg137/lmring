import { describe, expect, it } from 'vitest';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './index';

// Note: Full rendering tests are skipped due to react-resizable-panels
// using CSS that jsdom/cssstyle doesn't support (border: unset)
// These tests verify the components are exported correctly

describe('Resizable exports', () => {
  it('exports ResizablePanelGroup', () => {
    expect(ResizablePanelGroup).toBeDefined();
    expect(typeof ResizablePanelGroup).toBe('function');
  });

  it('exports ResizablePanel', () => {
    expect(ResizablePanel).toBeDefined();
    expect(typeof ResizablePanel).toBe('function');
  });

  it('exports ResizableHandle', () => {
    expect(ResizableHandle).toBeDefined();
    expect(typeof ResizableHandle).toBe('function');
  });

  it('ResizablePanel is the Panel component', () => {
    // Verify it's a function component that can be used
    expect(ResizablePanel.toString()).toContain('function');
  });
});
