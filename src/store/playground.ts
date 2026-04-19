import { create } from "zustand";
import { PRESETS } from "@/data/presets";

export interface SessionState {
  presetId: string;
  question: string;
  askedQuestionId: string | null; // id of preset question if matched
  customAnswered: boolean; // true if a custom (non-preset) answer was generated
  customAnswer: string | null;
  showLabels: boolean;
  retrievedOnly: boolean;
  notesByPreset: Record<string, string>;
  recentQuestions: string[];
  liveLLM: boolean;
}

const STORAGE_KEY = "grag.session.v1";

const initial: SessionState = {
  presetId: PRESETS[0].id,
  question: "",
  askedQuestionId: null,
  customAnswered: false,
  customAnswer: null,
  showLabels: true,
  retrievedOnly: false,
  notesByPreset: {},
  recentQuestions: [],
  liveLLM: false,
};

function loadInitial(): SessionState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

interface Store {
  past: SessionState[];
  present: SessionState;
  future: SessionState[];
  apply: (next: Partial<SessionState>, options?: { trackHistory?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  hydrate: () => void;
}

export const usePlayground = create<Store>((set, get) => ({
  past: [],
  present: initial,
  future: [],
  hydrate: () => {
    const loaded = loadInitial();
    set({ present: loaded, past: [], future: [] });
  },
  apply: (patch, options = { trackHistory: true }) => {
    const { present, past } = get();
    const next: SessionState = { ...present, ...patch };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
    }
    if (options.trackHistory === false) {
      set({ present: next });
    } else {
      set({ past: [...past, present].slice(-50), present: next, future: [] });
    }
  },
  undo: () => {
    const { past, present, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      present: prev,
      future: [present, ...future].slice(0, 50),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
    }
  },
  redo: () => {
    const { past, present, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, present].slice(-50),
      present: next,
      future: future.slice(1),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  },
  reset: () => {
    set({ past: [], present: initial, future: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

// Theme
const THEME_KEY = "grag.theme";
export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
}
export function setStoredTheme(t: "light" | "dark") {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  if (t === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
