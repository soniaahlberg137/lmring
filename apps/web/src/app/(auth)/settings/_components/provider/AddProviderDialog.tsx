'use client';

import { PROVIDER_OPTIONS, PROVIDER_TYPE_TO_DEPOT_ID } from '@lmring/model-depot';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lmring/ui';
import { Anthropic, Azure, Google, OpenAI } from '@lobehub/icons';
import { BoxIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Provider } from './types';

interface AddProviderDialogProps {
  onAdd: (provider: Provider) => void;
}

export function AddProviderDialog({ onAdd }: AddProviderDialogProps) {
  const t = useTranslations('Provider');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(newOpen);
    if (!newOpen) {
      setName('');
      setProviderType('');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !providerType || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const providerId = name.toLowerCase().replace(/\s+/g, '-');
      const modelDepotId = PROVIDER_TYPE_TO_DEPOT_ID[providerType] || 'openai';

      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: providerId,
          isCustom: true,
          providerType: modelDepotId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add provider');
      }

      const data = await response.json();

      let Icon: Provider['Icon'] = BoxIcon;
      if (providerType === 'OpenAI' || providerType === 'OpenAI-Response') {
        Icon = OpenAI;
      } else if (providerType === 'Gemini') {
        Icon = Google;
      } else if (providerType === 'Anthropic') {
        Icon = Anthropic;
      } else if (providerType === 'Azure OpenAI') {
        Icon = Azure;
      } else if (providerType === 'New API' || providerType === 'CherryIn') {
        Icon = BoxIcon;
      }

      const newProvider: Provider = {
        id: providerId,
        name,
        connected: false,
        Icon,
        description: `Custom ${providerType} provider`,
        type: 'disabled',
        tags: [providerType],
        apiKeyId: data.id,
        isCustom: true,
        providerType: modelDepotId,
      };

      onAdd(newProvider);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" />
        <span>{t('add_provider')}</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent open={open} className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{t('add_provider_dialog.title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('add_provider_dialog.provider_name')}</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: OpenAI"
                  autoComplete="organization"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="providerType">{t('add_provider_dialog.provider_type')}</Label>
                <Select
                  name="providerType"
                  value={providerType}
                  onValueChange={setProviderType}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="providerType">
                    <SelectValue placeholder={t('add_provider_dialog.select_provider_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('add_provider_dialog.cancel')}
              </Button>
              <Button type="submit" disabled={!name || !providerType || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {t('add_provider_dialog.adding')}
                  </>
                ) : (
                  t('add_provider_dialog.ok')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
