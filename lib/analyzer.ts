import type {
  AnalysisRule,
  CauseCandidate,
  DetectedError,
  LogAnalysisResult,
  LogCategory,
  Severity,
  SuggestedCommand,
} from "@/types/logAnalysis";
import { maskSensitive } from "@/lib/maskSensitive";
import { COMMON_COMMANDS, RULES, SEVERITY_KEYWORDS } from "@/lib/rules";

// Priority patterns that mark a log line as an "important error line" worth
// surfacing in the Errors tab.
const ERROR_LINE_PATTERNS: RegExp[] = [
  /\bERROR\b/,
  /\bException\b/,
  /Caused by/i,
  /\bFailed\b/i,
  /\bfatal\b/i,
  /\bdenied\b/i,
  /\brefused\b/i,
  /\btimeout\b/i,
  /not found/i,
  /already in use/i,
  /\bCannot\b/i,
  /\bunhealthy\b/i,
  /exit code [1-9]/i,
];

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Classify a single line's severity from keyword heuristics. */
function classifyLineSeverity(line: string): Severity {
  const lower = line.toLowerCase();
  for (const { severity, keywords } of SEVERITY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) return severity;
  }
  return "low";
}

/** Count how strongly a rule matches the (lower-cased) log. */
function scoreRule(rule: AnalysisRule, log: string, lowerLog: string): number {
  let score = 0;
  for (const kw of rule.keywords) {
    const needle = kw.toLowerCase();
    let idx = lowerLog.indexOf(needle);
    while (idx !== -1) {
      score += 1;
      idx = lowerLog.indexOf(needle, idx + needle.length);
    }
  }
  for (const re of rule.regexPatterns) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    const global = new RegExp(re.source, flags);
    const matches = log.match(global);
    if (matches) score += matches.length;
  }
  return score;
}

/** Pull an error-type label out of a line (exception class name, or a keyword). */
function extractErrorType(line: string): string {
  const exc = line.match(/([A-Z][A-Za-z0-9]*(?:Exception|Error))\b/);
  if (exc) return exc[1];
  const http = line.match(/\b(50\d|40\d)\b/);
  if (http) return `HTTP ${http[1]}`;
  for (const re of ERROR_LINE_PATTERNS) {
    const m = line.match(re);
    if (m) return m[0].trim();
  }
  return "Error";
}

/** Trim a long line so a single token cannot blow up the UI. */
function clip(line: string, max = 400): string {
  return line.length > max ? line.slice(0, max) + " …" : line;
}

const MAX_DETECTED = 100;

export function analyzeLog(rawInput: string): LogAnalysisResult {
  const { masked, count: maskedCount } = maskSensitive(rawInput);
  const log = masked;
  const lowerLog = log.toLowerCase();
  const lines = log.split(/\r?\n/);

  // ---- 1. Score every rule, accumulate per-category scores. -----------------
  const categoryScores: Partial<Record<LogCategory, number>> = {};
  const matched: { rule: AnalysisRule; score: number }[] = [];

  for (const rule of RULES) {
    const score = scoreRule(rule, log, lowerLog);
    if (score > 0) {
      matched.push({ rule, score });
      categoryScores[rule.category] = (categoryScores[rule.category] ?? 0) + score;
    }
  }
  matched.sort((a, b) => b.score - a.score);

  // ---- 2. Representative category (most matched). ---------------------------
  let category: LogCategory = "Unknown";
  let best = 0;
  for (const [cat, sc] of Object.entries(categoryScores)) {
    if ((sc ?? 0) > best) {
      best = sc ?? 0;
      category = cat as LogCategory;
    }
  }

  // ---- 3. Extract important error lines. ------------------------------------
  const detectedErrors: DetectedError[] = [];
  let totalErrorLines = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (!ERROR_LINE_PATTERNS.some((re) => re.test(line))) continue;
    totalErrorLines++;
    if (detectedErrors.length >= MAX_DETECTED) continue;

    const context = [lines[i - 1], lines[i], lines[i + 1]]
      .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
      .map((l) => clip(l, 300));

    detectedErrors.push({
      id: `err-${i}`,
      type: extractErrorType(line),
      message: clip(line.trim()),
      lineNumber: i + 1,
      context,
      severity: classifyLineSeverity(line),
    });
  }

  // ---- 4. Overall severity. -------------------------------------------------
  let severity: Severity = "low";
  for (const { rule } of matched) severity = maxSeverity(severity, rule.severity);
  for (const e of detectedErrors) severity = maxSeverity(severity, e.severity);

  // ---- 5. Aggregate causes (deduped, ordered by rule score). ---------------
  const causes: CauseCandidate[] = [];
  const seenCause = new Set<string>();
  for (const { rule } of matched) {
    for (const c of rule.possibleCauses) {
      const key = c.toLowerCase();
      if (seenCause.has(key)) continue;
      seenCause.add(key);
      causes.push({ id: `cause-${causes.length}`, title: c, detail: rule.title });
    }
  }

  // ---- 6. Aggregate commands (rule commands + category defaults). ----------
  const commands: SuggestedCommand[] = [];
  const seenCmd = new Set<string>();
  const pushCmd = (
    cmd: { command: string; description: string },
    cat: LogCategory,
  ) => {
    const key = cmd.command.trim();
    if (seenCmd.has(key)) return;
    seenCmd.add(key);
    commands.push({
      id: `cmd-${commands.length}`,
      command: cmd.command,
      description: cmd.description,
      category: cat,
    });
  };
  for (const { rule } of matched) {
    for (const c of rule.suggestedCommands) pushCmd(c, rule.category);
  }
  // Category default commands, representative category first.
  const catsForCommands = Array.from(
    new Set<LogCategory>([category, ...matched.map((m) => m.rule.category)]),
  );
  for (const cat of catsForCommands) {
    for (const c of COMMON_COMMANDS[cat] ?? []) pushCmd(c, cat);
  }

  // ---- 7. Recommended steps (top rule, else generic). ----------------------
  const recommendedSteps =
    matched[0]?.rule.recommendedSteps ?? [
      "Identify the first error in the log (top of the stack trace).",
      "Check whether the related service/process is running.",
      "Inspect the relevant configuration files.",
      "Restart the service and re-read the log.",
    ];

  const matchedRuleTitles = matched.map((m) => m.rule.title);
  const primaryTech = catsForCommands.filter((c) => c !== "Unknown");

  return {
    category,
    categoryScores,
    severity,
    detectedErrors,
    causes,
    commands,
    recommendedSteps,
    matchedRuleTitles,
    primaryTech,
    stats: {
      lineCount: lines.length,
      charCount: rawInput.length,
      errorCount: totalErrorLines,
      maskedCount,
    },
    maskedLog: log,
    createdAt: Date.now(),
  };
}

const SEVERITY_LABEL_KO: Record<Severity, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "치명적",
};

export function severityLabel(s: Severity): string {
  return SEVERITY_LABEL_KO[s];
}

/** Build a short auto-title for the recent-analyses list. */
export function autoTitle(result: LogAnalysisResult): string {
  const base = result.category === "Unknown" ? "로그" : result.category;
  const top = result.detectedErrors[0]?.type;
  if (top && top !== "Error") return `${base} ${top} 분석`;
  if (result.matchedRuleTitles[0]) return `${base} · ${result.matchedRuleTitles[0]}`;
  return `${base} 분석`;
}
