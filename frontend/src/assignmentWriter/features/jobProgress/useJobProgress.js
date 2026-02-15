import React from "react";
import { assignmentWriterApiUrl } from "../../api";
import { fetchJob, pollBackoffMs, postJobAction, sleep } from "./jobApi";

export const useJobProgress = ({ jobId, toast }) => {
  const [mode, setMode] = React.useState("sse");
  const [job, setJob] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState(0);
  const [connecting, setConnecting] = React.useState(true);
  const [pollAttempt, setPollAttempt] = React.useState(0);
  const lastUpdatedAtRef = React.useRef(0);

  const appendEvent = React.useCallback((evt) => {
    if (!evt || typeof evt.seq !== "number") return;
    setEvents((prev) => {
      const has = prev.some((p) => p.seq === evt.seq);
      if (has) return prev;
      return [...prev, evt].sort((a, b) => a.seq - b.seq).slice(-200);
    });
    const now = Date.now();
    lastUpdatedAtRef.current = now;
    setLastUpdatedAt(() => now);
  }, []);

  React.useEffect(() => {
    let alive = true;
    setConnecting(true);
    fetchJob(jobId)
      .then((data) => {
        if (!alive) return;
        setJob(data.job);
        setResult(data.result);
        setConnecting(false);
      })
      .catch((e) => {
        if (!alive) return;
        setConnecting(false);
        toast({
          title: "Job error",
          message: e?.message || "Job not found",
          variant: "danger",
        });
      });
    return () => {
      alive = false;
    };
  }, [jobId, toast]);

  const isDone =
    job?.status === "completed" ||
    job?.status === "failed" ||
    job?.status === "cancelled";

  React.useEffect(() => {
    if (!jobId) return;
    if (mode !== "sse") return;

    let es;
    let disposed = false;
    let closedByUs = false;
    let watchdog;

    setConnecting(true);

    const url = assignmentWriterApiUrl(`/jobs/${jobId}/events`);
    try {
      es = new EventSource(url, { withCredentials: true });
    } catch {
      es = new EventSource(url);
    }

    es.addEventListener("snapshot", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (disposed) return;
        setJob(data.job);
        setConnecting(false);
        const now = Date.now();
        lastUpdatedAtRef.current = now;
        setLastUpdatedAt(() => now);
      } catch {
        return;
      }
    });

    es.addEventListener("progress", (ev) => {
      try {
        const evt = JSON.parse(ev.data);
        if (disposed) return;
        appendEvent(evt);

        if (evt && typeof evt === "object") {
          setJob((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (typeof evt.message === "string") next.message = evt.message;
            if (typeof evt.percent === "number") next.percent = evt.percent;
            if (typeof evt.stage === "string") next.stage = evt.stage;
            if (evt.stage === "completed") next.status = "completed";
            if (evt.stage === "failed") next.status = "failed";
            if (evt.stage === "cancelled") next.status = "cancelled";
            return next;
          });
        }

        if (
          evt?.stage === "completed" ||
          evt?.stage === "failed" ||
          evt?.stage === "cancelled"
        ) {
          fetchJob(jobId)
            .then((data) => {
              if (disposed) return;
              setJob(data.job);
              setResult(data.result);
              setConnecting(false);
              try {
                closedByUs = true;
                es?.close();
              } catch {
                return;
              }
            })
            .catch(() => {
              if (disposed) return;
              setMode("poll");
            });
        }
      } catch {
        return;
      }
    });

    es.onerror = () => {
      if (disposed) return;
      if (closedByUs) return;
      setConnecting(false);
      setMode("poll");
    };

    watchdog = setInterval(() => {
      if (disposed) return;
      const ageMs = Date.now() - (lastUpdatedAtRef.current || 0);
      if (ageMs > 12000) {
        try {
          closedByUs = true;
          es.close();
        } catch {
          return;
        }
        setMode("poll");
      }
    }, 4000);

    return () => {
      disposed = true;
      clearInterval(watchdog);
      try {
        closedByUs = true;
        es?.close();
      } catch {
        return;
      }
    };
  }, [appendEvent, jobId, mode]);

  React.useEffect(() => {
    if (!jobId) return;
    if (mode !== "poll") return;
    if (isDone) return;

    let alive = true;
    const run = async () => {
      while (alive) {
        try {
          const data = await fetchJob(jobId);
          if (!alive) return;
          setJob(data.job);
          setResult(data.result);
          setLastUpdatedAt(() => Date.now());
          setPollAttempt(0);
          if (
            data.job?.status === "completed" ||
            data.job?.status === "failed" ||
            data.job?.status === "cancelled"
          )
            return;
          await sleep(2000);
        } catch {
          if (!alive) return;
          setPollAttempt((p) => p + 1);
          await sleep(pollBackoffMs(pollAttempt));
        }
      }
    };
    run();

    return () => {
      alive = false;
    };
  }, [isDone, jobId, mode, pollAttempt]);

  const reloadSnapshot = React.useCallback(async () => {
    const data = await fetchJob(jobId);
    setJob(data.job);
    setResult(data.result);
    setLastUpdatedAt(() => Date.now());
    return data;
  }, [jobId]);

  const cancelJob = React.useCallback(async () => {
    await postJobAction(jobId, "cancel");
    await reloadSnapshot();
  }, [jobId, reloadSnapshot]);

  return {
    mode,
    setMode,
    job,
    result,
    events,
    connecting,
    lastUpdatedAt,
    reloadSnapshot,
    cancelJob,
  };
};

