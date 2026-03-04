'use client';

import { hexToOklch, oklchToHex, presets } from '@lmring/theme';
import { Button, Card, CardContent, Input, Label } from '@lmring/ui';
import * as React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { themeSelectors, useThemeStore } from '@/stores/theme-store';

const PRESET_LABEL_KEYS = {
  'ocean-blue': 'Settings.theme_preset_ocean_blue',
  violet: 'Settings.theme_preset_violet',
  emerald: 'Settings.theme_preset_emerald',
  amber: 'Settings.theme_preset_amber',
  rose: 'Settings.theme_preset_rose',
  crimson: 'Settings.theme_preset_crimson',
  cyan: 'Settings.theme_preset_cyan',
  indigo: 'Settings.theme_preset_indigo',
} as const;

const HEX6_REGEX = /^#[0-9a-fA-F]{6}$/;

export function ThemeCustomizer() {
  const t = useTranslations();
  const mode = useThemeStore(themeSelectors.mode);
  const seedColor = useThemeStore(themeSelectors.seedColor);
  const presetName = useThemeStore(themeSelectors.presetName);
  const setMode = useThemeStore(themeSelectors.setMode);
  const setSeedColor = useThemeStore(themeSelectors.setSeedColor);
  const setPreset = useThemeStore(themeSelectors.setPreset);
  const resetTheme = useThemeStore(themeSelectors.resetTheme);
  const [hexInput, setHexInput] = React.useState<string>(oklchToHex(seedColor));

  React.useEffect(() => {
    setHexInput(oklchToHex(seedColor));
  }, [seedColor]);

  const applyHexColor = React.useCallback(
    (rawValue: string) => {
      const normalized = rawValue.trim().startsWith('#') ? rawValue.trim() : `#${rawValue.trim()}`;
      if (!HEX6_REGEX.test(normalized)) {
        return;
      }

      try {
        const oklch = hexToOklch(normalized);
        setSeedColor(oklch);
      } catch {
        // Ignore invalid user input.
      }
    },
    [setSeedColor],
  );

  const colorPickerValue = HEX6_REGEX.test(hexInput) ? hexInput : '#3b82f6';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base">{t('Settings.theme_mode')}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === 'light' ? 'default' : 'outline'}
            onClick={() => setMode('light')}
            className="min-w-20"
          >
            {t('Settings.theme_mode_light')}
          </Button>
          <Button
            type="button"
            variant={mode === 'dark' ? 'default' : 'outline'}
            onClick={() => setMode('dark')}
            className="min-w-20"
          >
            {t('Settings.theme_mode_dark')}
          </Button>
          <Button
            type="button"
            variant={mode === 'system' ? 'default' : 'outline'}
            onClick={() => setMode('system')}
            className="min-w-20"
          >
            {t('Settings.theme_mode_system')}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">{t('Settings.theme_presets')}</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {presets.map((preset) => {
            const active = presetName === preset.name;
            const swatch = `oklch(${preset.lightness} ${preset.chroma} ${preset.hue})`;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setPreset(preset.name)}
                className={`rounded-lg border p-2 text-left transition-all ${
                  active
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/60'
                }`}
              >
                <div className="mb-2 h-8 w-full rounded-md" style={{ backgroundColor: swatch }} />
                <div className="text-xs font-medium">
                  {t(PRESET_LABEL_KEYS[preset.name as keyof typeof PRESET_LABEL_KEYS])}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">{t('Settings.theme_custom_color')}</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={colorPickerValue}
            onChange={(event) => {
              const next = event.target.value;
              setHexInput(next);
              applyHexColor(next);
            }}
            className="h-10 w-14 cursor-pointer rounded border border-border bg-background p-1"
            aria-label={t('Settings.theme_custom_color')}
          />
          <Input
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value)}
            onBlur={() => applyHexColor(hexInput)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyHexColor(hexInput);
              }
            }}
            placeholder="#3b82f6"
            className="max-w-48"
          />
          <Button type="button" variant="outline" onClick={resetTheme}>
            {t('Settings.theme_reset')}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">{t('Settings.theme_preview')}</Label>
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">{t('Settings.theme_preview_title')}</div>
              <div className="text-sm text-muted-foreground">
                {t('Settings.theme_preview_body')}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm">
                {t('Settings.theme_preview_button_primary')}
              </Button>
              <Button type="button" size="sm" variant="secondary">
                {t('Settings.theme_preview_button_secondary')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
