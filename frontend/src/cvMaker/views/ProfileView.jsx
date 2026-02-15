import React from "react";
import { Link2, Save, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePreferences } from "../../hooks/usePreferences";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Switch } from "../../components/ui/Switch";

const BASE_URL = import.meta.env.VITE_API_URL || "";

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function countWords(text) {
  const s = typeof text === "string" ? text.trim() : "";
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

function insertAroundSelection(textarea, before, after) {
  if (!textarea) return;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value ?? "";
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length + after.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

async function imageFileToDataUrl(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return `data:${file.type};base64,${btoa(binary)}`;
}

async function loadImage(dataUrl) {
  const img = new Image();
  img.decoding = "async";
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cropToSquareDataUrl(img, { zoom, offsetX, offsetY, size = 512 }) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  const base = Math.min(iw, ih);
  const crop = base / clamp(zoom, 1, 3);

  const cx = iw / 2 + offsetX * (iw / 2);
  const cy = ih / 2 + offsetY * (ih / 2);
  const sx = clamp(cx - crop / 2, 0, iw - crop);
  const sy = clamp(cy - crop / 2, 0, ih - crop);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, crop, crop, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function ProfileView() {
  const { startGoogleSignIn, refreshUser, isAuthenticated, loading: authLoading } = useAuth();
  const { setLanguage, setTheme } = usePreferences();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [autoSaving, setAutoSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState({ status: "idle", message: "" });
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    professionalTitle: "",
    summaryMd: "",
    socials: { linkedin: "", github: "", twitter: "", website: "" },
    visibility: "private",
    picture: "",
  });

  const [crop, setCrop] = React.useState({
    source: "",
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    dragStart: null,
  });

  const textareaRef = React.useRef(null);
  const dirtyRef = React.useRef(false);

  const validate = React.useCallback((next) => {
    const errs = {};
    if (!next.name.trim()) errs.name = "Full name is required.";
    const words = countWords(next.summaryMd);
    if (words > 500) errs.summaryMd = "Summary exceeds 500 words.";
    for (const k of ["linkedin", "github", "twitter", "website"]) {
      const v = next.socials?.[k] || "";
      if (v && !isValidHttpUrl(v)) errs[`social_${k}`] = "Enter a valid URL (http/https).";
    }
    return errs;
  }, []);

  const [errors, setErrors] = React.useState({});

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const loadProfile = React.useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/profile`, { credentials: "include" });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to load profile");

      const profile = json.profile || {};
      const settings = json.settings || {};

      setForm({
        name: json.user?.name || "",
        email: json.user?.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        professionalTitle: profile.professionalTitle || "",
        summaryMd: profile.summaryMd || "",
        socials: {
          linkedin: profile.socials?.linkedin || "",
          github: profile.socials?.github || "",
          twitter: profile.socials?.twitter || "",
          website: profile.socials?.website || "",
        },
        visibility: profile.visibility || "private",
        picture: json.user?.picture || "",
      });

      if (settings?.theme) setTheme(settings.theme);
      if (settings?.language) setLanguage(settings.language);

      dirtyRef.current = false;
      setErrors({});
    } catch (e) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [setLanguage, setTheme, startGoogleSignIn]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }
    loadProfile();
  }, [authLoading, isAuthenticated, loadProfile, startGoogleSignIn]);

  React.useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  const saveProfile = React.useCallback(
    async ({ autosave } = {}) => {
      const nextErrors = validate(form);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return false;

      setError("");
      if (autosave) setAutoSaving(true);
      else setSaving(true);
      try {
        const res = await fetch(`${BASE_URL}/api/user/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            location: form.location,
            professionalTitle: form.professionalTitle,
            summaryMd: form.summaryMd,
            socials: form.socials,
            visibility: form.visibility,
            picture: form.picture,
          }),
        });
        if (res.status === 401) {
          startGoogleSignIn();
          return false;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to save profile");
        await refreshUser();
        dirtyRef.current = false;
        setSaveState({ status: "saved", message: "Saved" });
        return true;
      } catch (e) {
        setError(e.message || "Failed to save profile");
        setSaveState({ status: "error", message: "Save failed" });
        return false;
      } finally {
        setSaving(false);
        setAutoSaving(false);
      }
    },
    [form, refreshUser, startGoogleSignIn, validate]
  );

  React.useEffect(() => {
    const t = window.setInterval(() => {
      if (!dirtyRef.current) return;
      if (saving || autoSaving) return;
      saveProfile({ autosave: true });
    }, 30000);
    return () => window.clearInterval(t);
  }, [autoSaving, saveProfile, saving]);

  const onPickFile = async (file) => {
    setError("");
    if (!file) return;
    if (!(file.type === "image/jpeg" || file.type === "image/png")) {
      setError("Only JPEG/PNG images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large (max 5MB).");
      return;
    }
    const dataUrl = await imageFileToDataUrl(file);
    setCrop({ source: dataUrl, zoom: 1, offsetX: 0, offsetY: 0, dragging: false, dragStart: null });
  };

  const applyCropped = async () => {
    if (!crop.source) return;
    try {
      const img = await loadImage(crop.source);
      const out = cropToSquareDataUrl(img, crop);
      setForm((p) => ({ ...p, picture: out }));
      setCrop((c) => ({ ...c, source: "" }));
      markDirty();
    } catch {
      setError("Failed to process image.");
    }
  };

  const cropBoxHandlers = {
    onMouseDown: (e) => {
      if (!crop.source) return;
      setCrop((c) => ({ ...c, dragging: true, dragStart: { x: e.clientX, y: e.clientY, ox: c.offsetX, oy: c.offsetY } }));
    },
    onMouseMove: (e) => {
      if (!crop.dragging || !crop.dragStart) return;
      const dx = (e.clientX - crop.dragStart.x) / 180;
      const dy = (e.clientY - crop.dragStart.y) / 180;
      setCrop((c) => ({
        ...c,
        offsetX: clamp(crop.dragStart.ox + dx, -1, 1),
        offsetY: clamp(crop.dragStart.oy + dy, -1, 1),
      }));
    },
    onMouseUp: () => {
      if (!crop.dragging) return;
      setCrop((c) => ({ ...c, dragging: false, dragStart: null }));
    },
    onMouseLeave: () => {
      if (!crop.dragging) return;
      setCrop((c) => ({ ...c, dragging: false, dragStart: null }));
    },
  };

  const summaryWords = countWords(form.summaryMd);

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Profile"
          subtitle="Your profile powers defaults across TeachFlow and CV Maker."
          right={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold text-[color:var(--tf-text-subtle)]">
                {autoSaving ? "Auto-saving…" : saveState.message ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--tf-success)]" />
                    {saveState.message}
                  </span>
                ) : (
                  " "
                )}
              </div>
              <Button variant="primary" onClick={() => saveProfile()} disabled={saving || loading}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          }
        />

        {error ? <Alert className="mb-4" variant="danger" title="Profile error">{error}</Alert> : null}

        {loading ? (
          <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-6 shadow-[var(--tf-shadow-sm)]">
            <div className="text-sm font-semibold text-[color:var(--tf-text-muted)]">Loading profile…</div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Profile photo</div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]">
                    <ImageIcon className="h-4 w-4" />
                    Upload
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
                  </label>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-bg)]">
                    {form.picture ? <img src={form.picture} alt="Profile" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="text-xs text-[color:var(--tf-text-muted)]">
                    JPEG/PNG, max 5MB. Square crop supported.\n                  </div>
                </div>

                {crop.source ? (
                  <div className="mt-5 rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-bg)] p-4">
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Crop</div>
                    <div
                      className="mt-3 h-[180px] w-[180px] overflow-hidden rounded-2xl border border-[color:var(--tf-border)] bg-black/5"
                      style={{
                        backgroundImage: `url(${crop.source})`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: `${50 + crop.offsetX * 30}% ${50 + crop.offsetY * 30}%`,
                        backgroundSize: `${crop.zoom * 140}%`,
                        cursor: "grab",
                      }}
                      {...cropBoxHandlers}
                    />
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-[color:var(--tf-text-muted)]">Zoom</div>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={crop.zoom}
                        onChange={(e) => setCrop((c) => ({ ...c, zoom: Number(e.target.value) }))}
                        className="mt-2 w-full"
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="primary" onClick={applyCropped}>
                        Use photo
                      </Button>
                      <Button variant="secondary" onClick={() => setCrop((c) => ({ ...c, source: "" }))}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="profileName"
                    label="Full name"
                    value={form.name}
                    error={errors.name}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      markDirty();
                    }}
                  />
                  <Input id="profileEmail" label="Email" value={form.email} disabled />
                  <Input
                    id="profilePhone"
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }));
                      markDirty();
                    }}
                  />
                  <Input
                    id="profileLocation"
                    label="Location"
                    value={form.location}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, location: e.target.value }));
                      markDirty();
                    }}
                  />
                  <Input
                    id="profileTitle"
                    label="Professional title"
                    value={form.professionalTitle}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, professionalTitle: e.target.value }));
                      markDirty();
                    }}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Professional summary</div>
                  <div className={`text-xs font-semibold ${summaryWords > 500 ? "text-rose-700" : "text-[color:var(--tf-text-muted)]"}`}>
                    {summaryWords}/500 words
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertAroundSelection(textareaRef.current, "**", "**")}
                    className="rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAroundSelection(textareaRef.current, "_", "_")}
                    className="rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAroundSelection(textareaRef.current, "\\n- ", "")}
                    className="rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                  >
                    Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAroundSelection(textareaRef.current, "[", "](https://)")}
                    className="rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--tf-text)] hover:bg-[color:var(--tf-surface-muted)]"
                  >
                    Link
                  </button>
                </div>

                <Textarea
                  id="profileSummary"
                  inputClassName="min-h-[160px]"
                  value={form.summaryMd}
                  error={errors.summaryMd}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, summaryMd: e.target.value }));
                    markDirty();
                  }}
                  ref={(node) => {
                    textareaRef.current = node;
                  }}
                />
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Social links</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    id="socialLinkedIn"
                    label="LinkedIn"
                    value={form.socials.linkedin}
                    error={errors.social_linkedin}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, socials: { ...p.socials, linkedin: e.target.value } }));
                      markDirty();
                    }}
                  />
                  <Input
                    id="socialGithub"
                    label="GitHub"
                    value={form.socials.github}
                    error={errors.social_github}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, socials: { ...p.socials, github: e.target.value } }));
                      markDirty();
                    }}
                  />
                  <Input
                    id="socialTwitter"
                    label="Twitter"
                    value={form.socials.twitter}
                    error={errors.social_twitter}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, socials: { ...p.socials, twitter: e.target.value } }));
                      markDirty();
                    }}
                  />
                  <Input
                    id="socialWebsite"
                    label="Website"
                    value={form.socials.website}
                    error={errors.social_website}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, socials: { ...p.socials, website: e.target.value } }));
                      markDirty();
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[color:var(--tf-text-muted)]">
                  <Link2 className="h-4 w-4" />
                  Only http/https links are allowed.\n                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Profile visibility</div>
                    <select
                      value={form.visibility}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, visibility: e.target.value }));
                        markDirty();
                      }}
                      className="mt-2 h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Switch
                      checked={form.visibility === "public"}
                      onCheckedChange={(v) => {
                        setForm((p) => ({ ...p, visibility: v ? "public" : "private" }));
                        markDirty();
                      }}
                      label="Public profile"
                      description="Allows other users to view your profile."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
