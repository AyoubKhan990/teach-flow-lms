import React from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { ToastContext } from "./ToastContext";

const variantMeta = {
  info: {
    icon: Info,
    className:
      "border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
  },
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50" },
  warning: { icon: TriangleAlert, className: "border-amber-200 bg-amber-50" },
  danger: { icon: XCircle, className: "border-red-200 bg-red-50" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);
  const timeoutsRef = React.useRef(new Map());

  const remove = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    ({ title, message, variant = "info", durationMs = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [{ id, title, message, variant }, ...prev].slice(0, 4));
      const timeout = setTimeout(() => remove(id), Math.max(1500, durationMs));
      timeoutsRef.current.set(id, timeout);
      return id;
    },
    [remove]
  );

  React.useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const t of timeouts.values()) clearTimeout(t);
      timeouts.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, remove }}>
      {children}
      <div
        className="fixed right-4 top-4 z-[9999] flex w-[min(420px,calc(100vw-32px))] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const meta = variantMeta[t.variant] || variantMeta.info;
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className={`
                ${meta.className}
                rounded-[var(--radius-card)] border px-4 py-3 shadow-[var(--shadow-2)]
                animate-in fade-in slide-in-from-top-2 duration-200
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[color:var(--color-text)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  {t.title && (
                    <div className="text-sm font-semibold text-[color:var(--color-text)]">
                      {t.title}
                    </div>
                  )}
                  {t.message && (
                    <div className="text-sm text-[color:var(--color-text-muted)]">
                      {t.message}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-[var(--radius-control)] p-1 text-[color:var(--color-text-muted)] hover:bg-black/5"
                  onClick={() => remove(t.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

