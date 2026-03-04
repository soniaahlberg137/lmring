declare module 'culori' {
  export interface OklchLike {
    mode: 'oklch';
    l: number;
    c?: number;
    h?: number;
  }

  export interface RgbLike {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
  }

  export function converter(mode: 'oklch'): (input: string) => OklchLike | undefined;
  export function converter(mode: 'rgb'): (input: OklchLike) => RgbLike | undefined;
  export function formatHex(input: OklchLike): string;
}
