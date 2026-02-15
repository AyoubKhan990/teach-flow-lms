import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/cvMaker.module.css";

export function CvMakerTopbar({ title, right }) {
  return (
    <div className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-2">
        <Link to="/" className="text-sm font-extrabold text-slate-900">
          TeachFlow
        </Link>
        <span className="text-slate-300">/</span>
        <div className="min-w-0 truncate text-sm font-semibold text-slate-600">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/assignment-writer"
          className="rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-900/10"
        >
          Assignment Writer
        </Link>
        {right}
      </div>
    </div>
  );
}

