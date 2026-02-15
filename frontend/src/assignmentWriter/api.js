const BASE_URL = import.meta.env.VITE_API_URL || "";

export const ASSIGNMENT_WRITER_API_BASE = `${BASE_URL}/api/assignment-writer`;

export const assignmentWriterApiUrl = (path) => {
  if (!path) return ASSIGNMENT_WRITER_API_BASE;
  if (path.startsWith("/")) return `${ASSIGNMENT_WRITER_API_BASE}${path}`;
  return `${ASSIGNMENT_WRITER_API_BASE}/${path}`;
};

