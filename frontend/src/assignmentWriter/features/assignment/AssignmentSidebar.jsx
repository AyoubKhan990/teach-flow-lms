import React from "react";
import { Card } from "../../components/Card";

const clampInt = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

const buildOutline = ({ pages, includeReferences, citationStyle }) => {
  const pageCount = clampInt(pages, 1, 20, 1);

  const sections =
    pageCount <= 2
      ? ["Introduction", "Key concepts", "Analysis", "Conclusion"]
      : pageCount <= 4
        ? ["Introduction", "Background", "Analysis", "Discussion", "Conclusion"]
        : [
            "Introduction",
            "Background",
            "Method / Framework",
            "Analysis",
            "Case examples",
            "Discussion",
            "Conclusion",
          ];

  if (includeReferences) {
    sections.push(`References (${citationStyle || "APA"})`);
  }

  return { sections, pageCount };
};

export const AssignmentSidebar = ({ formData, pages }) => {
  const topic = typeof formData?.topic === "string" ? formData.topic.trim() : "";
  const subject = typeof formData?.subject === "string" ? formData.subject : "";
  const level = typeof formData?.level === "string" ? formData.level : "";
  const language = typeof formData?.language === "string" ? formData.language : "";
  const style = typeof formData?.style === "string" ? formData.style : "";
  const length = typeof formData?.length === "string" ? formData.length : "";
  const includeReferences = Boolean(formData?.references);
  const citationStyle = typeof formData?.citationStyle === "string" ? formData.citationStyle : "APA";
  const instructions =
    typeof formData?.instructions === "string" ? formData.instructions.trim() : "";

  const outline = React.useMemo(
    () =>
      buildOutline({
        pages,
        includeReferences,
        citationStyle,
      }),
    [citationStyle, includeReferences, pages]
  );

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <Card className="bg-white/80 p-6">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">Live preview</div>
        <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
          Updates as you edit. Use it to confirm structure before generating.
        </div>

        <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-white/60 p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            {topic || "Untitled topic"}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-[color:var(--color-text-muted)]">
            <div>
              {subject || "Subject"} • {level || "Level"} • {language || "Language"}
            </div>
            <div>
              {length || "Length"} • {style || "Tone"} • {outline.pageCount} page{outline.pageCount === 1 ? "" : "s"}
            </div>
            <div>References: {includeReferences ? citationStyle : "Off"}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Outline</div>
          <ol className="mt-2 space-y-2 text-sm text-[color:var(--color-text)]">
            {outline.sections.map((s) => (
              <li
                key={s}
                className="rounded-[var(--radius-card)] bg-black/5 px-3 py-2"
              >
                {s}
              </li>
            ))}
          </ol>
        </div>

        {instructions && (
          <div className="mt-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Notes</div>
            <div className="mt-2 line-clamp-6 whitespace-pre-wrap rounded-[var(--radius-card)] bg-black/5 px-3 py-2 text-sm text-[color:var(--color-text)]">
              {instructions}
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-white/80 p-6">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">Jump to</div>
        <div className="mt-3 grid gap-2">
          {[
            { id: "sec-essentials", label: "Essentials" },
            { id: "sec-format", label: "Format & style" },
            { id: "sec-visuals", label: "Visuals" },
            { id: "sec-instructions", label: "Instructions" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full rounded-full bg-black/5 px-4 py-2 text-left text-sm font-semibold text-[color:var(--color-text)] hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
              onClick={() => {
                const el = document.getElementById(item.id);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="bg-white/80 p-6">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">Pro tips</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[color:var(--color-text-muted)]">
          <li>Use a specific topic statement for better structure.</li>
          <li>Add constraints in instructions (sources, scope, exclusions).</li>
          <li>If images are important, upload your own to guarantee relevance.</li>
        </ul>
      </Card>
    </div>
  );
};

