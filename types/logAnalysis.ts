// Core domain types for LogDoctor.
// Keep these strict — `any` is avoided across the codebase.

export type LogCategory =
  | "Spring Boot"
  | "Node.js / Express"
  | "Docker"
  | "Docker Compose"
  | "Nginx"
  | "MySQL"
  | "Redis"
  | "Git / GitHub Actions"
  | "Linux / Ubuntu"
  | "Network / Port"
  | "Unknown";

export type Severity = "low" | "medium" | "high" | "critical";

/** A single important error line extracted from the raw log. */
export interface DetectedError {
  id: string;
  /** Human-readable label of the detected error type, e.g. "BeanCreationException". */
  type: string;
  /** The core error message (already masked). */
  message: string;
  /** Estimated 1-based line number where it occurred. */
  lineNumber: number;
  /** Surrounding raw log lines for context (already masked). */
  context: string[];
  severity: Severity;
}

/** A possible root cause suggested by the rule engine. */
export interface CauseCandidate {
  id: string;
  title: string;
  detail?: string;
}

/** A shell command suggested for diagnosis or remediation. */
export interface SuggestedCommand {
  id: string;
  command: string;
  description: string;
  category: LogCategory;
}

/**
 * A single analysis rule. The analyzer iterates every rule against the log,
 * counts matches, and aggregates the metadata of the matched rules.
 */
export interface AnalysisRule {
  id: string;
  category: LogCategory;
  keywords: string[];
  regexPatterns: RegExp[];
  severity: Severity;
  title: string;
  description: string;
  possibleCauses: string[];
  suggestedCommands: { command: string; description: string }[];
  recommendedSteps: string[];
}

export interface LogStats {
  lineCount: number;
  charCount: number;
  errorCount: number;
  maskedCount: number;
}

/** The full result of analyzing one log blob. */
export interface LogAnalysisResult {
  category: LogCategory;
  categoryScores: Partial<Record<LogCategory, number>>;
  severity: Severity;
  detectedErrors: DetectedError[];
  causes: CauseCandidate[];
  commands: SuggestedCommand[];
  recommendedSteps: string[];
  matchedRuleTitles: string[];
  primaryTech: string[];
  stats: LogStats;
  /** The masked version of the input log (safe to render / persist). */
  maskedLog: string;
  createdAt: number;
}

/** A stored analysis entry kept in localStorage (max 10). */
export interface SavedAnalysis {
  id: string;
  title: string;
  createdAt: number;
  /** Masked log only — raw secrets are never persisted. */
  maskedLog: string;
  result: LogAnalysisResult;
}
