import { useEffect, useRef } from 'react';

export type Hotkey = string;

export interface HotkeyHandler {
  keys: Hotkey | Hotkey[];
  handler: (e: KeyboardEvent) => void;
  description?: string;
  allowInInputs?: boolean;
}

const isMac =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform);

function normalizeToken(part: string): string {
  const p = part.trim().toLowerCase();
  if (p === 'mod') return isMac ? 'meta' : 'ctrl';
  if (p === 'cmd') return 'meta';
  if (p === 'option' || p === 'opt') return 'alt';
  return p;
}

function parseCombo(combo: Hotkey): {
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
} {
  const parts = combo.split('+').map(normalizeToken);
  const modifiers = {
    meta: parts.includes('meta'),
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
  };
  const key = parts.find(
    (p) => p !== 'meta' && p !== 'ctrl' && p !== 'alt' && p !== 'shift',
  );
  return { ...modifiers, key: key ?? '' };
}

function matches(combo: Hotkey, e: KeyboardEvent): boolean {
  const spec = parseCombo(combo);
  if (spec.meta !== e.metaKey) return false;
  if (spec.ctrl !== e.ctrlKey) return false;
  if (spec.alt !== e.altKey) return false;
  if (spec.shift !== e.shiftKey) return false;
  return spec.key === e.key.toLowerCase();
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useHotkeys(handlers: HotkeyHandler[]): void {
  const ref = useRef(handlers);

  useEffect(() => {
    ref.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inEditable = isEditable(e.target);
      for (const entry of ref.current) {
        if (inEditable && !entry.allowInInputs) continue;
        const keys = Array.isArray(entry.keys) ? entry.keys : [entry.keys];
        if (keys.some((k) => matches(k, e))) {
          entry.handler(e);
          return;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

export const hotkeyLabel = (combo: Hotkey): string => {
  const parts = combo.split('+').map(normalizeToken);
  const order = ['meta', 'ctrl', 'alt', 'shift'];
  const pretty: Record<string, string> = isMac
    ? { meta: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧' }
    : { meta: 'Win', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift' };
  const mods = order.filter((m) => parts.includes(m)).map((m) => pretty[m]);
  const key = parts.find((p) => !order.includes(p));
  return [...mods, key?.toUpperCase()].filter(Boolean).join(isMac ? '' : '+');
};
