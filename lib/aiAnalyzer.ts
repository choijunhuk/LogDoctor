import type { LogAnalysisResult } from "@/types/logAnalysis";

// =============================================================================
// OPTIONAL AI analyzer — structure only. The MVP works fully WITHOUT this.
//
// LogDoctor is rule-based first. This module exists so an AI layer can be wired
// in later without touching the rest of the app. If neither OPENAI_API_KEY nor
// GEMINI_API_KEY is configured, `isAiAvailable()` returns false and the UI shows
// "AI 분석은 추후 연결 가능". Nothing here runs in the browser by default.
// =============================================================================

export interface AiEnhancement {
  summary: string;
  extraCauses: string[];
  confidence: number;
}

/** Whether an AI provider key is present (server-side env only). */
export function isAiAvailable(): boolean {
  if (typeof process === "undefined") return false;
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
}

/**
 * Placeholder for a future AI pass that refines the rule-based result.
 * Intentionally returns null until a provider is wired up, so callers always
 * have a safe rule-based fallback.
 */
export async function enhanceWithAI(
  _maskedLog: string,
  _ruleResult: LogAnalysisResult,
): Promise<AiEnhancement | null> {
  if (!isAiAvailable()) return null;

  // Future implementation outline (kept as a comment, not executed):
  //   const provider = process.env.OPENAI_API_KEY ? "openai" : "gemini";
  //   const prompt = buildPrompt(_maskedLog, _ruleResult);
  //   const response = await callProvider(provider, prompt);
  //   return parseEnhancement(response);
  return null;
}
