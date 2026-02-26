'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lmring/ui';
import { Cloud, Key, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigModal({ open, onOpenChange }: ConfigModalProps) {
  const { t } = useTranslation();

  const options = [
    {
      icon: Cloud,
      title: t('WebDev.config_option_deploy'),
      description: t('WebDev.config_option_deploy_description'),
    },
    {
      icon: Terminal,
      title: t('WebDev.config_option_local_token'),
      description: t('WebDev.config_option_local_token_description'),
    },
    {
      icon: Key,
      title: t('WebDev.config_option_access_token'),
      description: t('WebDev.config_option_access_token_description'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('WebDev.config_title')}</DialogTitle>
          <DialogDescription>{t('WebDev.config_description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {options.map((option) => (
            <div key={option.title} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-muted shrink-0">
                <option.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              {t('WebDev.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
