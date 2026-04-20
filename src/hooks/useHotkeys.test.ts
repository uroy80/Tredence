import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkeys } from './useHotkeys';

function fireKey(init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { ...init, bubbles: true });
  document.dispatchEvent(event);
  return event;
}

describe('useHotkeys', () => {
  it('fires handlers when the combo matches', () => {
    const handler = vi.fn();
    renderHook(() => useHotkeys([{ keys: ['meta+z', 'ctrl+z'], handler }]));
    fireKey({ key: 'z', metaKey: true });
    fireKey({ key: 'z', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('ignores shortcuts while typing in inputs by default', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() => useHotkeys([{ keys: 'meta+z', handler }]));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('respects allowInInputs override', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() =>
      useHotkeys([{ keys: 'meta+s', handler, allowInInputs: true }]),
    );

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it('distinguishes shift+modifier variants', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() =>
      useHotkeys([
        { keys: 'meta+z', handler: undo },
        { keys: 'meta+shift+z', handler: redo },
      ]),
    );
    fireKey({ key: 'z', metaKey: true });
    fireKey({ key: 'z', metaKey: true, shiftKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(1);
  });
});
