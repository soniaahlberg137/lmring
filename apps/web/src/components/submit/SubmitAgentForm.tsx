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
import { CheckCircleIcon, PaperclipIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { AGENT_DOMAINS, type AgentDomain } from '@/libs/validation';

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

const DOMAIN_LABELS: Record<AgentDomain, string> = {
  coding: 'Coding',
  'customer-support': 'Customer Support',
  research: 'Research',
  finance: 'Finance',
  legal: 'Legal',
  general: 'General',
};

type FormFields = {
  name: string;
  description: string;
  baseModel: string;
  domain: AgentDomain;
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

const INITIAL_FORM: FormFields = {
  name: '',
  description: '',
  baseModel: '',
  domain: 'general',
  systemPrompt: '',
  tools: '',
  memoryConfig: '',
};

export function SubmitAgentForm() {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [configFile, setConfigFile] = useState<{
    name: string;
    sizeKb: number;
    content: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const setField =
    (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setConfigFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfigFile({
        name: file.name,
        sizeKb: Math.round((file.size / 1024) * 10) / 10,
        content: (ev.target?.result as string) ?? '',
      });
    };
    reader.readAsText(file);
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
        domain: form.domain,
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.systemPrompt.trim()) body.systemPrompt = form.systemPrompt.trim();
      if (form.tools.trim()) body.tools = JSON.parse(form.tools);
      if (form.memoryConfig.trim()) body.memoryConfig = JSON.parse(form.memoryConfig);
      if (configFile?.content) body.configContent = configFile.content;

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

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
    setForm(INITIAL_FORM);
    setConfigFile(null);
    setFieldErrors({});
    setApiError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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

          {/* Name */}
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

          {/* Base Model + Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <Label htmlFor="domain">{t('Submit.field_domain')}</Label>
              <Select
                value={form.domain}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, domain: val as AgentDomain }))
                }
              >
                <SelectTrigger id="domain">
                  <SelectValue placeholder={t('Submit.field_domain_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DOMAIN_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Config File Upload */}
          <div className="space-y-1.5">
            <Label htmlFor="configFile">{t('Submit.field_config_file')}</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <PaperclipIcon className="h-4 w-4 mr-2" />
                {configFile ? 'Change file' : 'Attach file'}
              </Button>
              {configFile && (
                <span className="text-xs text-muted-foreground truncate">
                  {t('Submit.field_config_file_selected', {
                    filename: configFile.name,
                    size: String(configFile.sizeKb),
                  })}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="configFile"
              type="file"
              accept=".json,.yaml,.yml,.txt,.md,.toml"
              className="sr-only"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">{t('Submit.field_config_file_hint')}</p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? t('Submit.button_submitting') : t('Submit.button_submit')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
