"use client";

import { Activity, AlertTriangle, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { severityLabel } from "@/lib/analyzer";
import type { LogAnalysisResult } from "@/types/logAnalysis";

interface AnalysisSummaryProps {
  result: LogAnalysisResult | null;
  onSave: () => void;
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function AnalysisSummary({ result, onSave }: AnalysisSummaryProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>분석 요약</CardTitle>
        <Button variant="secondary" size="sm" onClick={onSave} disabled={!result}>
          기록 저장
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {!result ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Activity className="h-7 w-7 opacity-40" />
            <p>로그를 입력하면 자동으로 분석 요약이 표시됩니다.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{result.category}</Badge>
              <Badge variant={result.severity}>심각도: {severityLabel(result.severity)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="핵심 에러"
                value={`${result.stats.errorCount}개`}
              />
              <Stat
                icon={<Terminal className="h-3.5 w-3.5" />}
                label="추천 명령어"
                value={`${result.commands.length}개`}
              />
              <Stat
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="마스킹된 민감정보"
                value={`${result.stats.maskedCount}건`}
              />
              <Stat
                icon={<Activity className="h-3.5 w-3.5" />}
                label="원인 후보"
                value={`${result.causes.length}개`}
              />
            </div>

            {result.primaryTech.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[11px] text-muted-foreground">감지된 기술</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.primaryTech.map((t) => (
                    <Badge key={t} variant="muted">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto rounded-md border border-dashed border-border bg-background/30 p-3 text-[11px] text-muted-foreground">
              AI 분석은 추후 연결 가능 — 현재는 외부 API 없이 룰 기반 분석으로 동작합니다.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
