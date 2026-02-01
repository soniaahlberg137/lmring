/**
 * Video Runtime Core
 *
 * Core functionality for video generation including factory, router, and client.
 */

// Client
export {
  type CreateVideoClientOptions,
  createVideoClient,
  createVideoClientFromProvider,
} from './client';
// Factory
export {
  VideoProviderFactory,
  videoProviderFactory,
} from './factory';
// Router
export {
  createVideoRouter,
  detectProviderFromModel,
  VideoRouter,
} from './router';
