export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const pollBackoffMs = (attempt) => {
  const base = 1200;
  const max = 12000;
  const raw = Math.min(max, Math.round(base * Math.pow(1.6, attempt)));
  return raw + Math.round(Math.random() * 250);
};

export const fetchJob = async (jobId) => {
  const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`);
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || 'Job not found');
  return data;
};

export const postJobAction = async (jobId, path, body) => {
  const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Request failed');
  return data;
};

