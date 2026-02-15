import React from "react";

export function PlaceholderView({ title, description }) {
  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-slate-900">{title}</div>
          <div className="mt-2 text-sm text-slate-600">{description}</div>
        </div>
      </div>
    </div>
  );
}

