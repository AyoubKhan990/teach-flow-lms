import React from "react";
import { ArrowLeft, Download, Minus, Plus, Wand2 } from "lucide-react";
import { CV_TEMPLATES } from "../data/templates";
import { useCvMaker } from "../state/useCvMaker";
import { CV_VIEWS } from "../state/cvMakerState";
import styles from "../styles/cvMaker.module.css";
import { renderCvHtml } from "../utils/renderCv";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../hooks/useAuth";

const BASE_URL = import.meta.env.VITE_API_URL;

const STEPS = ["personal", "summary", "experience", "education", "skills"];

const guidance = {
  personal: {
    title: "Add your key personal details",
    body: "Start with your name, job title, and contact details. Upload a clear square photo (optional).",
  },
  summary: {
    title: "Write a strong professional summary",
    body: "Keep it 3–5 lines. Mention your specialty, achievements, and what role you want.",
  },
  experience: {
    title: "Add your most relevant experience",
    body: "Use bullet points. Focus on impact: results, metrics, tools, and responsibilities.",
  },
  education: {
    title: "List your education and certifications",
    body: "Add degree, institution, and year. Include certifications if relevant.",
  },
  skills: {
    title: "Add skills recruiters scan for",
    body: "Add technical skills first, then soft skills. Keep it concise and specific.",
  },
};

function clampInt(n, min, max) {
  const v = Number.parseInt(n, 10);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function isValidEmail(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateStep(step, data) {
  const errors = {};
  if (step === "personal") {
    if (!String(data.personal.fullName || "").trim()) errors.fullName = "Full name is required.";
    if (!String(data.personal.jobTitle || "").trim()) errors.jobTitle = "Job title is required.";
    if (!isValidEmail(data.personal.email)) errors.email = "Enter a valid email address.";
  }
  if (step === "experience") {
    const items = Array.isArray(data.experience) ? data.experience : [];
    const ok = items.some((x) => String(x?.title || "").trim() || String(x?.company || "").trim());
    if (!ok) errors.experience = "Add at least one role (title or company).";
  }
  if (step === "education") {
    const items = Array.isArray(data.education) ? data.education : [];
    const ok = items.some((x) => String(x?.degree || "").trim() || String(x?.school || "").trim());
    if (!ok) errors.education = "Add at least one education entry.";
  }
  if (step === "skills") {
    if (!String(data.skills.technical || "").trim()) errors.technical = "Add at least a few technical skills.";
  }
  return errors;
}

function formatDateYYYYMMDD(date) {
  const d = date instanceof Date ? date : new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeFilenamePart(value, fallback) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/gi, "");
  return clean || fallback;
}

function buildCvFilename(fullName) {
  const name = sanitizeFilenamePart(fullName, "User");
  const date = formatDateYYYYMMDD(new Date());
  return `CV_${name}_${date}.pdf`;
}

async function downloadPdf(cvElement, filename) {
  const mod = await import("html2pdf.js");
  const html2pdf = mod?.default || mod;

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "0";
  wrapper.style.width = "210mm";
  wrapper.style.background = "white";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";
  wrapper.style.pointerEvents = "none";

  const clone = cvElement.cloneNode(true);
  clone.classList.add("printing-mode");
  clone.style.width = "209mm";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.transform = "none";
  clone.style.transformOrigin = "top center";
  clone.style.maxHeight = "none";
  clone.style.height = "auto";
  clone.style.minHeight = "0";
  clone.style.overflow = "visible";
  clone.style.background = "white";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const A4_HEIGHT_MM = 296;
    const contentHeightPX = clone.scrollHeight;
    const contentHeightMM = contentHeightPX / 3.78;

    let scaleFactor = 1;
    if (contentHeightMM > A4_HEIGHT_MM) {
      scaleFactor = (A4_HEIGHT_MM / contentHeightMM) * 0.99;
      if (scaleFactor < 0.6) scaleFactor = 0.6;
      clone.style.transform = `scale(${scaleFactor})`;
      clone.style.transformOrigin = "top center";
    }

    const expectedPages = Math.max(1, Math.ceil((contentHeightMM * scaleFactor) / A4_HEIGHT_MM));

    const worker = html2pdf()
      .set({
        margin: 0,
        filename: filename || "CV.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(clone)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const total = pdf.internal.getNumberOfPages();
        if (total <= expectedPages) return;
        for (let i = total; i > expectedPages; i -= 1) {
          pdf.deletePage(i);
        }
      });

    await worker.save();
  } finally {
    wrapper.remove();
  }
}

function fallbackSummary(jobTitle, skills) {
  const skillsList = String(skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const list = skillsList || "problem-solving, leadership, and communication";
  return `Results-driven ${jobTitle || "professional"} with a proven track record of delivering exceptional outcomes. Skilled in ${list}, with a passion for driving innovation and achieving organizational goals. Committed to continuous improvement and excellence in all professional endeavors.`;
}

function fallbackExperience(jobTitle, company) {
  return `• Managed and optimized key projects for ${company || "the organization"} as a ${jobTitle || "professional"}.\n• Collaborated with cross-functional teams to achieve organizational goals.\n• Implemented new processes that increased efficiency and productivity.\n• Delivered high-quality results within strict deadlines and budgets.`;
}

export function EditorView() {
  const { state, dispatch } = useCvMaker();
  const { startGoogleSignIn } = useAuth();
  const [stepErrors, setStepErrors] = React.useState({});
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [resumeLoading, setResumeLoading] = React.useState(false);
  const [saveState, setSaveState] = React.useState({ status: "idle", message: "" });
  const saveTimerRef = React.useRef(0);
  const saveAbortRef = React.useRef(null);

  const template = React.useMemo(
    () => CV_TEMPLATES.find((t) => t.id === state.templateId) || CV_TEMPLATES[0],
    [state.templateId]
  );

  React.useEffect(() => {
    if (!state.resumeId) return;
    let cancelled = false;
    setResumeLoading(true);
    setSaveState({ status: "idle", message: "" });

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/resumes/${state.resumeId}`, {
          credentials: "include",
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load resume");
        if (cancelled) return;
        dispatch({
          type: "LOAD_RESUME",
          resumeId: json._id,
          title: json.title,
          status: json.status,
          templateId: json.templateId,
          data: json.data,
        });
      } catch (e) {
        if (!cancelled) {
          dispatch({
            type: "TOAST",
            toast: { type: "danger", title: "Couldn’t load resume", message: e.message || "Try again." },
          });
        }
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, startGoogleSignIn, state.resumeId]);

  const stepIndex = STEPS.indexOf(state.step);
  const activeStep = stepIndex >= 0 ? state.step : "personal";

  const previewRef = React.useRef(null);
  const paperRef = React.useRef(null);

  const previewHtml = React.useMemo(
    () =>
      renderCvHtml({
        templateId: template.id,
        templateFormat: template.format,
        data: state.data,
      }),
    [state.data, template.format, template.id]
  );

  React.useEffect(() => {
    if (!paperRef.current) return;
    const paper = paperRef.current;
    paper.innerHTML = previewHtml;
  }, [previewHtml]);

  React.useEffect(() => {
    if (!state.resumeId) return;
    if (resumeLoading) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaveState({ status: "pending", message: "Saving…" });

    saveTimerRef.current = window.setTimeout(async () => {
      if (saveAbortRef.current) saveAbortRef.current.abort();
      const controller = new AbortController();
      saveAbortRef.current = controller;
      setSaveState({ status: "saving", message: "Saving…" });

      try {
        const res = await fetch(`${BASE_URL}/api/resumes/${state.resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            title: state.resumeTitle || "Untitled Resume",
            status: state.resumeStatus || "draft",
            templateId: state.templateId,
            data: state.data,
          }),
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to save");
        setSaveState({ status: "saved", message: "Saved" });
      } catch (e) {
        if (e.name === "AbortError") return;
        setSaveState({ status: "error", message: "Save failed" });
      } finally {
        saveAbortRef.current = null;
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [
    resumeLoading,
    startGoogleSignIn,
    state.data,
    state.resumeId,
    state.resumeStatus,
    state.resumeTitle,
    state.templateId,
  ]);

  React.useEffect(() => {
    const scroll = previewRef.current;
    const paper = paperRef.current;
    if (!scroll || !paper) return;

    const update = () => {
      const containerWidth = scroll.clientWidth - 64;
      const pageWidth = 794;
      let baseScale = containerWidth / pageWidth;
      if (baseScale > 1.2) baseScale = 1.2;
      const finalScale = baseScale * (state.zoom / 100);
      paper.style.transform = `scale(${finalScale})`;
      paper.style.transformOrigin = "top center";
      const scaledHeight = 1123 * finalScale;
      paper.style.marginBottom = `-${1123 - scaledHeight}px`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(scroll);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [state.zoom]);

  const setToast = React.useCallback(
    (toast) => dispatch({ type: "TOAST", toast }),
    [dispatch]
  );

  const onNext = () => {
    const errs = validateStep(activeStep, state.data);
    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      setToast({ variant: "danger", title: "Fix highlighted fields", message: "Complete required fields to continue." });
      return;
    }
    const idx = STEPS.indexOf(activeStep);
    if (idx < STEPS.length - 1) dispatch({ type: "SET_STEP", step: STEPS[idx + 1] });
  };

  const onPrev = () => {
    const idx = STEPS.indexOf(activeStep);
    if (idx > 0) dispatch({ type: "SET_STEP", step: STEPS[idx - 1] });
  };

  const setPersonal = (patch) => {
    setStepErrors((prev) => ({ ...prev, fullName: undefined, jobTitle: undefined, email: undefined }));
    dispatch({ type: "PATCH_PERSONAL", patch });
  };

  const patchData = (patch) => dispatch({ type: "PATCH_DATA", patch });

  const setExperience = (updater) => {
    patchData({
      experience: updater(Array.isArray(state.data.experience) ? state.data.experience : []),
    });
  };

  const setEducation = (updater) => {
    patchData({
      education: updater(Array.isArray(state.data.education) ? state.data.education : []),
    });
  };

  const handlePhoto = async (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setToast({ variant: "danger", title: "Invalid file", message: "Please upload an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ variant: "danger", title: "Image too large", message: "Please upload a file under 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => patchData({ photo: e.target.result });
    reader.readAsDataURL(file);
  };

  const generateSummary = async () => {
    setAiLoading(true);
    try {
      patchData({ summary: fallbackSummary(state.data.personal.jobTitle, state.data.skills.technical) });
      setToast({ variant: "success", title: "Summary added", message: "You can edit it anytime." });
    } finally {
      setAiLoading(false);
    }
  };

  const generateExpForIndex = async (i) => {
    setAiLoading(true);
    try {
      const item = state.data.experience?.[i] || {};
      const next = fallbackExperience(item.title, item.company);
      setExperience((prev) =>
        prev.map((x, idx) => (idx === i ? { ...x, description: next } : x))
      );
      setToast({ variant: "success", title: "Description generated", message: "Review and customize for accuracy." });
    } finally {
      setAiLoading(false);
    }
  };

  const onDownload = async () => {
    const container = paperRef.current?.querySelector?.(".cv-container");
    if (!container) {
      setToast({ variant: "danger", title: "Preview not ready", message: "Please try again." });
      return;
    }
    setPdfLoading(true);
    try {
      await downloadPdf(container, buildCvFilename(state.data.personal.fullName));
      setToast({ variant: "success", title: "Download started", message: "Your PDF is being generated." });
    } catch {
      setToast({ variant: "danger", title: "PDF export failed", message: "Please try again." });
    } finally {
      setPdfLoading(false);
    }
  };

  const onFinish = async () => {
    const allErrors = STEPS.reduce((acc, step) => ({ ...acc, ...validateStep(step, state.data) }), {});
    setStepErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstStepWithError =
        allErrors.fullName || allErrors.jobTitle || allErrors.email
          ? "personal"
          : allErrors.experience
            ? "experience"
            : allErrors.education
              ? "education"
              : allErrors.technical
                ? "skills"
                : "personal";
      dispatch({ type: "SET_STEP", step: firstStepWithError });
      setToast({ variant: "danger", title: "Fix highlighted fields", message: "Complete required fields to finish." });
      return;
    }
    await onDownload();
  };

  const zoomIn = () => dispatch({ type: "SET_ZOOM", zoom: clampInt(state.zoom + 10, 30, 200) });
  const zoomOut = () => dispatch({ type: "SET_ZOOM", zoom: clampInt(state.zoom - 10, 30, 200) });

  const g = guidance[activeStep] || guidance.personal;

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={state.resumeTitle || ""}
                onChange={(e) =>
                  dispatch({ type: "SET_RESUME_META", title: e.target.value })
                }
                placeholder="Untitled Resume"
                className="h-11 w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white px-4 text-base font-extrabold tracking-tight text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 sm:text-lg"
              />
              <select
                value={state.resumeStatus || "draft"}
                onChange={(e) =>
                  dispatch({ type: "SET_RESUME_META", status: e.target.value })
                }
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Resume status"
              >
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          }
          subtitle="Changes save automatically while you edit."
          right={
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-xs font-extrabold text-slate-500">
                {saveState.message}
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "NAVIGATE", view: CV_VIEWS.dashboard })}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-900/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={onDownload}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {pdfLoading ? "Processing…" : "Download PDF"}
              </button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-extrabold text-slate-900">
                Step {Math.max(1, stepIndex + 1)} of {STEPS.length}: {g.title}
              </div>
              <div className="mt-2 text-sm text-slate-600">{g.body}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {STEPS.map((s) => {
                const active = s === activeStep;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => dispatch({ type: "SET_STEP", step: s })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? "bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {activeStep === "personal" && (
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                      {state.data.photo ? (
                        <img src={state.data.photo} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-xs font-bold text-slate-500">Photo</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-700">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhoto(e.target.files?.[0])}
                        />
                      </label>
                      {state.data.photo && (
                        <button
                          type="button"
                          onClick={() => patchData({ photo: null })}
                          className="text-left text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Full Name</div>
                      <input
                        value={state.data.personal.fullName}
                        onChange={(e) => setPersonal({ fullName: e.target.value })}
                        className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.fullName ? "border-red-300" : "border-slate-200"
                        }`}
                        placeholder="Richard Sanchez"
                      />
                      {stepErrors.fullName && <div className="mt-1 text-xs font-semibold text-red-600">{stepErrors.fullName}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Job Title</div>
                      <input
                        value={state.data.personal.jobTitle}
                        onChange={(e) => setPersonal({ jobTitle: e.target.value })}
                        className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.jobTitle ? "border-red-300" : "border-slate-200"
                        }`}
                        placeholder="Marketing Manager"
                      />
                      {stepErrors.jobTitle && <div className="mt-1 text-xs font-semibold text-red-600">{stepErrors.jobTitle}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Email</div>
                      <input
                        value={state.data.personal.email}
                        onChange={(e) => setPersonal({ email: e.target.value })}
                        className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.email ? "border-red-300" : "border-slate-200"
                        }`}
                        placeholder="hello@site.com"
                      />
                      {stepErrors.email && <div className="mt-1 text-xs font-semibold text-red-600">{stepErrors.email}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Phone</div>
                      <input
                        value={state.data.personal.phone}
                        onChange={(e) => setPersonal({ phone: e.target.value })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+123-456-7890"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm font-semibold text-slate-900">Address</div>
                      <input
                        value={state.data.personal.address}
                        onChange={(e) => setPersonal({ address: e.target.value })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Anywhere St., Any City"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">GitHub</div>
                      <input
                        value={state.data.personal.github || ""}
                        onChange={(e) => setPersonal({ github: e.target.value })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="github.com/username"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">LinkedIn</div>
                      <input
                        value={state.data.personal.linkedin}
                        onChange={(e) => setPersonal({ linkedin: e.target.value })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Website</div>
                      <input
                        value={state.data.personal.website}
                        onChange={(e) => setPersonal({ website: e.target.value })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === "summary" && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-slate-900">Professional summary</div>
                    <button
                      type="button"
                      onClick={generateSummary}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-900/10 disabled:opacity-60"
                    >
                      <Wand2 className="h-4 w-4" />
                      {aiLoading ? "Generating…" : "AI Generate"}
                    </button>
                  </div>
                  <textarea
                    value={state.data.summary}
                    onChange={(e) => patchData({ summary: e.target.value })}
                    className="mt-3 min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write 3–5 lines highlighting expertise, strengths, and achievements."
                  />
                </div>
              )}

              {activeStep === "experience" && (
                <div className="space-y-4">
                  {stepErrors.experience && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{stepErrors.experience}</div>}
                  {(state.data.experience || []).map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-slate-900">Role #{idx + 1}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => generateExpForIndex(idx)}
                            disabled={aiLoading}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-900/10 disabled:opacity-60"
                          >
                            <Wand2 className="h-4 w-4" />
                            AI Generate
                          </button>
                          <button
                            type="button"
                            onClick={() => setExperience((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Job Title</div>
                          <input
                            value={item.title}
                            onChange={(e) =>
                              setExperience((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Company</div>
                          <input
                            value={item.company}
                            onChange={(e) =>
                              setExperience((prev) => prev.map((x, i) => (i === idx ? { ...x, company: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Start</div>
                          <input
                            value={item.start}
                            onChange={(e) =>
                              setExperience((prev) => prev.map((x, i) => (i === idx ? { ...x, start: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="2020"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">End</div>
                          <input
                            value={item.end}
                            onChange={(e) =>
                              setExperience((prev) => prev.map((x, i) => (i === idx ? { ...x, end: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Present"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-sm font-semibold text-slate-900">Description</div>
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              setExperience((prev) => prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))
                            }
                            className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={"• Achievement 1\n• Achievement 2\n• Achievement 3"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setExperience((prev) => [...prev, { title: "", company: "", start: "", end: "", description: "" }])
                    }
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    + Add experience
                  </button>
                </div>
              )}

              {activeStep === "education" && (
                <div className="space-y-4">
                  {stepErrors.education && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{stepErrors.education}</div>}
                  {(state.data.education || []).map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-slate-900">Education #{idx + 1}</div>
                        <button
                          type="button"
                          onClick={() => setEducation((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Degree / Certificate</div>
                          <input
                            value={item.degree}
                            onChange={(e) =>
                              setEducation((prev) => prev.map((x, i) => (i === idx ? { ...x, degree: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Institution</div>
                          <input
                            value={item.school}
                            onChange={(e) =>
                              setEducation((prev) => prev.map((x, i) => (i === idx ? { ...x, school: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Year</div>
                          <input
                            value={item.year}
                            onChange={(e) =>
                              setEducation((prev) => prev.map((x, i) => (i === idx ? { ...x, year: e.target.value } : x)))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="2018 - 2022"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEducation((prev) => [...prev, { degree: "", school: "", year: "" }])}
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    + Add education
                  </button>
                </div>
              )}

              {activeStep === "skills" && (
                <div className="grid gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Technical skills (comma separated)</div>
                    <input
                      value={state.data.skills.technical}
                      onChange={(e) => patchData({ skills: { ...state.data.skills, technical: e.target.value } })}
                      className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                        stepErrors.technical ? "border-red-300" : "border-slate-200"
                      }`}
                      placeholder="JavaScript, Python, Project Management"
                    />
                    {stepErrors.technical && <div className="mt-1 text-xs font-semibold text-red-600">{stepErrors.technical}</div>}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Soft skills (comma separated)</div>
                    <input
                      value={state.data.skills.soft}
                      onChange={(e) => patchData({ skills: { ...state.data.skills, soft: e.target.value } })}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leadership, Communication, Teamwork"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Languages</div>
                    <input
                      value={state.data.skills.languages}
                      onChange={(e) => patchData({ skills: { ...state.data.skills, languages: e.target.value } })}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="English, Spanish"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={stepIndex <= 0}
                  className="rounded-full bg-slate-900/5 px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-900/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={stepIndex >= STEPS.length - 1 ? onFinish : onNext}
                  disabled={pdfLoading}
                  className={`rounded-full px-5 py-3 text-sm font-extrabold text-white disabled:opacity-40 ${
                    stepIndex >= STEPS.length - 1
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {stepIndex >= STEPS.length - 1 ? (pdfLoading ? "Finishing…" : "Finish") : "Next"}
                </button>
              </div>
            </div>
          </div>

          <div className={`${styles.previewArea} ${styles.card}`}>
            <div className={styles.previewToolbar}>
              <div className="text-sm font-semibold">Live Preview</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={zoomOut}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/15"
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="min-w-[56px] text-center text-sm font-semibold">{state.zoom}%</div>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/15"
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div ref={previewRef} className={styles.previewScroll}>
              <div ref={paperRef} className={styles.paper} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

