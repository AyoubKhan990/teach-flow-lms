import React from "react";
import { cn } from "./cn";

export function Input({
  id,
  label,
  hint,
  error,
  className,
  inputClassName,
  ...props
}) {
  const describedBy = [
    error ? `${id}-error` : null,
    hint ? `${id}-hint` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label htmlFor={id} className="text-sm font-semibold text-[color:var(--tf-text)]">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "mt-2 h-11 w-full rounded-[var(--tf-radius-sm)] border bg-[color:var(--tf-surface)] px-3 text-sm text-[color:var(--tf-text)] outline-none transition placeholder:text-[color:var(--tf-text-muted)]",
          error ? "border-rose-300 focus:ring-2 focus:ring-rose-200" : "border-[color:var(--tf-border)] focus:ring-2 focus:ring-[color:var(--tf-ring)]",
          inputClassName
        )}
        {...props}
      />
      {hint ? (
        <div id={`${id}-hint`} className="mt-2 text-xs text-[color:var(--tf-text-muted)]">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={`${id}-error`} className="mt-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

