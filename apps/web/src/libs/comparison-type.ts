import type { ComparisonType } from '@lmring/database';
import type { AiModelType } from '@lmring/model-depot';

/**
 * Maps AiModelType to ComparisonType for voting categorization
 *
 * Mapping:
 * - chat -> text
 * - image -> image_gen
 * - tts -> tts
 * - stt -> stt
 * - embedding -> text (default)
 * - realtime -> text (default)
 */
export function getComparisonTypeFromModelType(modelType: AiModelType): ComparisonType {
  switch (modelType) {
    case 'chat':
      return 'text';
    case 'image':
      return 'image_gen';
    case 'tts':
      return 'tts';
    case 'stt':
      return 'stt';
    default:
      // embedding and realtime default to text
      return 'text';
  }
}

/**
 * Determines ComparisonType based on input/output modality
 *
 * Use cases:
 * - TTS: text input -> audio output
 * - STT: audio input -> text output
 * - Image generation: text input -> image output
 * - Video generation: text input -> video output
 */
export function getComparisonTypeFromModality(
  inputModality: 'text' | 'audio' | 'image' | 'video',
  outputModality: 'text' | 'audio' | 'image' | 'video',
): ComparisonType {
  // TTS: text -> audio
  if (inputModality === 'text' && outputModality === 'audio') {
    return 'tts';
  }

  // STT: audio -> text
  if (inputModality === 'audio' && outputModality === 'text') {
    return 'stt';
  }

  // Image generation: * -> image
  if (outputModality === 'image') {
    return 'image_gen';
  }

  // Video generation: * -> video
  if (outputModality === 'video') {
    return 'video_gen';
  }

  // Default to text for chat models
  return 'text';
}

/**
 * All valid comparison types
 */
export const COMPARISON_TYPES: ComparisonType[] = [
  'text',
  'image_gen',
  'video_gen',
  'tts',
  'stt',
] as const;

/**
 * Human-readable labels for comparison types
 */
export const COMPARISON_TYPE_LABELS: Record<ComparisonType, string> = {
  text: 'Text',
  image_gen: 'Image Generation',
  video_gen: 'Video Generation',
  tts: 'Text-to-Speech',
  stt: 'Speech-to-Text',
};
