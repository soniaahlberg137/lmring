'use client';

import { Button, cn } from '@lmring/ui';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-8', className)}>
      <div className="flex items-center justify-center size-12 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-medium">{t('WebDev.status_error')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {message || t('WebDev.error_generation_failed')}
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5 mr-1.5" />
          {t('WebDev.retry')}
        </Button>
      )}
    </div>
  );
}
