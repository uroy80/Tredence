import type { ApprovalNodeData, ApproverRole } from '@/types';
import { Field, Select, TextInput } from '@/components/ui/Field';
import type { NodeFormProps } from './NodeFormPanel';

const ROLES: ApproverRole[] = ['Manager', 'HRBP', 'Director', 'CEO'];

export function ApprovalNodeForm({
  data,
  onPatch,
}: NodeFormProps<ApprovalNodeData>) {
  const titleError = !data.title.trim() ? 'Title is required' : undefined;

  return (
    <div className="flex flex-col gap-3">
      <Field label="Title" required error={titleError}>
        <TextInput
          value={data.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="e.g., Manager Approval"
        />
      </Field>
      <Field label="Approver Role" required>
        <Select
          value={data.approverRole}
          onChange={(e) =>
            onPatch({ approverRole: e.target.value as ApproverRole })
          }
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Auto-Approve Threshold"
        hint="Requests with value at or below this number are auto-approved. 0 = manual approval only."
      >
        <TextInput
          type="number"
          min={0}
          step={1}
          value={data.autoApproveThreshold}
          onChange={(e) =>
            onPatch({
              autoApproveThreshold: Math.max(0, Number(e.target.value) || 0),
            })
          }
        />
      </Field>
    </div>
  );
}
