import React from "react";
import { Alert } from "../../components/Alert";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { formatEta } from "./format";

const StageLabel = ({ stage }) => {
  const map = {
    queued: "Queued",
    analyzing: "Analyzing requirements…",
    generating_content: "Generating content…",
    generating_images: "Creating images…",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return <span>{map[stage] || stage || "—"}</span>;
};

const ProgressBar = ({ percent }) => {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-[color:var(--color-accent)] transition-all duration-200"
        style={{ width: `${p}%` }}
      />
    </div>
  );
};

export const ProgressPanel = ({
  jobId,
  mode,
  setMode,
  job,
  events,
  connecting,
  etaSec,
  onCancel,
}) => {
  const percent = Number(job?.percent || 0);
  const isDone =
    job?.status === "completed" ||
    job?.status === "failed" ||
    job?.status === "cancelled";

  return (
    <Card className="bg-white/80 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            Generation progress
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            <StageLabel stage={job?.stage} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            {Math.round(percent)}%
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">
            ETA {formatEta(etaSec)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar percent={percent} />
      </div>

      <div className="mt-4 text-sm text-[color:var(--color-text)]">
        {connecting ? "Connecting…" : job?.message || "Working…"}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="neutral" className="bg-white/70 backdrop-blur">
          Job {jobId?.slice(0, 8)}
        </Badge>
        <Badge variant="info" className="bg-white/70 backdrop-blur">
          Mode: {mode.toUpperCase()}
        </Badge>
      </div>

      {!isDone && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => setMode("sse")}
          >
            Reconnect
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => setMode("poll")}
          >
            Switch to polling
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="mt-4">
          <Alert variant="danger" title="Generation failed" role="alert">
            {job?.error?.message || "An unexpected error occurred."}
          </Alert>
        </div>
      )}

      <div className="mt-6">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">
          Timeline
        </div>
        <div className="mt-3 max-h-[360px] overflow-auto rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-white/60">
          {events.length === 0 && (
            <div className="p-4 text-sm text-[color:var(--color-text-muted)]">
              Waiting for updates…
            </div>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="border-b border-[color:var(--color-border)] px-4 py-3 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">
                  {e.message || e.stage}
                </div>
                <div className="text-xs text-[color:var(--color-text-muted)]">
                  {Math.round(Number(e.percent || 0))}%
                </div>
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {new Date(e.ts).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

