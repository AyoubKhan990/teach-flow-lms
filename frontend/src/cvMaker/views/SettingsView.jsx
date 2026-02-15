import React from "react";
import { Download, Shield, Trash2, Lock, QrCode } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePreferences } from "../../hooks/usePreferences";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { Alert } from "../../components/ui/Alert";
import { Dialog } from "../../components/ui/Dialog";
import { Spinner } from "../../components/ui/Spinner";

const BASE_URL = import.meta.env.VITE_API_URL || "";

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function strengthLabel(pwd) {
  const s = String(pwd || "");
  let score = 0;
  if (s.length >= 8) score += 1;
  if (s.length >= 12) score += 1;
  if (/[A-Z]/.test(s)) score += 1;
  if (/[0-9]/.test(s)) score += 1;
  if (/[^A-Za-z0-9]/.test(s)) score += 1;
  if (score <= 1) return { label: "Weak", color: "text-rose-700" };
  if (score <= 3) return { label: "Good", color: "text-amber-700" };
  return { label: "Strong", color: "text-emerald-700" };
}

export function SettingsView() {
  const { startGoogleSignIn, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const { theme, setTheme, language, setLanguage } = usePreferences();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [settings, setSettings] = React.useState({
    theme: "auto",
    language: "en",
    notifications: { email: true, push: false, inApp: true },
    privacy: { dataSharing: false, gdpr: true },
    tutorials: { cvMaker: true },
    account: { status: "active" },
  });

  const [security, setSecurity] = React.useState({ hasPassword: false, twoFactorEnabled: false });

  const [pwdSet, setPwdSet] = React.useState({ password: "", confirm: "" });
  const [pwdChange, setPwdChange] = React.useState({ current: "", next: "", confirm: "" });

  const [twoFa, setTwoFa] = React.useState({
    loading: false,
    qrDataUrl: "",
    otpauthUrl: "",
    token: "",
    recoveryCodes: [],
    disableToken: "",
    disableRecovery: "",
  });

  const [sessions, setSessions] = React.useState({ loading: false, items: [] });

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");

  const loadSettings = React.useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/settings`, { credentials: "include" });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to load settings");
      setSettings((prev) => ({ ...prev, ...(json.settings || {}) }));
      setSecurity(json.security || { hasPassword: false, twoFactorEnabled: false });
      if (json.settings?.theme) setTheme(json.settings.theme);
      if (json.settings?.language) setLanguage(json.settings.language);
    } catch (e) {
      setError(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [setLanguage, setTheme, startGoogleSignIn]);

  const loadSessions = React.useCallback(async () => {
    setSessions((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${BASE_URL}/api/user/sessions`, { credentials: "include" });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to load sessions");
      setSessions({ loading: false, items: json.sessions || [] });
    } catch {
      setSessions({ loading: false, items: [] });
    }
  }, [startGoogleSignIn]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }
    loadSettings();
    loadSessions();
  }, [authLoading, isAuthenticated, loadSessions, loadSettings, startGoogleSignIn]);

  const saveSettings = async (patch) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to save settings");
      setSettings((p) => ({ ...p, ...(json.settings || {}) }));
      if (patch.theme) setTheme(patch.theme);
      if (patch.language) setLanguage(patch.language);
      setSuccess("Saved settings.");
      await refreshUser();
    } catch (e) {
      setError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSuccess(""), 2500);
    }
  };

  const onExport = async (fmt) => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/user/export?format=${encodeURIComponent(fmt)}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Export failed");
      }
      const blob = await res.blob();
      downloadBlob(`teachflow-export.${fmt === "xml" ? "xml" : "json"}`, blob);
    } catch (e) {
      setError(e.message || "Export failed");
    }
  };

  const onExportPdf = async () => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/user/export?format=json`, {
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json();
      const html = `
        <div style="font-family: ui-sans-serif, system-ui; padding:24px;">
          <h1 style="margin:0 0 8px;">TeachFlow Data Export</h1>
          <div style="color:#475569; margin:0 0 16px;">Generated ${new Date().toLocaleString()}</div>
          <pre style="white-space:pre-wrap; font-size:11px; line-height:1.4; background:#f8fafc; padding:16px; border-radius:12px;">${escapeHtml(
            JSON.stringify(json, null, 2)
          )}</pre>
        </div>
      `;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      const mod = await import("html2pdf.js");
      const html2pdf = mod?.default || mod;
      await html2pdf()
        .set({
          margin: 10,
          filename: "teachflow-export.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(wrapper)
        .save();
    } catch (e) {
      setError(e.message || "PDF export failed");
    }
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const setPassword = async () => {
    setError("");
    setSuccess("");
    if (pwdSet.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pwdSet.password !== pwdSet.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/security/password/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pwdSet.password }),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to set password");
      setPwdSet({ password: "", confirm: "" });
      setSuccess("Password set.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Failed to set password");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setError("");
    setSuccess("");
    if (pwdChange.next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (pwdChange.next !== pwdChange.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/security/password/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: pwdChange.current, newPassword: pwdChange.next }),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to change password");
      setPwdChange({ current: "", next: "", confirm: "" });
      setSuccess("Password updated.");
    } catch (e) {
      setError(e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const start2fa = async () => {
    setError("");
    setTwoFa((s) => ({ ...s, loading: true, qrDataUrl: "", otpauthUrl: "", token: "", recoveryCodes: [] }));
    try {
      const res = await fetch(`${BASE_URL}/api/user/security/2fa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to start 2FA setup");
      setTwoFa((s) => ({ ...s, loading: false, qrDataUrl: json.qrDataUrl || "", otpauthUrl: json.otpauthUrl || "" }));
    } catch (e) {
      setError(e.message || "Failed to start 2FA");
      setTwoFa((s) => ({ ...s, loading: false }));
    }
  };

  const verify2fa = async () => {
    setError("");
    setTwoFa((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${BASE_URL}/api/user/security/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: twoFa.token }),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Invalid token");
      setTwoFa((s) => ({ ...s, loading: false, recoveryCodes: json.recoveryCodes || [] }));
      setSuccess("2FA enabled. Save your recovery codes.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Failed to verify 2FA");
      setTwoFa((s) => ({ ...s, loading: false }));
    }
  };

  const disable2fa = async () => {
    setError("");
    setTwoFa((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${BASE_URL}/api/user/security/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: twoFa.disableToken || undefined,
          recoveryCode: twoFa.disableRecovery || undefined,
        }),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to disable 2FA");
      setTwoFa((s) => ({ ...s, loading: false, disableToken: "", disableRecovery: "", qrDataUrl: "", otpauthUrl: "", token: "", recoveryCodes: [] }));
      setSuccess("2FA disabled.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Failed to disable 2FA");
      setTwoFa((s) => ({ ...s, loading: false }));
    }
  };

  const revokeSession = async (sid) => {
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/user/sessions/${encodeURIComponent(sid)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to revoke session");
      await loadSessions();
    } catch (e) {
      setError(e.message || "Failed to revoke session");
    }
  };

  const deactivate = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/account/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to deactivate");
      setSuccess("Account deactivated.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Failed to deactivate");
    } finally {
      setSaving(false);
    }
  };

  const reactivate = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/account/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to reactivate");
      setSuccess("Account reactivated.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Failed to reactivate");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setError("");
    if (deleteConfirm.trim() !== "DELETE") {
      setError('Type "DELETE" to confirm.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/account`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to delete account");
      window.location.href = "/";
    } catch (e) {
      setError(e.message || "Failed to delete account");
    } finally {
      setSaving(false);
      setDeleteOpen(false);
      setDeleteConfirm("");
    }
  };

  const pwdStrength = security.hasPassword ? strengthLabel(pwdChange.next) : strengthLabel(pwdSet.password);

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Settings"
          subtitle="Preferences, privacy, data export, and security controls."
        />

        {error ? <Alert className="mb-4" variant="danger" title="Settings error">{error}</Alert> : null}
        {success ? <Alert className="mb-4" variant="success" title="Done">{success}</Alert> : null}

        {loading ? (
          <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-6 shadow-[var(--tf-shadow-sm)]">
            <div className="flex items-center gap-3 text-[color:var(--tf-text-muted)]">
              <Spinner />
              <span className="text-sm font-semibold">Loading settings…</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Account preferences</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--tf-text)]">Theme</div>
                    <select
                      value={settings.theme || theme}
                      onChange={(e) => {
                        const t = e.target.value;
                        setSettings((p) => ({ ...p, theme: t }));
                        saveSettings({ theme: t });
                      }}
                      className="mt-2 h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
                      disabled={saving}
                    >
                      <option value="auto">Auto</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--tf-text)]">Language</div>
                    <select
                      value={settings.language || language}
                      onChange={(e) => {
                        const l = e.target.value;
                        setSettings((p) => ({ ...p, language: l }));
                        saveSettings({ language: l });
                      }}
                      className="mt-2 h-11 w-full rounded-[var(--tf-radius-sm)] border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-3 text-sm font-semibold text-[color:var(--tf-text)] outline-none focus:ring-2 focus:ring-[color:var(--tf-ring)]"
                      disabled={saving}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <Switch
                    checked={Boolean(settings.notifications?.email)}
                    onCheckedChange={(v) => {
                      const next = { ...settings.notifications, email: v };
                      setSettings((p) => ({ ...p, notifications: next }));
                      saveSettings({ notifications: next });
                    }}
                    label="Email notifications"
                    description="Product updates, progress reminders, and account alerts."
                    disabled={saving}
                  />
                  <Switch
                    checked={Boolean(settings.notifications?.inApp)}
                    onCheckedChange={(v) => {
                      const next = { ...settings.notifications, inApp: v };
                      setSettings((p) => ({ ...p, notifications: next }));
                      saveSettings({ notifications: next });
                    }}
                    label="In-app notifications"
                    description="Show alerts inside TeachFlow."
                    disabled={saving}
                  />
                  <Switch
                    checked={Boolean(settings.notifications?.push)}
                    onCheckedChange={(v) => {
                      const next = { ...settings.notifications, push: v };
                      setSettings((p) => ({ ...p, notifications: next }));
                      saveSettings({ notifications: next });
                    }}
                    label="Push notifications"
                    description="Requires browser/device permissions."
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Privacy</div>
                <div className="mt-4 grid gap-4">
                  <Switch
                    checked={Boolean(settings.privacy?.dataSharing)}
                    onCheckedChange={(v) => {
                      const next = { ...settings.privacy, dataSharing: v };
                      setSettings((p) => ({ ...p, privacy: next }));
                      saveSettings({ privacy: next });
                    }}
                    label="Data sharing"
                    description="Allow anonymized analytics to improve TeachFlow."
                    disabled={saving}
                  />
                  <Switch
                    checked={Boolean(settings.privacy?.gdpr)}
                    onCheckedChange={(v) => {
                      const next = { ...settings.privacy, gdpr: v };
                      setSettings((p) => ({ ...p, privacy: next }));
                      saveSettings({ privacy: next });
                    }}
                    label="GDPR preferences"
                    description="Control consent preferences for data processing."
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Data export</div>
                    <div className="mt-1 text-xs text-[color:var(--tf-text-muted)]">
                      Download all your data in JSON/XML or as a PDF snapshot.
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-[color:var(--tf-text-subtle)]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => onExport("json")}>
                    Export JSON
                  </Button>
                  <Button variant="secondary" onClick={() => onExport("xml")}>
                    Export XML
                  </Button>
                  <Button variant="primary" onClick={onExportPdf}>
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Security</div>
                    <div className="mt-1 text-xs text-[color:var(--tf-text-muted)]">
                      Manage password, two-factor authentication, and active sessions.
                    </div>
                  </div>
                  <Shield className="h-5 w-5 text-[color:var(--tf-text-subtle)]" />
                </div>

                <div className="mt-5 rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">
                      {security.hasPassword ? "Change password" : "Set password"}
                    </div>
                    <Lock className="h-4 w-4 text-[color:var(--tf-text-subtle)]" />
                  </div>

                  {security.hasPassword ? (
                    <div className="mt-4 grid gap-3">
                      <Input
                        id="pwdCurrent"
                        label="Current password"
                        type="password"
                        value={pwdChange.current}
                        onChange={(e) => setPwdChange((p) => ({ ...p, current: e.target.value }))}
                      />
                      <Input
                        id="pwdNext"
                        label="New password"
                        type="password"
                        value={pwdChange.next}
                        onChange={(e) => setPwdChange((p) => ({ ...p, next: e.target.value }))}
                        hint={`Strength: ${pwdStrength.label}`}
                      />
                      <Input
                        id="pwdConfirm"
                        label="Confirm new password"
                        type="password"
                        value={pwdChange.confirm}
                        onChange={(e) => setPwdChange((p) => ({ ...p, confirm: e.target.value }))}
                      />
                      <div className={`text-xs font-extrabold ${pwdStrength.color}`}>Strength: {pwdStrength.label}</div>
                      <Button variant="primary" onClick={changePassword} disabled={saving}>
                        Update password
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      <Input
                        id="pwdSet"
                        label="Password"
                        type="password"
                        value={pwdSet.password}
                        onChange={(e) => setPwdSet((p) => ({ ...p, password: e.target.value }))}
                      />
                      <Input
                        id="pwdSetConfirm"
                        label="Confirm password"
                        type="password"
                        value={pwdSet.confirm}
                        onChange={(e) => setPwdSet((p) => ({ ...p, confirm: e.target.value }))}
                      />
                      <div className={`text-xs font-extrabold ${pwdStrength.color}`}>Strength: {pwdStrength.label}</div>
                      <Button variant="primary" onClick={setPassword} disabled={saving}>
                        Set password
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Two-factor authentication</div>
                    <QrCode className="h-4 w-4 text-[color:var(--tf-text-subtle)]" />
                  </div>

                  {!security.twoFactorEnabled ? (
                    <div className="mt-4">
                      <Button variant="secondary" onClick={start2fa} disabled={twoFa.loading}>
                        {twoFa.loading ? "Starting…" : "Set up 2FA"}
                      </Button>
                      {twoFa.qrDataUrl ? (
                        <div className="mt-4 grid gap-3">
                          <img src={twoFa.qrDataUrl} alt="2FA QR Code" className="h-40 w-40 rounded-2xl border border-[color:var(--tf-border)] bg-white p-2" />
                          <Input
                            id="twoFaToken"
                            label="Enter code from authenticator"
                            value={twoFa.token}
                            onChange={(e) => setTwoFa((s) => ({ ...s, token: e.target.value }))}
                          />
                          <Button variant="primary" onClick={verify2fa} disabled={twoFa.loading}>
                            Enable 2FA
                          </Button>
                          {twoFa.recoveryCodes?.length ? (
                            <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <div className="text-sm font-extrabold text-amber-900">Recovery codes</div>
                              <div className="mt-2 grid gap-2">
                                {twoFa.recoveryCodes.map((c) => (
                                  <div key={c} className="font-mono text-xs text-amber-900">{c}</div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      <div className="text-xs font-semibold text-[color:var(--tf-text-muted)]">
                        2FA is enabled. Disable using a token or a recovery code.
                      </div>
                      <Input
                        id="twoFaDisableToken"
                        label="Token (optional)"
                        value={twoFa.disableToken}
                        onChange={(e) => setTwoFa((s) => ({ ...s, disableToken: e.target.value }))}
                      />
                      <Input
                        id="twoFaDisableRecovery"
                        label="Recovery code (optional)"
                        value={twoFa.disableRecovery}
                        onChange={(e) => setTwoFa((s) => ({ ...s, disableRecovery: e.target.value }))}
                      />
                      <Button variant="danger" onClick={disable2fa} disabled={twoFa.loading}>
                        Disable 2FA
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Active sessions</div>
                <div className="mt-3 text-xs text-[color:var(--tf-text-muted)]">
                  Revoke sessions to sign out devices.
                </div>
                <div className="mt-4">
                  {sessions.loading ? (
                    <div className="flex items-center gap-3 text-[color:var(--tf-text-muted)]">
                      <Spinner />
                      <span className="text-sm font-semibold">Loading sessions…</span>
                    </div>
                  ) : sessions.items.length ? (
                    <div className="grid gap-3">
                      {sessions.items.map((s) => (
                        <div key={s.sid} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--tf-border)] bg-[color:var(--tf-bg)] p-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-mono text-[color:var(--tf-text)]">{s.sid}</div>
                            <div className="mt-1 text-xs text-[color:var(--tf-text-muted)]">
                              Expires: {s.expires ? new Date(s.expires).toLocaleString() : "unknown"}
                            </div>
                          </div>
                          <Button variant="secondary" onClick={() => revokeSession(s.sid)}>
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[color:var(--tf-text-muted)]">No sessions found.</div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-5 shadow-[var(--tf-shadow-sm)]">
                <div className="text-sm font-extrabold text-[color:var(--tf-text)]">Account actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {settings.account?.status === "deactivated" ? (
                    <Button variant="primary" onClick={reactivate} disabled={saving}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={deactivate} disabled={saving}>
                      Deactivate
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete account"
          description="This action permanently deletes your account, resumes, and playlists. Type DELETE to confirm."
        >
          <div className="grid gap-3">
            <Input
              id="deleteConfirm"
              label="Confirmation"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={deleteAccount} disabled={saving}>
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

