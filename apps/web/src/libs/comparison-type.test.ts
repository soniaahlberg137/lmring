import { describe, expect, it } from 'vitest';
import {
  COMPARISON_TYPE_LABELS,
  COMPARISON_TYPES,
  getComparisonTypeFromModality,
  getComparisonTypeFromModelType,
} from './comparison-type';

describe('comparison-type', () => {
  describe('getComparisonTypeFromModelType', () => {
    it('should map chat to text', () => {
      expect(getComparisonTypeFromModelType('chat')).toBe('text');
    });

    it('should map image to image_gen', () => {
      expect(getComparisonTypeFromModelType('image')).toBe('image_gen');
    });

    it('should map tts to tts', () => {
      expect(getComparisonTypeFromModelType('tts')).toBe('tts');
    });

    it('should map stt to stt', () => {
      expect(getComparisonTypeFromModelType('stt')).toBe('stt');
    });

    it('should map embedding to text (default)', () => {
      expect(getComparisonTypeFromModelType('embedding')).toBe('text');
    });

    it('should map realtime to text (default)', () => {
      expect(getComparisonTypeFromModelType('realtime')).toBe('text');
    });
  });

  describe('getComparisonTypeFromModality', () => {
    it('should return tts for text input and audio output', () => {
      expect(getComparisonTypeFromModality('text', 'audio')).toBe('tts');
    });

    it('should return stt for audio input and text output', () => {
      expect(getComparisonTypeFromModality('audio', 'text')).toBe('stt');
    });

    it('should return image_gen for any input with image output', () => {
      expect(getComparisonTypeFromModality('text', 'image')).toBe('image_gen');
      expect(getComparisonTypeFromModality('audio', 'image')).toBe('image_gen');
      expect(getComparisonTypeFromModality('image', 'image')).toBe('image_gen');
      expect(getComparisonTypeFromModality('video', 'image')).toBe('image_gen');
    });

    it('should return video_gen for any input with video output', () => {
      expect(getComparisonTypeFromModality('text', 'video')).toBe('video_gen');
      expect(getComparisonTypeFromModality('audio', 'video')).toBe('video_gen');
      expect(getComparisonTypeFromModality('image', 'video')).toBe('video_gen');
      expect(getComparisonTypeFromModality('video', 'video')).toBe('video_gen');
    });

    it('should return text for text input and text output', () => {
      expect(getComparisonTypeFromModality('text', 'text')).toBe('text');
    });

    it('should return text for audio input and audio output', () => {
      expect(getComparisonTypeFromModality('audio', 'audio')).toBe('text');
    });

    it('should return text for image input and text output', () => {
      expect(getComparisonTypeFromModality('image', 'text')).toBe('text');
    });
  });

  describe('COMPARISON_TYPES', () => {
    it('should contain all expected comparison types', () => {
      expect(COMPARISON_TYPES).toContain('text');
      expect(COMPARISON_TYPES).toContain('image_gen');
      expect(COMPARISON_TYPES).toContain('video_gen');
      expect(COMPARISON_TYPES).toContain('tts');
      expect(COMPARISON_TYPES).toContain('stt');
    });

    it('should have exactly 5 types', () => {
      expect(COMPARISON_TYPES).toHaveLength(5);
    });
  });

  describe('COMPARISON_TYPE_LABELS', () => {
    it('should have labels for all comparison types', () => {
      expect(COMPARISON_TYPE_LABELS.text).toBe('Text');
      expect(COMPARISON_TYPE_LABELS.image_gen).toBe('Image Generation');
      expect(COMPARISON_TYPE_LABELS.video_gen).toBe('Video Generation');
      expect(COMPARISON_TYPE_LABELS.tts).toBe('Text-to-Speech');
      expect(COMPARISON_TYPE_LABELS.stt).toBe('Speech-to-Text');
    });

    it('should have labels for every COMPARISON_TYPE', () => {
      for (const type of COMPARISON_TYPES) {
        expect(COMPARISON_TYPE_LABELS[type]).toBeDefined();
        expect(typeof COMPARISON_TYPE_LABELS[type]).toBe('string');
        expect(COMPARISON_TYPE_LABELS[type].length).toBeGreaterThan(0);
      }
    });
  });
});
