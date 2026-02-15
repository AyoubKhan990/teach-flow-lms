import React from "react";
import { cn } from "./cn";
import { Button } from "./Button";

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon, className }) {
  return (
    <div className={cn("tf-surface p-8 text-center", className)}>
      {Icon ? (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-[color:var(--tf-text)] dark:bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <div className="mt-4 text-lg font-extrabold text-[color:var(--tf-text)]">{title}</div>
      {description ? <div className="mt-2 text-sm text-[color:var(--tf-text-muted)]">{description}</div> : null}
      {actionLabel && onAction ? (
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

