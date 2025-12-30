'use client';

import type { ModelAbilities } from '@lmring/model-depot';
import {
  Button,
  cn,
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
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lmring/ui';
import {
  BrainCircuitIcon,
  CopyIcon,
  EyeIcon,
  GlobeIcon,
  HelpCircleIcon,
  Loader2Icon,
  WrenchIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface EditModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: {
    id: string;
    displayName?: string;
    abilities?: ModelAbilities;
    supportsStreaming?: boolean;
    pricing?: { currency?: string; input?: number; output?: number };
  };
  isCustomModel: boolean;
  onSave: (data: {
    displayName?: string;
    abilities?: ModelAbilities;
    supportsStreaming?: boolean;
    priceCurrency?: string;
    inputPrice?: number;
    outputPrice?: number;
  }) => Promise<void>;
}

const ABILITY_CONFIG: {
  key: keyof ModelAbilities;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: 'vision', label: 'Vision', icon: EyeIcon, color: 'text-green-500 border-green-500' },
  { key: 'search', label: 'WebSearch', icon: GlobeIcon, color: 'text-blue-500 border-blue-500' },
  {
    key: 'reasoning',
    label: 'Reasoning',
    icon: BrainCircuitIcon,
    color: 'text-purple-500 border-purple-500',
  },
  {
    key: 'functionCall',
    label: 'Tool',
    icon: WrenchIcon,
    color: 'text-orange-500 border-orange-500',
  },
];

export function EditModelDialog({
  open,
  onOpenChange,
  model,
  isCustomModel: _isCustomModel,
  onSave,
}: EditModelDialogProps) {
  const t = useTranslations('Provider');
  const [displayName, setDisplayName] = useState('');
  const [abilities, setAbilities] = useState<ModelAbilities>({});
  const [supportsStreaming, setSupportsStreaming] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [inputPrice, setInputPrice] = useState('');
  const [outputPrice, setOutputPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize form when dialog opens or model changes
  useEffect(() => {
    if (open) {
      setDisplayName(model.displayName || '');
      setAbilities(model.abilities || {});
      setSupportsStreaming(model.supportsStreaming || false);
      setPriceCurrency(model.pricing?.currency || 'USD');
      setInputPrice(model.pricing?.input?.toString() || '');
      setOutputPrice(model.pricing?.output?.toString() || '');
    }
  }, [open, model]);

  const handleCopyModelId = useCallback(() => {
    navigator.clipboard.writeText(model.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [model.id]);

  const toggleAbility = useCallback((key: keyof ModelAbilities) => {
    setAbilities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);

      try {
        await onSave({
          displayName: displayName.trim() || undefined,
          abilities: Object.keys(abilities).length > 0 ? abilities : undefined,
          supportsStreaming,
          priceCurrency,
          inputPrice: inputPrice ? Number.parseFloat(inputPrice) : undefined,
          outputPrice: outputPrice ? Number.parseFloat(outputPrice) : undefined,
        });
        onOpenChange(false);
      } finally {
        setIsSaving(false);
      }
    },
    [
      displayName,
      abilities,
      supportsStreaming,
      priceCurrency,
      inputPrice,
      outputPrice,
      onSave,
      onOpenChange,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('edit_model_dialog.title')}</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Model Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('edit_model_dialog.model_information')}
              </h4>
              <div className="space-y-4">
                {/* Model ID (read-only) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="model-id">{t('edit_model_dialog.model_id')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircleIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('edit_model_dialog.model_id_tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="model-id"
                      value={model.id}
                      readOnly
                      className="flex-1 h-9 bg-muted/50 text-muted-foreground"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyModelId}
                      className="shrink-0 h-9 w-9"
                    >
                      <CopyIcon className={cn('h-4 w-4', copied && 'text-green-500')} />
                    </Button>
                  </div>
                </div>

                {/* Model Name */}
                <div className="space-y-2">
                  <Label htmlFor="model-name">{t('edit_model_dialog.display_name')}</Label>
                  <Input
                    id="model-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={model.displayName || model.id}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Capabilities Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('edit_model_dialog.capabilities')}
              </h4>
              <div className="space-y-4">
                {/* Model Types / Abilities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    <Label>{t('edit_model_dialog.model_types')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircleIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('edit_model_dialog.model_types_tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ABILITY_CONFIG.map(({ key, label, icon: Icon, color }) => {
                      const isActive = abilities[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleAbility(key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all',
                            isActive
                              ? `${color} bg-opacity-10`
                              : 'border-border text-muted-foreground hover:border-muted-foreground',
                          )}
                        >
                          <Icon className={cn('h-3.5 w-3.5', isActive && color.split(' ')[0])} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Support incremental text output */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="supports-streaming">
                      {t('edit_model_dialog.streaming_output')}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircleIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('edit_model_dialog.streaming_output_tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    id="supports-streaming"
                    checked={supportsStreaming}
                    onCheckedChange={setSupportsStreaming}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('edit_model_dialog.pricing')}
              </h4>
              <div className="space-y-4">
                {/* Currency */}
                <div className="flex items-center justify-between gap-4">
                  <Label>{t('edit_model_dialog.currency')}</Label>
                  <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="CNY">¥ CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Input Price */}
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="input-price">{t('edit_model_dialog.input_price')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="input-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-[180px] h-9 text-right"
                    />
                    <div className="w-[120px] px-3 py-1.5 text-sm text-muted-foreground border rounded-md bg-muted/50 whitespace-nowrap text-center">
                      {t('edit_model_dialog.per_million_tokens')}
                    </div>
                  </div>
                </div>

                {/* Output Price */}
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="output-price">{t('edit_model_dialog.output_price')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="output-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={outputPrice}
                      onChange={(e) => setOutputPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-[180px] h-9 text-right"
                    />
                    <div className="w-[120px] px-3 py-1.5 text-sm text-muted-foreground border rounded-md bg-muted/50 whitespace-nowrap text-center">
                      {t('edit_model_dialog.per_million_tokens')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('edit_model_dialog.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t('edit_model_dialog.saving')}
                </>
              ) : (
                t('edit_model_dialog.save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
