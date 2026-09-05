import { create } from 'zustand';
import type { MoneyContextType } from '../context/MoneyContext';

export const useMoneyStore = create<MoneyContextType>(() => ({
  // Defaults will be populated and synced instantly by MoneyProvider
} as MoneyContextType));

// Selector helper
export function useMoneySelector<T>(selector: (state: MoneyContextType) => T): T {
  return useMoneyStore(selector);
}
