import React from "react";
import styles from "../styles/cvMaker.module.css";
import { formatClass, renderMiniTemplateHTML } from "../utils/renderMiniTemplate";

export function CvTemplateCard({ template, index, onSelect }) {
  const html = React.useMemo(() => renderMiniTemplateHTML(template, index), [index, template]);

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="template-preview-box">
        <div
          className={`mini-cv ${formatClass(template.format)} ${styles.miniCv}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow">
            Use This Template
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-extrabold text-slate-900">{template.name}</div>
          <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
            {template.category}
          </span>
        </div>
      </div>
    </button>
  );
}

