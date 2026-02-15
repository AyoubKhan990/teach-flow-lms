import React from "react";
import ReactDOM from "react-dom";
import { cn } from "./cn";

function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )
  );
}

export function Dialog({ open, onOpenChange, title, description, children, className }) {
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const panel = panelRef.current;
    const focusables = getFocusable(panel);
    const target = focusables[0] || panel;
    target?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
      if (e.key !== "Tab") return;
      const items = getFocusable(panelRef.current);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      prev?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange?.(false);
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] shadow-[var(--tf-shadow-lg)]",
          className
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-6">
            {title ? (
              <div className="text-lg font-extrabold text-[color:var(--tf-text)]">{title}</div>
            ) : null}
            {description ? (
              <div className="mt-2 text-sm text-[color:var(--tf-text-muted)]">{description}</div>
            ) : null}
          </div>
        )}
        <div className="px-6 pb-6 pt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

