export const formatEta = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  const m = Math.round(seconds / 60);
  return `~${m}m`;
};

