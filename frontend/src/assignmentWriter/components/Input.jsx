import React from "react";
import { Info } from "lucide-react";

const LabelRow = ({ id, label, tooltip }) => {
  if (!label) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[color:var(--color-text)]">
        {label}
      </label>
      {tooltip && (
        <span className="group relative inline-flex">
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
            aria-label={`${label} help`}
            aria-describedby={`${id}-tip`}
          >
            <Info className="h-4 w-4" />
          </button>
          <span
            id={`${id}-tip`}
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-[min(280px,70vw)] rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-white px-3 py-2 text-xs text-[color:var(--color-text)] shadow-[var(--shadow-2)] group-hover:block group-focus-within:block"
          >
            {tooltip}
          </span>
        </span>
      )}
    </div>
  );
};

export const Input = ({ label, tooltip, error, hint, className = "", id, ...props }) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <LabelRow id={id} label={label} tooltip={tooltip} />
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`
          flex h-12 w-full rounded-[var(--radius-control)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm shadow-[var(--shadow-1)] transition-colors
          file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50
          ${
            error
              ? "border-[color:var(--color-danger)] focus-visible:ring-[color:var(--color-danger)]"
              : ""
          }
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[color:var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs text-[color:var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  tooltip,
  error,
  hint,
  options = [],
  className = "",
  id,
  ...props
}) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <LabelRow id={id} label={label} tooltip={tooltip} />
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`
          flex h-12 w-full rounded-[var(--radius-control)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm shadow-[var(--shadow-1)] transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50
          ${
            error
              ? "border-[color:var(--color-danger)] focus-visible:ring-[color:var(--color-danger)]"
              : ""
          }
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[color:var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs text-[color:var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

