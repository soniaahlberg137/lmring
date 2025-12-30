'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@lmring/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface AddModelDialogProps {
  onAdd: (model: { id: string; name: string }) => void;
}

export function AddModelDialog({ onAdd }: AddModelDialogProps) {
  const t = useTranslations('Provider');
  const [open, setOpen] = useState(false);
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setModelId('');
      setModelName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelId) return;

    onAdd({
      id: modelId.trim(),
      name: modelName.trim() || modelId.trim(),
    });
    handleOpenChange(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        title={t('add_model_dialog.title')}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent open={open} className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{t('add_model_dialog.title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="modelId">
                  {t('add_model_dialog.model_id')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="modelId"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="e.g. gpt-4-turbo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelName">{t('add_model_dialog.model_name')}</Label>
                <Input
                  id="modelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. GPT-4 Turbo"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t('add_model_dialog.cancel')}
              </Button>
              <Button type="submit" disabled={!modelId}>
                {t('add_model_dialog.ok')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
