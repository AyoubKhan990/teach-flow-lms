import React from "react";
import { cn } from "./cn";

export function PageHeader({ title, subtitle, right, className }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <div className="text-2xl font-extrabold tracking-tight text-[color:var(--tf-text)] sm:text-3xl">
          {title}
        </div>
        {subtitle ? <div className="mt-2 text-sm text-[color:var(--tf-text-muted)]">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

