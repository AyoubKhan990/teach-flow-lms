export const ASSIGNMENT_WRITER_BASE_PATH = "/assignment-writer";

export const assignmentWriterPath = (path) => {
  if (!path) return ASSIGNMENT_WRITER_BASE_PATH;
  if (path.startsWith("/")) return `${ASSIGNMENT_WRITER_BASE_PATH}${path}`;
  return `${ASSIGNMENT_WRITER_BASE_PATH}/${path}`;
};

