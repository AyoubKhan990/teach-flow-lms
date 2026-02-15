import React from "react";
import { cn } from "./cn";

export function Switch({ checked, onCheckedChange, label, description, className, disabled }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {label ? <div className="text-sm font-semibold text-[color:var(--tf-text)]">{label}</div> : null}
        {description ? (
          <div className="mt-1 text-xs text-[color:var(--tf-text-muted)]">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onCheckedChange?.(!checked);
        }}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none",
          disabled ? "opacity-60" : "opacity-100",
          checked
            ? "bg-[color:var(--tf-primary)] border-transparent"
            : "bg-[color:var(--tf-surface)] border-[color:var(--tf-border)]"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

