import React from "react";
import { cn } from "./cn";

const variants = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  danger:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
  neutral:
    "border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] text-[color:var(--tf-text)]",
};

export function Alert({ variant = "neutral", title, className, children, ...props }) {
  return (
    <div
      className={cn(
        "w-full rounded-[var(--tf-radius-md)] border px-4 py-3 shadow-[var(--tf-shadow-sm)]",
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {title ? <div className="text-sm font-extrabold">{title}</div> : null}
      {children ? <div className={cn(title ? "mt-1 text-sm" : "text-sm")}>{children}</div> : null}
    </div>
  );
}

