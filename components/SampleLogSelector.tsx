"use client";

import * as React from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_LOGS } from "@/lib/sampleLogs";

interface SampleLogSelectorProps {
  onSelect: (log: string, label: string) => void;
}

export function SampleLogSelector({ onSelect }: SampleLogSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <FileText className="h-3.5 w-3.5" />
        예시 로그 불러오기
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-72 animate-fade-in overflow-hidden rounded-md border border-border bg-card shadow-xl">
          {SAMPLE_LOGS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelect(s.log, s.label);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
