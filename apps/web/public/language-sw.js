const LANGUAGE_HEADER = 'x-language';
const LANGUAGE_CACHE_NAME = 'lmring-language-pref-cache';
const LANGUAGE_CACHE_KEY = '/__language_pref__';
const MESSAGE_TYPE_SET_LANGUAGE = 'SET_LANGUAGE';

let currentLanguage = null;

async function loadLanguagePreference() {
  const cache = await caches.open(LANGUAGE_CACHE_NAME);
  const cached = await cache.match(LANGUAGE_CACHE_KEY);

  if (!cached) {
    return null;
  }

  return cached.text();
}

async function persistLanguagePreference(language) {
  const cache = await caches.open(LANGUAGE_CACHE_NAME);
  await cache.put(
    LANGUAGE_CACHE_KEY,
    new Response(language ?? '', {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain',
      },
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      currentLanguage = (await loadLanguagePreference()) || null;
      await clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;

  if (!data || data.type !== MESSAGE_TYPE_SET_LANGUAGE) {
    return;
  }

  if (typeof data.payload !== 'string') {
    return;
  }

  currentLanguage = data.payload;
  event.waitUntil(persistLanguagePreference(currentLanguage));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Avoid errors for navigation preload
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (!currentLanguage) {
    return;
  }

  if (request.headers.get(LANGUAGE_HEADER) === currentLanguage) {
    return;
  }

  const headers = new Headers(request.headers);
  headers.set(LANGUAGE_HEADER, currentLanguage);

  const modifiedRequest = new Request(request, { headers });

  event.respondWith(
    (async () => {
      try {
        return await fetch(modifiedRequest);
      } catch (error) {
        console.error('language-sw: failed to forward request', error);
        return fetch(request);
      }
    })(),
  );
});
