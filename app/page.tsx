"use client";

import * as React from "react";
import { Stethoscope } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LogInput } from "@/components/LogInput";
import { AnalysisSummary } from "@/components/AnalysisSummary";
import { ErrorList } from "@/components/ErrorList";
import { CauseList } from "@/components/CauseList";
import { CommandList } from "@/components/CommandList";
import { MarkdownReport } from "@/components/MarkdownReport";
import { RecentAnalyses } from "@/components/RecentAnalyses";
import { useToast } from "@/components/ui/toast";
import { analyzeLog } from "@/lib/analyzer";
import { generateReport } from "@/lib/reportGenerator";
import { clearAll, deleteAnalysis, loadRecent, saveAnalysis } from "@/lib/storage";
import type { SavedAnalysis } from "@/types/logAnalysis";

export default function HomePage() {
  const { toast } = useToast();
  const [input, setInput] = React.useState("");
  const [recent, setRecent] = React.useState<SavedAnalysis[]>([]);
  const [tab, setTab] = React.useState("errors");

  // Load persisted history once, on the client only.
  React.useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Live, synchronous analysis as the user types/pastes.
  const result = React.useMemo(
    () => (input.trim() ? analyzeLog(input) : null),
    [input],
  );

  const report = React.useMemo(
    () => (result ? generateReport(result) : ""),
    [result],
  );

  const lineCount = React.useMemo(
    () => (input ? input.split(/\r?\n/).length : 0),
    [input],
  );

  const handleSave = React.useCallback(() => {
    if (!result) return;
    setRecent(saveAnalysis(result));
    toast("분석 기록을 저장했습니다", "success");
  }, [result, toast]);

  const handleLoadSample = React.useCallback(
    (log: string, label: string) => {
      setInput(log);
      toast(`${label} 불러옴`, "success");
    },
    [toast],
  );

  const handleLoadRecent = React.useCallback((item: SavedAnalysis) => {
    setInput(item.maskedLog);
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
            <Stethoscope className="h-5 w-5 text-primary" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">LogDoctor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          서버 로그를 붙여넣으면 원인 후보와 해결 절차를 정리해주는 개발자 도구. 룰 기반 분석 ·
          민감정보 자동 마스킹.
        </p>
      </header>

      {/* Main layout: input (left) + summary (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <LogInput
          value={input}
          onChange={setInput}
          onClear={() => setInput("")}
          onLoadSample={handleLoadSample}
          stats={result ? result.stats : null}
          charCount={input.length}
          lineCount={lineCount}
        />
        <AnalysisSummary result={result} onSave={handleSave} />
      </div>

      {/* Tabbed analysis detail */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="errors">핵심 에러</TabsTrigger>
              <TabsTrigger value="causes">원인 후보</TabsTrigger>
              <TabsTrigger value="commands">추천 명령어</TabsTrigger>
              <TabsTrigger value="report">Markdown 리포트</TabsTrigger>
              <TabsTrigger value="recent">최근 분석 기록</TabsTrigger>
            </TabsList>

            <TabsContent value="errors">
              <ErrorList errors={result?.detectedErrors ?? []} />
            </TabsContent>
            <TabsContent value="causes">
              <CauseList
                causes={result?.causes ?? []}
                steps={result?.recommendedSteps ?? []}
              />
            </TabsContent>
            <TabsContent value="commands">
              <CommandList commands={result?.commands ?? []} />
            </TabsContent>
            <TabsContent value="report">
              <MarkdownReport markdown={report} />
            </TabsContent>
            <TabsContent value="recent">
              <RecentAnalyses
                items={recent}
                onLoad={handleLoadRecent}
                onDelete={(id) => setRecent(deleteAnalysis(id))}
                onClearAll={() => setRecent(clearAll())}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-[11px] text-muted-foreground">
        LogDoctor — 로컬에서만 동작하며, 입력 로그는 서버로 전송되지 않습니다. 기록은 브라우저
        localStorage에 마스킹된 형태로만 저장됩니다.
      </footer>
    </main>
  );
}
