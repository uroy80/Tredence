import type { AutomationDefinition } from '@/types';

const AUTOMATIONS: AutomationDefinition[] = [
  {
    id: 'send_email',
    label: 'Send Email',
    description: 'Dispatch an email to the provided recipient.',
    params: ['to', 'subject', 'body'],
  },
  {
    id: 'generate_doc',
    label: 'Generate Document',
    description: 'Generate a document from a template.',
    params: ['template', 'recipient'],
  },
  {
    id: 'create_ticket',
    label: 'Create Ticket',
    description: 'Open a ticket in the ITSM queue.',
    params: ['queue', 'priority', 'summary'],
  },
  {
    id: 'provision_account',
    label: 'Provision Account',
    description: 'Provision the user account in the target system.',
    params: ['system', 'role'],
  },
  {
    id: 'post_slack',
    label: 'Post to Slack',
    description: 'Send a message to a Slack channel.',
    params: ['channel', 'message'],
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchAutomations(): Promise<AutomationDefinition[]> {
  await delay(180);
  return structuredClone(AUTOMATIONS);
}

export function findAutomation(
  id: string | null | undefined,
): AutomationDefinition | null {
  if (!id) return null;
  return AUTOMATIONS.find((a) => a.id === id) ?? null;
}
