import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

interface ConfirmState {
  active: ActiveConfirm | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  active: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({ active: { ...options, resolve } });
    }),
  resolve: (result) => {
    const active = get().active;
    if (!active) return;
    active.resolve(result);
    set({ active: null });
  },
}));

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().request(options);
