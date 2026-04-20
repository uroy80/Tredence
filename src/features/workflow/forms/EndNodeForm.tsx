import type { EndNodeData } from '@/types';
import { Checkbox, Field, TextInput } from '@/components/ui/Field';
import type { NodeFormProps } from './NodeFormPanel';

export function EndNodeForm({ data, onPatch }: NodeFormProps<EndNodeData>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="End Message">
        <TextInput
          value={data.message}
          onChange={(e) => onPatch({ message: e.target.value })}
          placeholder="Workflow complete"
        />
      </Field>
      <Checkbox
        label="Emit summary report at completion"
        checked={data.summary}
        onChange={(v) => onPatch({ summary: v })}
      />
    </div>
  );
}
