import React from "react";
import { CV_TEMPLATES, CV_TEMPLATE_CATEGORIES } from "../data/templates";
import { useCvMaker } from "../state/useCvMaker";
import { CvTemplateCard } from "../components/CvTemplateCard";
import { useAuth } from "../../hooks/useAuth";
import { INITIAL_CV_DATA } from "../state/cvMakerState";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export function TemplatesView() {
  const { state, dispatch } = useCvMaker();
  const { startGoogleSignIn } = useAuth();
  const filter = state.templateFilter;
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState("");

  const filtered = React.useMemo(() => {
    if (filter === "all") return CV_TEMPLATES;
    return CV_TEMPLATES.filter((t) => t.category === filter);
  }, [filter]);

  const handleSelect = React.useCallback(
    async (templateId) => {
      if (creating) return;
      setError("");
      setCreating(true);
      try {
        const res = await fetch(`${BASE_URL}/api/resumes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: "Untitled Resume",
            templateId,
            status: "draft",
            data: INITIAL_CV_DATA,
          }),
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to create resume");

        dispatch({
          type: "LOAD_RESUME",
          resumeId: data._id,
          title: data.title,
          status: data.status,
          templateId: data.templateId,
          data: data.data,
        });
        dispatch({
          type: "TOAST",
          toast: { type: "success", title: "Created", message: "Resume created. Start editing." },
        });
      } catch (e) {
        setError(e.message || "Failed to create resume");
      } finally {
        setCreating(false);
      }
    },
    [creating, dispatch, startGoogleSignIn]
  );

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-900">Templates</div>
            <div className="mt-1 text-sm text-slate-600">
              Choose a design and start editing your CV.
            </div>
            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {CV_TEMPLATE_CATEGORIES.map((c) => {
              const active = filter === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => dispatch({ type: "SET_FILTER", filter: c.value })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, idx) => (
            <CvTemplateCard
              key={t.id}
              template={t}
              index={idx}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

