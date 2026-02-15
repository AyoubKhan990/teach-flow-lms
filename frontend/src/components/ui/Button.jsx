import React from "react";
import { cn } from "./cn";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-[color:var(--tf-primary)] text-white hover:bg-[color:var(--tf-primary-600)]",
  secondary:
    "bg-[color:var(--tf-surface)] text-[color:var(--tf-text)] border border-[color:var(--tf-border)] hover:bg-[color:var(--tf-surface-muted)]",
  ghost: "bg-transparent text-[color:var(--tf-text)] hover:bg-black/5 dark:hover:bg-white/10",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      {...props}
    />
  );
});

