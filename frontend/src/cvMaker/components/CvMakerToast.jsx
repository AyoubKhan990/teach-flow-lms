import React from "react";
import { useCvMaker } from "../state/useCvMaker";

export function CvMakerToast() {
  const { state } = useCvMaker();
  const toast = state.toast;
  if (!toast) return null;

  const variant =
    toast.variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : toast.variant === "danger"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2">
      <div className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg ${variant}`}>
        <div className="text-sm font-semibold">{toast.title}</div>
        {toast.message && <div className="mt-1 text-sm opacity-90">{toast.message}</div>}
      </div>
    </div>
  );
}

