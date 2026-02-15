import React from "react";
import { FileText, Home, Layers, Settings, User } from "lucide-react";
import { useCvMaker } from "../state/useCvMaker";
import { CV_VIEWS } from "../state/cvMakerState";
import styles from "../styles/cvMaker.module.css";

const items = [
  { id: CV_VIEWS.dashboard, label: "Dashboard", Icon: Home },
  { id: CV_VIEWS.templates, label: "Templates", Icon: Layers },
  { id: CV_VIEWS.resumes, label: "My Resumes", Icon: FileText },
  { id: CV_VIEWS.profile, label: "Profile", Icon: User },
  { id: CV_VIEWS.settings, label: "Settings", Icon: Settings },
];

export function CvMakerSidebar() {
  const { state, dispatch } = useCvMaker();

  return (
    <aside className={styles.sidebar}>
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <FileText className="h-5 w-5 text-blue-300" />
          </div>
          <div className="text-lg font-extrabold tracking-wide">CV Maker</div>
        </div>
      </div>

      <div className="px-3 pb-6">
        <nav className="grid gap-2">
          {items.map(({ id, label, Icon: IconComponent }) => {
            const active = state.view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => dispatch({ type: "NAVIGATE", view: id })}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {React.createElement(IconComponent, { className: "h-4 w-4" })}
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 px-5 py-4 text-xs text-slate-300">
        Free Plan
      </div>
    </aside>
  );
}

