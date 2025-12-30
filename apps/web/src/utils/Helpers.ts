// Re-export URL functions from BaseUrl.ts to maintain backward compatibility
export { getAuthBaseUrl, getBaseUrl } from './BaseUrl';

export const getI18nPath = (url: string) => {
  return url;
};

export const isServer = () => {
  return typeof window === 'undefined';
};
