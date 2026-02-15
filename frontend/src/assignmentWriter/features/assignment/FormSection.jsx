import React from "react";
import { Card } from "../../components/Card";

export const FormSection = ({
  id,
  title,
  Icon,
  subtitle,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = `${id}-content`;

  return (
    <div id={id} className="scroll-mt-24">
      <Card className="bg-white/80">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 rounded-[var(--radius-card)] px-6 py-5 text-left hover:bg-black/5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-[var(--radius-control)] bg-black/5 text-[color:var(--color-text)]">
            {React.createElement(Icon, { className: "h-5 w-5" })}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">
              {title}
            </div>
            {subtitle && (
              <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
          {open ? "Hide" : "Show"}
        </div>
      </button>
      {open && (
        <div id={contentId} className="px-6 pb-6">
          {children}
        </div>
      )}
      </Card>
    </div>
  );
};

