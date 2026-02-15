import React from "react";
import { assignmentWriterApiUrl } from "../../api";

const clampInt = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const fieldOrder = [
  "topic",
  "subject",
  "level",
  "pages",
  "length",
  "style",
  "language",
  "references",
  "citationStyle",
  "instructions",
];

export const useAssignmentForm = ({ onJobCreated, toast }) => {
  const [formData, setFormData] = React.useState({
    topic: "",
    subject: "Computer Science",
    level: "College",
    length: "Medium",
    pages: 1,
    style: "Academic",
    references: false,
    citationStyle: "APA",
    language: "English",
    urgency: "Normal",
    instructions: "",
  });

  const [errors, setErrors] = React.useState({});
  const [formError, setFormError] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const pages = clampInt(formData.pages, 1, 20, 1);

  const setField = React.useCallback((id, value) => {
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    setFormError("");
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const validate = React.useCallback((data) => {
    const next = {};
    const topic = (data.topic || "").trim();
    if (!topic) next.topic = "Topic is required.";

    const p = clampInt(data.pages, 1, 20, 1);
    if (!p || p < 1) next.pages = "Pages must be at least 1.";

    if (data.references && !data.citationStyle)
      next.citationStyle = "Select a citation style.";

    return {
      ok: Object.keys(next).length === 0,
      errors: next,
      normalized: {
        ...data,
        topic,
        pages: p,
      },
    };
  }, []);

  const focusField = React.useCallback((id) => {
    const el = document.getElementById(id);
    if (el && typeof el.focus === "function") {
      el.focus();
      return;
    }
    const alt = document.querySelector(`[name="${id}"]`);
    if (alt && typeof alt.focus === "function") alt.focus();
  }, []);

  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitted(true);
      const res = validate(formData);
      if (!res.ok) {
        setErrors(res.errors);
        const first = fieldOrder.find((k) => res.errors[k]);
        if (first) focusField(first);
        return;
      }

      setIsGenerating(true);
      try {
        const response = await fetch(assignmentWriterApiUrl("/jobs"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(res.normalized),
          credentials: "include",
        });

        const data = await response.json();
        if (data.ok && data.job?.id) {
          onJobCreated(data.job.id);
          return;
        }

        const message = Array.isArray(data.errors)
          ? data.errors.join(" ")
          : data.error || data?.errors?.join(" ") || "Generation failed. Please try again.";
        setFormError(message);
        toast({ title: "Generation failed", message, variant: "danger" });
      } catch {
        setFormError("Error connecting to server.");
        toast({
          title: "Network error",
          message: "Could not reach the server.",
          variant: "danger",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [focusField, formData, onJobCreated, toast, validate]
  );

  const topErrors = React.useMemo(() => {
    if (!submitted) return [];
    return Object.entries(errors)
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => ({ field: k, message: v }));
  }, [errors, submitted]);

  return {
    clampInt,
    pages,
    formData,
    setFormData,
    errors,
    setErrors,
    formError,
    setFormError,
    submitted,
    isGenerating,
    topErrors,
    setField,
    focusField,
    handleSubmit,
  };
};

