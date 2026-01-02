export default {
  '*': [() => 'pnpm run lint:fix'],
  '*.{ts,tsx}': [() => 'pnpm run check:types'],
};
