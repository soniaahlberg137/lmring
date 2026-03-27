# @lmring/theme

Theme engine, design tokens, and CSS variable utilities for LMRing.

## Install

```bash
pnpm add @lmring/theme
```

## Usage

```ts
import { getPreset, paletteToCssVars } from "@lmring/theme";
import "@lmring/theme/css";

const cssVars = paletteToCssVars(getPreset("ocean-blue"));
```
