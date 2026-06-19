"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** Toast message on success. */
  message?: string;
  label?: string;
  size?: "sm" | "icon";
  className?: string;
}

export function CopyButton({
  value,
  message = "복사됨",
  label,
  size = "icon",
  className,
}: CopyButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast(message, "success");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast("복사 실패", "error");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleCopy}
      className={cn(className)}
      aria-label="클립보드에 복사"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
