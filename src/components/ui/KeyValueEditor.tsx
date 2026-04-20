import { nanoid } from 'nanoid';
import type { KeyValuePair } from '@/types';
import { Button } from './Button';
import { TextInput } from './Field';
import { PlusIcon, TrashIcon } from '@/components/icons';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  addLabel = 'Add field',
}: KeyValueEditorProps) {
  const update = (id: string, patch: Partial<KeyValuePair>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };
  const add = () => {
    onChange([...items, { id: nanoid(6), key: '', value: '' }]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {items.length === 0 && (
        <div className="rounded border border-dashed border-[var(--color-border)] px-2.5 py-2 text-center text-[11px] text-[var(--color-muted)]">
          No fields yet
        </div>
      )}
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-1.5">
          <TextInput
            value={it.key}
            placeholder={keyPlaceholder}
            onChange={(e) => update(it.id, { key: e.target.value })}
            className="flex-1"
          />
          <TextInput
            value={it.value}
            placeholder={valuePlaceholder}
            onChange={(e) => update(it.id, { value: e.target.value })}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(it.id)}
            aria-label="Remove field"
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={add}
        icon={<PlusIcon />}
      >
        {addLabel}
      </Button>
    </div>
  );
}
