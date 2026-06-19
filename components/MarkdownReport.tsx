"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/components/ui/toast";

interface MarkdownReportProps {
  markdown: string;
}

export function MarkdownReport({ markdown }: MarkdownReportProps) {
  const { toast } = useToast();

  if (!markdown.trim()) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        분석 결과가 있으면 Markdown 리포트가 생성됩니다.
      </p>
    );
  }

  function handleDownload() {
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "logdoctor-report.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("리포트를 내려받았습니다", "success");
    } catch {
      toast("다운로드 실패", "error");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
          .md 다운로드
        </Button>
        <CopyButton value={markdown} label="리포트 복사" size="sm" message="리포트 복사됨" />
      </div>
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {markdown}
      </pre>
    </div>
  );
}
