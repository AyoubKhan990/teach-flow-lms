import React from 'react';

export const Input = ({ label, error, hint, className = '', id, ...props }) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-[color:var(--color-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`
          flex h-12 w-full rounded-[var(--radius-control)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm shadow-[var(--shadow-1)] transition-colors
          file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-[color:var(--color-danger)] focus-visible:ring-[color:var(--color-danger)]' : ''}
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
        <p id={`${id}-error`} className="text-xs text-[color:var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const Select = ({ label, error, hint, options = [], className = '', id, ...props }) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-[color:var(--color-text)]">
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`
          flex h-12 w-full rounded-[var(--radius-control)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-sm shadow-[var(--shadow-1)] transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-[color:var(--color-danger)] focus-visible:ring-[color:var(--color-danger)]' : ''}
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
        <p id={`${id}-error`} className="text-xs text-[color:var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
