import type { TaskNodeData } from '@/types';
import { Field, TextArea, TextInput } from '@/components/ui/Field';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import type { NodeFormProps } from './NodeFormPanel';

export function TaskNodeForm({ data, onPatch }: NodeFormProps<TaskNodeData>) {
  const titleError = !data.title.trim() ? 'Title is required' : undefined;

  return (
    <div className="flex flex-col gap-3">
      <Field label="Title" required error={titleError}>
        <TextInput
          value={data.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="e.g., Collect onboarding documents"
        />
      </Field>
      <Field label="Description">
        <TextArea
          value={data.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          placeholder="What the assignee needs to do"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assignee">
          <TextInput
            value={data.assignee}
            onChange={(e) => onPatch({ assignee: e.target.value })}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Due Date">
          <TextInput
            type="date"
            value={data.dueDate}
            onChange={(e) => onPatch({ dueDate: e.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Custom Fields"
        hint="Attach task-specific data (e.g., form IDs, reference links)."
      >
        <KeyValueEditor
          items={data.customFields}
          onChange={(customFields) => onPatch({ customFields })}
          addLabel="Add custom field"
        />
      </Field>
    </div>
  );
}
