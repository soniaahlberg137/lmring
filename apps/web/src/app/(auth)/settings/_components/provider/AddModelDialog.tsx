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
import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';

interface AddModelDialogProps {
  onAdd: (model: { id: string; name: string }) => void;
}

export function AddModelDialog({ onAdd }: AddModelDialogProps) {
  const t = useTranslations();
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

  const handleSubmit = (e: React.SubmitEvent) => {
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
        title={t('Provider.add_model_dialog_title')}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent open={open} className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{t('Provider.add_model_dialog_title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="modelId">
                  {t('Provider.add_model_dialog_model_id')} <span className="text-red-500">*</span>
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
                <Label htmlFor="modelName">{t('Provider.add_model_dialog_model_name')}</Label>
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
                {t('Provider.add_model_dialog_cancel')}
              </Button>
              <Button type="submit" disabled={!modelId}>
                {t('Provider.add_model_dialog_ok')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
