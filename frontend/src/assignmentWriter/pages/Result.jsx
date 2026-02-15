import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Copy, RefreshCw, FileText, File, Check } from "lucide-react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { useToast } from "../components/useToast";
import { assignmentWriterApiUrl } from "../api";
import { assignmentWriterPath } from "../constants";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docData, setDocData] = React.useState(location.state?.data || null);
  const [docContent, setDocContent] = React.useState(location.state?.content || "");
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState({ pdf: false, docx: false });

  const formatTopic = React.useCallback((value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withAi = trimmed.replace(/\bai\b/gi, "AI");
    return withAi.charAt(0).toUpperCase() + withAi.slice(1);
  }, []);

  const normalizeFirstHeading = React.useCallback(
    (content) => {
      if (typeof content !== "string" || content.length === 0) return content;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim().length === 0) continue;
        if (line.startsWith("# ")) {
          lines[i] = `# ${formatTopic(line.slice(2))}`;
        }
        break;
      }
      return lines.join("\n");
    },
    [formatTopic]
  );

  const formattedTopic = React.useMemo(
    () => formatTopic(docData?.topic || ""),
    [docData?.topic, formatTopic]
  );

  React.useEffect(() => {
    const incomingData = location.state?.data;
    const incomingContent = location.state?.content;
    if (incomingData && incomingContent) {
      setDocData(incomingData);
      setDocContent(incomingContent);
      try {
        sessionStorage.setItem(
          "lastResult",
          JSON.stringify({ data: incomingData, content: incomingContent })
        );
      } catch {
        void 0;
      }
      return;
    }

    if (!incomingData) {
      try {
        const raw = sessionStorage.getItem("lastResult");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data && parsed?.content) {
            setDocData(parsed.data);
            setDocContent(parsed.content);
          }
        }
      } catch {
        void 0;
      }
    }
  }, [location.state]);

  const stripImageMarkers = React.useCallback((content) => {
    if (typeof content !== "string") return "";
    return content
      .replace(/\[IMAGE:[^\]]*\]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  const handleDownload = async (type) => {
    try {
      if (!docData || !docContent) {
        toast({ title: "Nothing to export", message: "Generate an assignment first.", variant: "warning" });
        return;
      }

      setDownloading((prev) => ({ ...prev, [type]: true }));
      const payload = {
        ...docData,
        topic: formattedTopic || docData?.topic,
        content: normalizeFirstHeading(stripImageMarkers(docContent)),
      };
      const response = await fetch(assignmentWriterApiUrl(`/download/${type}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `assignment.${type === "docx" ? "docx" : "pdf"}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Download started",
          message: type === "docx" ? "Word document (.docx)" : "PDF document (.pdf)",
          variant: "success",
        });
      } else {
        let message = "The server could not generate the file.";
        try {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const err = await response.json();
            if (typeof err?.error === "string" && err.error.length > 0) message = err.error;
          }
        } catch {
          void 0;
        }
        toast({ title: "Download failed", message, variant: "danger" });
      }
    } catch {
      toast({ title: "Download error", message: "Please try again.", variant: "danger" });
    } finally {
      setDownloading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleCopy = () => {
    if (!docContent) {
      toast({ title: "Nothing to copy", message: "Generate an assignment first.", variant: "warning" });
      return;
    }
    navigator.clipboard.writeText(docContent);

    setCopied(true);
    toast({ title: "Copied", message: "Assignment text copied to clipboard.", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const processedContent = React.useMemo(() => {
    if (!docContent) return "";
    return stripImageMarkers(docContent);
  }, [docContent, stripImageMarkers]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sticky top-4 z-50">
          <div className="glass-panel rounded-full px-4 py-3 shadow-[var(--shadow-2)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(assignmentWriterPath("/form"))}
                  className="rounded-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="hidden h-6 w-px bg-black/10 sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className={`rounded-full ${copied ? "bg-emerald-50 text-emerald-700" : ""}`}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload("docx")}
                  className="rounded-full"
                  disabled={downloading.docx}
                >
                  <FileText className="mr-2 h-4 w-4" /> Word
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload("pdf")}
                  className="rounded-full"
                  disabled={downloading.pdf}
                >
                  <File className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main id="main" className="mt-8">
          {!docData && (
            <div className="mx-auto max-w-2xl">
              <Alert variant="warning" title="No result to display" role="status">
                Generate an assignment first, then come back to view and export it.
              </Alert>
              <div className="mt-4">
                <Button onClick={() => navigate(assignmentWriterPath("/form"))} className="rounded-full">
                  Create assignment
                </Button>
              </div>
            </div>
          )}

          {docData && (
            <div className="mx-auto max-w-4xl">
              <div className="surface relative overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-10">
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80" />
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[color:var(--color-text)] sm:text-4xl">
                  {formattedTopic || docData?.topic || "Assignment"}
                </h1>
                <div className="mt-6 text-[color:var(--color-text)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: (props) => (
                        <p className="my-4 text-base leading-8 text-[color:var(--color-text)]" {...props} />
                      ),
                      h1: (props) => (
                        <h2 className="mt-10 text-2xl font-bold text-[color:var(--color-text)]" {...props} />
                      ),
                      h2: (props) => (
                        <h3
                          className="mt-10 border-b border-[color:var(--color-border)] pb-2 text-xl font-bold text-[color:var(--color-text)]"
                          {...props}
                        />
                      ),
                      h3: (props) => (
                        <h4 className="mt-8 text-lg font-bold text-[color:var(--color-text)]" {...props} />
                      ),
                      ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
                      ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
                      li: (props) => <li className="text-base leading-7" {...props} />,
                      blockquote: (props) => (
                        <blockquote
                          className="my-6 rounded-[var(--radius-card)] border-l-4 border-[color:var(--color-accent)] bg-blue-50 px-4 py-3 text-[color:var(--color-text)]"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {processedContent || "No content generated yet."}
                  </ReactMarkdown>
                </div>
                <div className="mt-12 border-t border-[color:var(--color-border)] pt-6 text-center">
                  <div className="text-xs font-semibold uppercase tracking-widest text-black/30">
                    Generated by AI Assignment Writer
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => navigate(assignmentWriterPath("/form"))}
                >
                  <RefreshCw className="mr-2 h-5 w-5" /> Start new assignment
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Result;

