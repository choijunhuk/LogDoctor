import * as React from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/logAnalysis";

type BadgeVariant = "default" | "outline" | "muted" | Severity;

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary/15 text-primary",
  outline: "border-border text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  low: "border-transparent bg-sky-500/15 text-sky-300",
  medium: "border-transparent bg-amber-500/15 text-amber-300",
  high: "border-transparent bg-orange-500/15 text-orange-300",
  critical: "border-transparent bg-red-500/20 text-red-300",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
