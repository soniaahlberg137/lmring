/**
 * Parameter Validation
 *
 * Zod schemas and validation utilities for video generation parameters.
 */

import { z } from 'zod';
import type { ImageToVideoInput, ValidationResult, VideoGenerationParams } from '../types';

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for image media input.
 */
export const ImageMediaSchema = z
  .object({
    url: z.string().url().optional(),
    base64: z.string().optional(),
    mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  })
  .refine((data) => data.url || data.base64, {
    message: 'Either url or base64 must be provided',
  })
  .refine((data) => !(data.url && data.base64), {
    message: 'Cannot provide both url and base64',
  });

/**
 * Schema for text-to-video input.
 */
export const TextToVideoInputSchema = z.object({
  type: z.literal('text-to-video'),
  prompt: z.string().min(1, 'Prompt is required'),
  negativePrompt: z.string().optional(),
});

/**
 * Schema for image-to-video input.
 */
export const ImageToVideoInputSchema = z.object({
  type: z.literal('image-to-video'),
  prompt: z.string().min(1, 'Prompt is required'),
  negativePrompt: z.string().optional(),
  image: ImageMediaSchema,
});

/**
 * Schema for video generation input (union).
 */
export const VideoGenerationInputSchema = z.discriminatedUnion('type', [
  TextToVideoInputSchema,
  ImageToVideoInputSchema,
]);

/**
 * Schema for aspect ratio.
 */
export const VideoAspectRatioSchema = z.enum(['16:9', '9:16', '1:1', '4:3', '3:4', '21:9']);

/**
 * Schema for quality tier.
 */
export const VideoQualitySchema = z.enum(['standard', 'high', 'pro', 'master']);

/**
 * Schema for video generation parameters.
 */
export const VideoGenerationParamsSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  input: VideoGenerationInputSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  aspectRatio: VideoAspectRatioSchema.optional(),
  duration: z.number().positive().max(300).optional(),
  fps: z.number().int().positive().max(120).optional(),
  quality: VideoQualitySchema.optional(),
  audio: z.boolean().optional(),
  seed: z.number().int().nonnegative().optional(),
  providerOptions: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate video generation parameters.
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 */
export function validateParams(params: unknown): ValidationResult {
  const result = VideoGenerationParamsSchema.safeParse(params);

  if (result.success) {
    return { valid: true };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { valid: false, errors };
}

/**
 * Validate and parse video generation parameters.
 *
 * @param params - Parameters to validate
 * @returns Parsed parameters
 * @throws Error if validation fails
 */
export function parseParams(params: unknown): VideoGenerationParams {
  return VideoGenerationParamsSchema.parse(params) as VideoGenerationParams;
}

/**
 * Check if the input is a text-to-video input.
 */
export function isTextToVideoInput(
  input: VideoGenerationParams['input'],
): input is { type: 'text-to-video'; prompt: string; negativePrompt?: string } {
  return input.type === 'text-to-video';
}

/**
 * Check if the input is an image-to-video input.
 */
export function isImageToVideoInput(
  input: VideoGenerationParams['input'],
): input is ImageToVideoInput {
  return input.type === 'image-to-video';
}
