/**
 * Custom scrollbar utility classes using Tailwind CSS arbitrary values
 * Based on https://medium.com/@lyecre/guide-to-custom-scrollbar-styling-with-tailwind-css-v4-a7c8fce28e88
 */

export const scrollbarStyles = {
  /** Thin scrollbar with subtle styling */
  thin: [
    '[&::-webkit-scrollbar]:w-1.5',
    '[&::-webkit-scrollbar-track]:bg-transparent',
    '[&::-webkit-scrollbar-thumb]:bg-border/50',
    '[&::-webkit-scrollbar-thumb]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:hover:bg-border',
  ].join(' '),

  /** Hidden scrollbar but still scrollable */
  hidden: ['[&::-webkit-scrollbar]:w-0', '[&::-webkit-scrollbar]:h-0', 'scrollbar-none'].join(' '),

  /** Default scrollbar with theme colors */
  default: [
    '[&::-webkit-scrollbar]:w-2',
    '[&::-webkit-scrollbar-track]:bg-muted/30',
    '[&::-webkit-scrollbar-track]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:bg-border',
    '[&::-webkit-scrollbar-thumb]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:hover:bg-primary/50',
  ].join(' '),

  /** Minimal scrollbar for sidebars */
  minimal: [
    '[&::-webkit-scrollbar]:w-1',
    '[&::-webkit-scrollbar-track]:bg-transparent',
    '[&::-webkit-scrollbar-thumb]:bg-primary/20',
    '[&::-webkit-scrollbar-thumb]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:hover:bg-primary/40',
  ].join(' '),
} as const;

/** Reusable className for thin scrollbar */
export const thinScrollbar = scrollbarStyles.thin;

/** Reusable className for hidden scrollbar */
export const hiddenScrollbar = scrollbarStyles.hidden;

/** Reusable className for default scrollbar */
export const defaultScrollbar = scrollbarStyles.default;

/** Reusable className for minimal scrollbar */
export const minimalScrollbar = scrollbarStyles.minimal;
