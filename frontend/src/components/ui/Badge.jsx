import React from "react";
import { cn } from "./cn";

const variants = {
  neutral: "bg-black/5 text-[color:var(--tf-text)] dark:bg-white/10",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
};

export function Badge({ variant = "neutral", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    />
  );
}

