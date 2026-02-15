import React from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

const ToastContext = React.createContext(null);

function toastStyles(variant) {
  if (variant === "success") return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  if (variant === "warning") return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  if (variant === "danger") return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
  return "border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] text-[color:var(--tf-text)]";
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ title, message, variant = "neutral", durationMs = 4000 }) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, title, message, variant }]);
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }
      return id;
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(420px,calc(100vw-32px))] flex-col gap-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto rounded-[var(--tf-radius-md)] border px-4 py-3 shadow-[var(--tf-shadow-md)]",
                toastStyles(t.variant)
              )}
              role="status"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {t.title ? <div className="text-sm font-extrabold">{t.title}</div> : null}
                  {t.message ? <div className={cn(t.title ? "mt-1 text-sm" : "text-sm")}>{t.message}</div> : null}
                </div>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-sm opacity-70 hover:opacity-100"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

