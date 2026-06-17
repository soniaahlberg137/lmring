'use client';

import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@lmring/ui';
import { CheckCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';

const BASE_MODELS = [
  { group: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1'] },
  {
    group: 'Anthropic',
    models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'],
  },
  { group: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'] },
  { group: 'DeepSeek', models: ['deepseek-v3', 'deepseek-r1'] },
  { group: 'Meta', models: ['llama-3.3-70b-instruct', 'llama-3.1-405b-instruct'] },
] as const;

type FormFields = {
  name: string;
  description: string;
  baseModel: string;
  systemPrompt: string;
  tools: string;
  memoryConfig: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function SuccessCard({ onReset, agentName }: { onReset: () => void; agentName: string }) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center text-center gap-4 py-12">
        <CheckCircleIcon className="h-12 w-12 text-green-500" />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{t('Submit.success_title')}</h2>
          <p className="text-muted-foreground text-sm max-w-md">{t('Submit.success_body')}</p>
          <p className="text-xs text-muted-foreground font-mono pt-1">{agentName}</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          {t('Submit.success_submit_another')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SubmitAgentForm() {
  const t = useTranslations();

  const [form, setForm] = useState<FormFields>({
    name: '',
    description: '',
    baseModel: '',
    systemPrompt: '',
    tools: '',
    memoryConfig: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const setField =
    (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = t('Submit.error_required');
    if (!form.baseModel) errors.baseModel = t('Submit.error_required');
    if (form.tools.trim()) {
      try {
        JSON.parse(form.tools);
      } catch {
        errors.tools = t('Submit.error_invalid_json');
      }
    }
    if (form.memoryConfig.trim()) {
      try {
        JSON.parse(form.memoryConfig);
      } catch {
        errors.memoryConfig = t('Submit.error_invalid_json');
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        baseModel: form.baseModel,
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.systemPrompt.trim()) body.systemPrompt = form.systemPrompt.trim();
      if (form.tools.trim()) body.tools = JSON.parse(form.tools);
      if (form.memoryConfig.trim()) body.memoryConfig = JSON.parse(form.memoryConfig);

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        setApiError(t('Submit.error_sign_in'));
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setApiError((data as { error?: string }).error ?? t('Submit.error_generic'));
        return;
      }

      setSubmittedName(form.name.trim());
    } catch {
      setApiError(t('Submit.error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedName(null);
    setForm({
      name: '',
      description: '',
      baseModel: '',
      systemPrompt: '',
      tools: '',
      memoryConfig: '',
    });
    setFieldErrors({});
    setApiError('');
  };

  if (submittedName) {
    return <SuccessCard agentName={submittedName} onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {apiError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {apiError}
            </div>
          )}

          {/* Name + Base Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {t('Submit.field_name')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={setField('name')}
                placeholder={t('Submit.field_name_placeholder')}
                aria-invalid={!!fieldErrors.name}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="baseModel">
                {t('Submit.field_base_model')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={form.baseModel}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, baseModel: val }));
                  if (fieldErrors.baseModel)
                    setFieldErrors((prev) => ({ ...prev, baseModel: undefined }));
                }}
              >
                <SelectTrigger id="baseModel" aria-invalid={!!fieldErrors.baseModel}>
                  <SelectValue placeholder={t('Submit.field_base_model_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {BASE_MODELS.map(({ group, models }) => (
                    <div key={group}>
                      <p className="px-2 py-1 text-xs text-muted-foreground font-medium">{group}</p>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.baseModel} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">{t('Submit.field_description')}</Label>
            <Input
              id="description"
              value={form.description}
              onChange={setField('description')}
              placeholder={t('Submit.field_description_placeholder')}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-1.5">
            <Label htmlFor="systemPrompt">{t('Submit.field_system_prompt')}</Label>
            <Textarea
              id="systemPrompt"
              value={form.systemPrompt}
              onChange={setField('systemPrompt')}
              placeholder={t('Submit.field_system_prompt_placeholder')}
              rows={5}
              className="font-mono text-sm resize-y"
            />
          </div>

          {/* Tools + Memory Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tools">{t('Submit.field_tools')}</Label>
              <Textarea
                id="tools"
                value={form.tools}
                onChange={setField('tools')}
                placeholder={'[{"name": "filesystem", "type": "mcp"}]'}
                rows={5}
                className="font-mono text-sm resize-y"
                aria-invalid={!!fieldErrors.tools}
              />
              <p className="text-xs text-muted-foreground">{t('Submit.field_tools_hint')}</p>
              <FieldError message={fieldErrors.tools} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memoryConfig">{t('Submit.field_memory_config')}</Label>
              <Textarea
                id="memoryConfig"
                value={form.memoryConfig}
                onChange={setField('memoryConfig')}
                placeholder={'{"type": "short_term", "provider": "in-memory"}'}
                rows={5}
                className="font-mono text-sm resize-y"
                aria-invalid={!!fieldErrors.memoryConfig}
              />
              <p className="text-xs text-muted-foreground">
                {t('Submit.field_memory_config_hint')}
              </p>
              <FieldError message={fieldErrors.memoryConfig} />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? t('Submit.button_submitting') : t('Submit.button_submit')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
