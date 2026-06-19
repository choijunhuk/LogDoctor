"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import type { LogCategory, SuggestedCommand } from "@/types/logAnalysis";

interface CommandListProps {
  commands: SuggestedCommand[];
}

export function CommandList({ commands }: CommandListProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<LogCategory, SuggestedCommand[]>();
    for (const c of commands) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return Array.from(map.entries());
  }, [commands]);

  if (commands.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">추천 명령어가 없습니다.</p>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(([category, cmds]) => (
        <section key={category}>
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">{category}</h4>
          <ul className="space-y-2">
            {cmds.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-md border border-border bg-background/60 p-2"
              >
                <div className="min-w-0 flex-1">
                  <code className="block break-all font-mono text-xs text-emerald-300">
                    {c.command}
                  </code>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.description}</p>
                </div>
                <CopyButton value={c.command} size="icon" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
