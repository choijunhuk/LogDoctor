import type { LogAnalysisResult } from "@/types/logAnalysis";
import { severityLabel } from "@/lib/analyzer";

/** Render a LogAnalysisResult as a copy-ready Markdown report. */
export function generateReport(result: LogAnalysisResult): string {
  const {
    category,
    primaryTech,
    severity,
    detectedErrors,
    causes,
    commands,
    recommendedSteps,
    stats,
  } = result;

  const lines: string[] = [];

  lines.push("# 로그 분석 리포트", "");

  lines.push("## 1. 감지된 환경", "");
  lines.push(`* 분류: ${category}`);
  lines.push(`* 주요 기술: ${primaryTech.length ? primaryTech.join(", ") : "미상"}`);
  lines.push(`* 에러 심각도: ${severityLabel(severity)}`);
  lines.push("");

  lines.push("## 2. 핵심 에러", "");
  if (detectedErrors.length === 0) {
    lines.push("핵심 에러가 감지되지 않았습니다.");
  } else {
    for (const e of detectedErrors.slice(0, 15)) {
      lines.push(`* (L${e.lineNumber}) **${e.type}** — ${e.message}`);
    }
    if (detectedErrors.length > 15) {
      lines.push(`* …외 ${detectedErrors.length - 15}개`);
    }
  }
  lines.push("");

  lines.push("## 3. 원인 후보", "");
  if (causes.length === 0) {
    lines.push("1. 룰 매칭이 없어 자동 원인 후보를 제시하지 못했습니다.");
  } else {
    causes.slice(0, 10).forEach((c, i) => lines.push(`${i + 1}. ${c.title}`));
  }
  lines.push("");

  lines.push("## 4. 먼저 확인할 것", "");
  const checks = recommendedSteps.slice(0, Math.max(3, recommendedSteps.length));
  checks.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");

  lines.push("## 5. 추천 명령어", "");
  lines.push("```bash");
  if (commands.length === 0) {
    lines.push("# 추천 명령어가 없습니다.");
  } else {
    for (const c of commands.slice(0, 20)) {
      lines.push(`# ${c.description}`);
      lines.push(c.command);
    }
  }
  lines.push("```", "");

  lines.push("## 6. 해결 절차", "");
  lines.push("1. 현재 실행 중인 프로세스 확인");
  lines.push("2. 설정 파일 확인");
  lines.push("3. 서버 재시작");
  lines.push("4. 로그 재확인");
  lines.push("");

  lines.push("## 7. 원본 로그 요약", "");
  if (detectedErrors.length === 0) {
    lines.push("> 중요한 로그 라인이 감지되지 않았습니다.");
  } else {
    lines.push("```log");
    for (const e of detectedErrors.slice(0, 12)) {
      lines.push(`L${e.lineNumber}: ${e.message}`);
    }
    lines.push("```");
  }
  lines.push("");
  lines.push(
    `> 통계 — 총 ${stats.lineCount}줄 / ${stats.charCount}자 / 감지된 에러 ${stats.errorCount}개 / 마스킹된 민감정보 ${stats.maskedCount}개`,
  );

  return lines.join("\n");
}
