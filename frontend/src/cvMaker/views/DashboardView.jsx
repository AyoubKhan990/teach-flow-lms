import React from "react";
import { CV_TEMPLATES } from "../data/templates";
import { useCvMaker } from "../state/useCvMaker";
import { CV_VIEWS } from "../state/cvMakerState";
import { CvTemplateCard } from "../components/CvTemplateCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../hooks/useAuth";

const BASE_URL = import.meta.env.VITE_API_URL || "";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function DashboardView() {
  const { dispatch } = useCvMaker();
  const { startGoogleSignIn, isAuthenticated, loading: authLoading } = useAuth();
  const [recent, setRecent] = React.useState([]);
  const [recentLoading, setRecentLoading] = React.useState(false);
  const [recentError, setRecentError] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const createFromTemplate = React.useCallback(
    async (templateId) => {
      if (creating) return;
      setCreating(true);
      try {
        const mod = await import("../state/cvMakerState");
        const res = await fetch(`${BASE_URL}/api/resumes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: "Untitled Resume",
            templateId,
            status: "draft",
            data: mod.INITIAL_CV_DATA,
          }),
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to create resume");
        dispatch({
          type: "LOAD_RESUME",
          resumeId: json._id,
          title: json.title,
          status: json.status,
          templateId: json.templateId,
          data: json.data,
        });
      } finally {
        setCreating(false);
      }
    },
    [creating, dispatch, startGoogleSignIn]
  );

  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    let cancelled = false;
    setRecentLoading(true);
    setRecentError("");
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/resumes?limit=4&page=1&sort=updatedAt&order=desc`, {
          credentials: "include",
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load resumes");
        if (!cancelled) setRecent(json.items || []);
      } catch (e) {
        if (!cancelled) setRecentError(e.message || "Failed to load resumes");
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, startGoogleSignIn]);

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="CV Maker"
          subtitle="Pick a template and build a professional CV in minutes."
          right={
            <button
              type="button"
              onClick={() => dispatch({ type: "NAVIGATE", view: CV_VIEWS.templates })}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              + Create New CV
            </button>
          }
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-3xl font-extrabold text-slate-900">Welcome back!</div>
          <div className="mt-2 text-sm text-slate-600">
            Ready to create your next professional resume?
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">Featured Templates</div>
          <button
            type="button"
            onClick={() => dispatch({ type: "NAVIGATE", view: CV_VIEWS.templates })}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CV_TEMPLATES.slice(0, 4).map((t, idx) => (
            <CvTemplateCard
              key={t.id}
              template={t}
              index={idx}
              onSelect={createFromTemplate}
            />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          <div className="font-extrabold text-slate-900">Recent resumes</div>
          {recentLoading ? (
            <div className="mt-4 flex items-center gap-3 text-slate-600">
              <Spinner />
              <span className="text-sm font-semibold">Loading…</span>
            </div>
          ) : recentError ? (
            <div className="mt-3 text-sm font-semibold text-red-600">{recentError}</div>
          ) : recent.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "LOAD_RESUME",
                      resumeId: r._id,
                      title: r.title,
                      status: r.status,
                      templateId: r.templateId,
                      data: r.data,
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="truncate text-sm font-extrabold text-slate-900">{r.title}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    Updated {formatDate(r.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-slate-600">No resumes yet. Create one from Templates.</div>
          )}
        </div>
      </div>
    </div>
  );
}

