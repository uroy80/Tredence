import { useEffect, useMemo } from 'react';
import type { AutomatedNodeData } from '@/types';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { useAutomations } from '@/hooks/useAutomations';
import type { NodeFormProps } from './NodeFormPanel';

export function AutomatedNodeForm({
  data,
  onPatch,
}: NodeFormProps<AutomatedNodeData>) {
  const { automations, loading, error } = useAutomations();

  const selected = useMemo(
    () => automations?.find((a) => a.id === data.actionId) ?? null,
    [automations, data.actionId],
  );

  useEffect(() => {
    if (!selected) return;
    const next: Record<string, string> = {};
    for (const p of selected.params) {
      next[p] = data.actionParams[p] ?? '';
    }
    const keys = Object.keys(data.actionParams);
    const mismatch =
      keys.length !== selected.params.length ||
      keys.some((k) => !selected.params.includes(k));
    if (mismatch) onPatch({ actionParams: next });
  }, [selected, data.actionParams, onPatch]);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Title">
        <TextInput
          value={data.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="e.g., Send welcome email"
        />
      </Field>

      <Field
        label="Action"
        required
        error={!data.actionId ? 'Select an action' : undefined}
        hint={loading ? 'Loading actions from /automations...' : undefined}
      >
        {error ? (
          <div className="text-xs text-[var(--color-danger)]">
            Failed to load actions: {error}
          </div>
        ) : (
          <Select
            value={data.actionId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              const def = automations?.find((a) => a.id === id) ?? null;
              const params: Record<string, string> = {};
              if (def) for (const p of def.params) params[p] = '';
              onPatch({ actionId: id, actionParams: params });
            }}
            disabled={loading}
          >
            <option value="">— Select an action —</option>
            {automations?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {selected && (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Action Parameters
          </div>
          {selected.description && (
            <p className="text-[11px] text-[var(--color-muted)]">
              {selected.description}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {selected.params.map((p) => (
              <Field key={p} label={p} required>
                <TextInput
                  value={data.actionParams[p] ?? ''}
                  onChange={(e) =>
                    onPatch({
                      actionParams: {
                        ...data.actionParams,
                        [p]: e.target.value,
                      },
                    })
                  }
                  placeholder={`Enter ${p}`}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
