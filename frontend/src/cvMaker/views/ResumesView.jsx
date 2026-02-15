import React from "react";
import { Search, LayoutGrid, List, Trash2, Copy, Pencil } from "lucide-react";
import { useCvMaker } from "../state/useCvMaker";
import { CV_TEMPLATES } from "../data/templates";
import { renderCvHtml } from "../utils/renderCv";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../hooks/useAuth";

const BASE_URL = import.meta.env.VITE_API_URL;

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function useDebounced(value, delayMs) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(value), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, value]);
  return v;
}

function ResumeThumbnail({ resume }) {
  const template = React.useMemo(() => {
    return CV_TEMPLATES.find((t) => t.id === resume.templateId) || CV_TEMPLATES[0];
  }, [resume.templateId]);

  const html = React.useMemo(() => {
    return renderCvHtml({
      templateId: template.id,
      templateFormat: template.format,
      data: resume.data || {},
    });
  }, [resume.data, template.format, template.id]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] shadow-[var(--tf-shadow-sm)]">
      <div className="pointer-events-none origin-top-left scale-[0.33] p-0">
        <div
          className="w-[794px] h-[1123px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-black/0 to-black/0" />
    </div>
  );
}

export function ResumesView() {
  const { dispatch } = useCvMaker();
  const { startGoogleSignIn, isAuthenticated, loading: authLoading } = useAuth();

  const [viewMode, setViewMode] = React.useState(() => {
    try {
      return localStorage.getItem("tf_cv_resumes_view") || "grid";
    } catch {
      return "grid";
    }
  });
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search, 450);
  const effectiveSearch = debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : "";

  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState("updatedAt");
  const [order, setOrder] = React.useState("desc");
  const [page, setPage] = React.useState(1);

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [selected, setSelected] = React.useState(() => new Set());
  const selectedCount = selected.size;

  React.useEffect(() => {
    try {
      localStorage.setItem("tf_cv_resumes_view", viewMode);
    } catch {
      return;
    }
  }, [viewMode]);

  const fetchPage = React.useCallback(
    async ({ nextPage, append }) => {
      if (authLoading) return;
      if (!isAuthenticated) {
        startGoogleSignIn();
        return;
      }

      setError("");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(nextPage));
        params.set("limit", "18");
        params.set("sort", sort);
        params.set("order", order);
        if (effectiveSearch) params.set("q", effectiveSearch);
        if (status === "draft" || status === "completed") params.set("status", status);

        const res = await fetch(`${BASE_URL}/api/resumes?${params.toString()}`, {
          credentials: "include",
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load resumes");

        setItems((prev) => (append ? [...prev, ...json.items] : json.items));
        setTotal(json.total || 0);
        setHasMore(Boolean(json.hasMore));
        setPage(json.page || nextPage);
      } catch (e) {
        setError(e.message || "Failed to load resumes");
      } finally {
        setLoading(false);
      }
    },
    [authLoading, effectiveSearch, isAuthenticated, order, sort, startGoogleSignIn, status]
  );

  React.useEffect(() => {
    setSelected(new Set());
    fetchPage({ nextPage: 1, append: false });
  }, [effectiveSearch, fetchPage, order, sort, status]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchPage({ nextPage: page + 1, append: true });
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((x) => next.has(x._id));
      if (allSelected) items.forEach((x) => next.delete(x._id));
      else items.forEach((x) => next.add(x._id));
      return next;
    });
  };

  const openResume = async (id) => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/resumes/${id}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to load resume");
      dispatch({
        type: "LOAD_RESUME",
        resumeId: json._id,
        title: json.title,
        status: json.status,
        templateId: json.templateId,
        data: json.data,
      });
    } catch (e) {
      setError(e.message || "Failed to open resume");
    }
  };

  const deleteOne = async (id) => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/resumes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      await fetchPage({ nextPage: 1, append: false });
    } catch (e) {
      setError(e.message || "Failed to delete");
    }
  };

  const duplicateOne = async (id) => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/resumes/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to duplicate");
      await fetchPage({ nextPage: 1, append: false });
    } catch (e) {
      setError(e.message || "Failed to duplicate");
    }
  };

  const bulkAction = async (action) => {
    if (!selectedCount) return;
    setError("");
    const ids = Array.from(selected);
    try {
      const res = await fetch(`${BASE_URL}/api/resumes/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ids }),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Bulk action failed");
      setSelected(new Set());
      await fetchPage({ nextPage: 1, append: false });
    } catch (e) {
      setError(e.message || "Bulk action failed");
    }
  };

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="My Resumes"
          subtitle="Search, filter, and manage all your saved resumes."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                  viewMode === "grid"
                    ? "border-transparent bg-[color:var(--tf-primary)] text-white"
                    : "border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                  viewMode === "list"
                    ? "border-transparent bg-[color:var(--tf-primary)] text-white"
                    : "border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                }`}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          }
        />

        <div className="grid gap-3 rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-4 shadow-[var(--tf-shadow-sm)] sm:grid-cols-12">
          <div className="sm:col-span-6">
            <Input
              id="resumeSearch"
              label="Search resumes"
              placeholder="Type at least 3 characters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputClassName="pl-10"
            />
            <div className="pointer-events-none relative -mt-[44px] ml-3 h-0 w-0 text-[color:var(--tf-text-subtle)]">
              <Search className="h-5 w-5" />
            </div>
          </div>
          <div className="sm:col-span-3">
            <div className="text-sm font-semibold text-[color:var(--tf-text)]">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <div className="text-sm font-semibold text-[color:var(--tf-text)]">Sort</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
              >
                <option value="updatedAt">Last modified</option>
                <option value="createdAt">Created</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-[color:var(--tf-text-muted)]">
              <button
                type="button"
                onClick={selectAllOnPage}
                className="rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
              >
                {selectedCount ? "Toggle page selection" : "Select page"}
              </button>
              <span>
                {total ? `${total} total` : " "}
              </span>
            </div>
            {selectedCount ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[color:var(--tf-text-muted)]">
                  {selectedCount} selected
                </div>
                <Button variant="secondary" onClick={() => bulkAction("duplicate")}>
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="danger" onClick={() => bulkAction("delete")}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {error ? <Alert className="mt-4" variant="danger" title="Something went wrong">{error}</Alert> : null}

        {loading && items.length === 0 ? (
          <div className="mt-8 flex items-center justify-center gap-3 text-[color:var(--tf-text-muted)]">
            <Spinner />
            <span className="text-sm font-semibold">Loading resumes…</span>
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No resumes yet"
              description="Create your first resume from Templates, then manage it here."
              actionLabel="Go to Templates"
              onAction={() => dispatch({ type: "NAVIGATE", view: "templates" })}
              icon={Pencil}
            />
          </div>
        ) : null}

        {items.length ? (
          <div
            className={
              viewMode === "grid"
                ? "mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                : "mt-8 grid gap-4"
            }
          >
            {items.map((r) => (
              <div
                key={r._id}
                className="group rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-4 shadow-[var(--tf-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--tf-shadow-md)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold text-[color:var(--tf-text)]">
                      {r.title || "Untitled Resume"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--tf-text-muted)]">
                      Updated {formatDate(r.updatedAt)} • Created {formatDate(r.createdAt)}
                    </div>
                    <div className="mt-2 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-extrabold text-[color:var(--tf-text)] dark:bg-white/10">
                      {r.status || "draft"}
                    </div>
                  </div>
                  <label className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)]">
                    <input
                      type="checkbox"
                      checked={selected.has(r._id)}
                      onChange={() => toggleSelected(r._id)}
                      className="h-4 w-4"
                      aria-label="Select resume"
                    />
                  </label>
                </div>

                {viewMode === "grid" ? (
                  <div className="mt-4">
                    <ResumeThumbnail resume={r} />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => openResume(r._id)}>
                    <Pencil className="h-4 w-4" />
                    Quick edit
                  </Button>
                  <Button variant="secondary" onClick={() => duplicateOne(r._id)}>
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="danger" onClick={() => deleteOne(r._id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

