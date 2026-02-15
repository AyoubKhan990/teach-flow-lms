import React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const variants = {
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-900",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  danger: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-900",
  },
};

export const Alert = ({
  title,
  children,
  variant = "info",
  className = "",
  role = "status",
}) => {
  const meta = variants[variant] || variants.info;
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-[var(--radius-card)] border px-4 py-3 shadow-[var(--shadow-1)] ${meta.className} ${className}`}
      role={role}
    >
      <div className="flex gap-3">
        <div className="mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {title && <div className="text-sm font-semibold">{title}</div>}
          <div className="text-sm text-black/80">{children}</div>
        </div>
      </div>
    </div>
  );
};

