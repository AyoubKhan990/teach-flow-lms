import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { useToast } from "../components/useToast";
import { assignmentWriterPath } from "../constants";
import { useJobProgress } from "../features/jobProgress/useJobProgress";
import { ProgressPanel } from "../features/jobProgress/ProgressPanel";
import { ResultPanel } from "../features/jobProgress/ResultPanel";

export default function JobProgressPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mountedAt, setMountedAt] = React.useState(0);
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    setMountedAt(Date.now());
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const {
    mode,
    setMode,
    job,
    result,
    events,
    connecting,
    reloadSnapshot,
    cancelJob,
  } = useJobProgress({ jobId, toast });

  const startedAt = job?.createdAt ? Number(job.createdAt) : mountedAt;
  const percent = Number(job?.percent || 0);
  const elapsedSec = Math.max(0, (now - startedAt) / 1000);
  const etaSec = percent > 2 ? (elapsedSec * (100 - percent)) / percent : null;

  const viewResult = () => {
    if (!result) {
      toast({
        title: "Result not ready",
        message: "Please wait for completion.",
        variant: "warning",
      });
      return;
    }
    navigate(assignmentWriterPath("/result"), {
      state: { data: result, content: result.content },
    });
  };

  const onCancel = async () => {
    try {
      await cancelJob();
      toast({ title: "Cancelled", message: "Job cancelled.", variant: "info" });
    } catch (e) {
      toast({
        title: "Cancel failed",
        message: e?.message || "Could not cancel the job.",
        variant: "danger",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => navigate(assignmentWriterPath("/form"))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-sm text-[color:var(--color-text-muted)]">
            Live updates via SSE with polling fallback
          </div>
        </header>

        <main id="main" className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ProgressPanel
              jobId={jobId}
              mode={mode}
              setMode={setMode}
              job={job}
              events={events}
              connecting={connecting}
              etaSec={etaSec}
              onCancel={onCancel}
            />
          </div>
          <div className="lg:col-span-7">
            <ResultPanel
              result={result}
              onRefresh={reloadSnapshot}
              onViewResult={viewResult}
              onStartAnother={() => navigate(assignmentWriterPath("/form"))}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

