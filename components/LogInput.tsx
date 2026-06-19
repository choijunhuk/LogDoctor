"use client";

import * as React from "react";
import { Eraser, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleLogSelector } from "@/components/SampleLogSelector";
import { useToast } from "@/components/ui/toast";
import type { LogStats } from "@/types/logAnalysis";

interface LogInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onLoadSample: (log: string, label: string) => void;
  stats: LogStats | null;
  charCount: number;
  lineCount: number;
}

const MAX_CHARS = 500_000;

export function LogInput({
  value,
  onChange,
  onClear,
  onLoadSample,
  stats,
  charCount,
  lineCount,
}: LogInputProps) {
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const okExt = /\.(log|txt)$/i.test(file.name);
    if (!okExt) {
      toast(".log 또는 .txt 파일만 지원합니다", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").slice(0, MAX_CHARS);
      onChange(text);
      toast(`${file.name} 불러옴`, "success");
    };
    reader.onerror = () => toast("파일을 읽지 못했습니다", "error");
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>로그 입력</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <SampleLogSelector onSelect={onLoadSample} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            파일
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={!value}>
            <Eraser className="h-3.5 w-3.5" />
            초기화
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".log,.txt,text/plain"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="여기에 서버 에러 로그를 붙여넣으세요. (Spring Boot, Node.js, Docker, Nginx, MySQL, Redis, GitHub Actions, Linux …)"
          spellCheck={false}
          className="min-h-[340px] flex-1 text-xs leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>{lineCount.toLocaleString()} 줄</span>
          <span>{charCount.toLocaleString()} 자</span>
          <span className="text-orange-300">
            감지된 에러 {stats ? stats.errorCount.toLocaleString() : 0} 개
          </span>
          {stats && stats.maskedCount > 0 ? (
            <span className="text-emerald-300">마스킹 {stats.maskedCount} 건</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
