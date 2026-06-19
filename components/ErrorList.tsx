"use client";

import { Badge } from "@/components/ui/badge";
import { severityLabel } from "@/lib/analyzer";
import type { DetectedError } from "@/types/logAnalysis";

interface ErrorListProps {
  errors: DetectedError[];
}

export function ErrorList({ errors }: ErrorListProps) {
  if (errors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        감지된 핵심 에러가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {errors.map((e) => (
        <li key={e.id} className="rounded-md border border-border bg-background/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={e.severity}>{severityLabel(e.severity)}</Badge>
            <span className="font-mono text-xs font-semibold text-orange-300">{e.type}</span>
            <span className="text-[11px] text-muted-foreground">라인 {e.lineNumber}</span>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-foreground">{e.message}</p>
          {e.context.length > 0 ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-background/60 p-2 text-[11px] leading-relaxed text-muted-foreground">
              {e.context.join("\n")}
            </pre>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
