import type { StartNodeData } from '@/types';
import { Field, TextInput } from '@/components/ui/Field';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import type { NodeFormProps } from './NodeFormPanel';

export function StartNodeForm({ data, onPatch }: NodeFormProps<StartNodeData>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Start Title">
        <TextInput
          value={data.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="Workflow Start"
        />
      </Field>
      <Field label="Metadata" hint="Arbitrary key-value pairs attached to the workflow.">
        <KeyValueEditor
          items={data.metadata}
          onChange={(metadata) => onPatch({ metadata })}
          addLabel="Add metadata"
        />
      </Field>
    </div>
  );
}
