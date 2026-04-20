import { useEffect, useState } from 'react';
import { fetchAutomations } from '@/api';
import type { AutomationDefinition } from '@/types';

interface State {
  automations: AutomationDefinition[] | null;
  loading: boolean;
  error: string | null;
}

let cache: AutomationDefinition[] | null = null;
let inflight: Promise<AutomationDefinition[]> | null = null;

export function useAutomations(): State {
  const [automations, setAutomations] = useState<AutomationDefinition[] | null>(
    cache,
  );
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    if (!inflight) inflight = fetchAutomations();
    inflight
      .then((data) => {
        cache = data;
        if (!cancelled) {
          setAutomations(data);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      })
      .finally(() => {
        inflight = null;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { automations, loading, error };
}
