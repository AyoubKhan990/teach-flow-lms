import React from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-[color:var(--color-primary)] text-white hover:opacity-95",
  accent: "bg-[color:var(--color-accent)] text-white hover:opacity-95",
  secondary:
    "bg-[color:var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-muted)]",
  ghost: "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/5",
  danger: "bg-[color:var(--color-danger)] text-white hover:opacity-95",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base font-semibold",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-[var(--radius-control)] transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isLoading || disabled}
      type={type}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

