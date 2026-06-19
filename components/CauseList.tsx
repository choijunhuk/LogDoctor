"use client";

import { Lightbulb } from "lucide-react";
import type { CauseCandidate } from "@/types/logAnalysis";

interface CauseListProps {
  causes: CauseCandidate[];
  steps: string[];
}

export function CauseList({ causes, steps }: CauseListProps) {
  if (causes.length === 0 && steps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        원인 후보를 제시할 만한 매칭이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5" /> 원인 후보
        </h4>
        <ol className="space-y-2">
          {causes.map((c, i) => (
            <li
              key={c.id}
              className="flex gap-2 rounded-md border border-border bg-background/40 p-3 text-sm"
            >
              <span className="font-mono text-xs text-primary">{i + 1}.</span>
              <div>
                <p>{c.title}</p>
                {c.detail ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {steps.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">먼저 확인할 것</h4>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/90">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
