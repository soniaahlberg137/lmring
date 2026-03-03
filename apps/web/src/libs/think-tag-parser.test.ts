import { describe, expect, it } from 'vitest';
import { createThinkTagParser } from './think-tag-parser';

describe('createThinkTagParser', () => {
  it('passes through text without think tags', () => {
    const parser = createThinkTagParser();
    const result = parser.process('Hello world');
    expect(result).toEqual({ text: 'Hello world', reasoning: '' });
    expect(parser.flush()).toEqual({ text: '', reasoning: '' });
  });

  it('separates a single-chunk complete think block', () => {
    const parser = createThinkTagParser();
    const result = parser.process('<think>reasoning here</think>Answer');
    expect(result).toEqual({ text: 'Answer', reasoning: 'reasoning here' });
  });

  it('handles think tag split across multiple chunks', () => {
    const parser = createThinkTagParser();

    const r1 = parser.process('Hello <thi');
    expect(r1).toEqual({ text: 'Hello ', reasoning: '' });

    const r2 = parser.process('nk>reason');
    expect(r2).toEqual({ text: '', reasoning: 'reason' });

    const r3 = parser.process('ing</think>World');
    expect(r3).toEqual({ text: 'World', reasoning: 'ing' });
  });

  it('handles reasoning spanning multiple chunks', () => {
    const parser = createThinkTagParser();

    const r1 = parser.process('<think>first ');
    expect(r1).toEqual({ text: '', reasoning: 'first ' });

    const r2 = parser.process('second ');
    expect(r2).toEqual({ text: '', reasoning: 'second ' });

    const r3 = parser.process('third</think>Answer');
    expect(r3).toEqual({ text: 'Answer', reasoning: 'third' });
  });

  it('flush() treats unclosed think content as reasoning', () => {
    const parser = createThinkTagParser();

    const r1 = parser.process('<think>unclosed reasoning');
    expect(r1).toEqual({ text: '', reasoning: 'unclosed reasoning' });

    const flushed = parser.flush();
    expect(flushed).toEqual({ text: '', reasoning: '' });
  });

  it('flush() emits buffered text when outside think block', () => {
    const parser = createThinkTagParser();

    // Partial open tag at end leaves it in buffer
    const r1 = parser.process('Hello <thi');
    expect(r1).toEqual({ text: 'Hello ', reasoning: '' });

    const flushed = parser.flush();
    expect(flushed).toEqual({ text: '<thi', reasoning: '' });
  });

  it('handles text before and after a think block', () => {
    const parser = createThinkTagParser();
    const result = parser.process('Before<think>internal</think>After');
    expect(result).toEqual({ text: 'BeforeAfter', reasoning: 'internal' });
  });

  it('handles multiple think blocks', () => {
    const parser = createThinkTagParser();
    const result = parser.process('<think>first</think>Middle<think>second</think>End');
    expect(result).toEqual({ text: 'MiddleEnd', reasoning: 'firstsecond' });
  });

  it('handles <thinking> variant', () => {
    const parser = createThinkTagParser();
    const result = parser.process('<thinking>deep thought</thinking>Result');
    expect(result).toEqual({ text: 'Result', reasoning: 'deep thought' });
  });

  it('handles case-insensitive matching', () => {
    const parser = createThinkTagParser();
    const result = parser.process('<THINK>reasoning</THINK>Answer');
    expect(result).toEqual({ text: 'Answer', reasoning: 'reasoning' });
  });

  it('handles closing tag split across chunks', () => {
    const parser = createThinkTagParser();

    const r1 = parser.process('<think>reason</thi');
    expect(r1).toEqual({ text: '', reasoning: 'reason' });

    const r2 = parser.process('nk>Answer');
    expect(r2).toEqual({ text: 'Answer', reasoning: '' });
  });

  it('handles chunk ending with <', () => {
    const parser = createThinkTagParser();

    const r1 = parser.process('Hello <');
    expect(r1).toEqual({ text: 'Hello ', reasoning: '' });

    // Next chunk completes a non-think tag
    const r2 = parser.process('p>world');
    expect(r2).toEqual({ text: '<p>world', reasoning: '' });
  });

  it('handles empty chunks', () => {
    const parser = createThinkTagParser();
    const result = parser.process('');
    expect(result).toEqual({ text: '', reasoning: '' });
  });

  it('handles content that is only a think block', () => {
    const parser = createThinkTagParser();
    const result = parser.process('<think>only reasoning</think>');
    expect(result).toEqual({ text: '', reasoning: 'only reasoning' });
  });
});
