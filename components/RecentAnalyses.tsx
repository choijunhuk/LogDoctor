"use client";

import { Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { severityLabel } from "@/lib/analyzer";
import { formatTime } from "@/lib/utils";
import type { SavedAnalysis } from "@/types/logAnalysis";

interface RecentAnalysesProps {
  items: SavedAnalysis[];
  onLoad: (item: SavedAnalysis) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function RecentAnalyses({ items, onLoad, onDelete, onClearAll }: RecentAnalysesProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <Clock className="h-6 w-6 opacity-40" />
        <p>저장된 분석 기록이 없습니다. &quot;기록 저장&quot;을 눌러 보관하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">최근 {items.length}개 (최대 10개)</span>
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          <Trash2 className="h-3.5 w-3.5" />
          전체 삭제
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background/40 p-3"
          >
            <button
              type="button"
              onClick={() => onLoad(item)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <Badge variant={item.result.severity}>
                  {severityLabel(item.result.severity)}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatTime(item.createdAt)} · {item.result.stats.lineCount}줄 ·{" "}
                {item.result.stats.errorCount} 에러
              </p>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
