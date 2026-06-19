import type { LogAnalysisResult, SavedAnalysis } from "@/types/logAnalysis";
import { autoTitle } from "@/lib/analyzer";

// Persistence for recent analyses. Browser-only: every access guards `window`
// so the module is import-safe during SSR / build.

const STORAGE_KEY = "logdoctor:recent";
const MAX_ENTRIES = 10;

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadRecent(): SavedAnalysis[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedAnalysis[];
  } catch {
    return [];
  }
}

function persist(entries: SavedAnalysis[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or serialization failure — fail silently, recent history is non-critical.
  }
}

/**
 * Save a new analysis to the front of the list. Only the MASKED log is stored —
 * raw secrets never reach localStorage. Returns the updated list.
 */
export function saveAnalysis(result: LogAnalysisResult): SavedAnalysis[] {
  const entry: SavedAnalysis = {
    id: `${result.createdAt}-${Math.floor(result.stats.charCount % 100000)}`,
    title: autoTitle(result),
    createdAt: result.createdAt,
    maskedLog: result.maskedLog,
    result,
  };
  const next = [entry, ...loadRecent()].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

export function deleteAnalysis(id: string): SavedAnalysis[] {
  const next = loadRecent().filter((e) => e.id !== id);
  persist(next);
  return next;
}

export function clearAll(): SavedAnalysis[] {
  persist([]);
  return [];
}
