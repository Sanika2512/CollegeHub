"use client";

import { create } from "zustand";

type CompareState = {
  ids: string[];
  hydrate: (ids: string[]) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCompareStore = create<CompareState>((set, get) => ({
  ids: [],
  hydrate: (ids) => set({ ids: ids.slice(0, 3) }),
  toggle: (id) => {
    const ids = get().ids;
    const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id].slice(-3);
    localStorage.setItem("compareIds", next.join(","));
    set({ ids: next });
  },
  remove: (id) => {
    const next = get().ids.filter((item) => item !== id);
    localStorage.setItem("compareIds", next.join(","));
    set({ ids: next });
  },
  clear: () => {
    localStorage.removeItem("compareIds");
    set({ ids: [] });
  }
}));
