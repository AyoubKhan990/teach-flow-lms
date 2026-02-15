import React from "react";
import {
  BookOpen,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input, Select } from "../../components/Input";
import { FormSection } from "./FormSection";

export const AssignmentFormSections = ({
  clampInt,
  pages,
  formData,
  errors,
  setField,
  isGenerating,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <FormSection
        id="sec-essentials"
        title="Assignment essentials"
        subtitle="Topic, subject, level, and page count"
        Icon={BookOpen}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="topic"
              label="Topic or question"
              tooltip="Be specific. Clear constraints (scope, time period, region) improve structure and reduce generic writing."
              placeholder="e.g., The socio-economic impact of AI in 2030"
              value={formData.topic}
              onChange={(e) => setField("topic", e.target.value)}
              error={errors.topic}
              hint="Try: “Analyze X, compare Y vs Z, include 3 real-world examples.”"
            />
          </div>
          <Select
            id="subject"
            label="Subject area"
            tooltip="Used to pick the right academic framing, terminology, and examples."
            value={formData.subject}
            onChange={(e) => setField("subject", e.target.value)}
            options={[
              { value: "Computer Science", label: "Computer Science" },
              { value: "Business & Management", label: "Business & Management" },
              { value: "Psychology", label: "Psychology" },
              { value: "History", label: "History" },
              { value: "Literature", label: "Literature" },
              { value: "Economics", label: "Economics" },
              { value: "Engineering", label: "Engineering" },
              { value: "Health Sciences", label: "Health Sciences" },
              { value: "Law", label: "Law" },
              { value: "Marketing", label: "Marketing" },
            ]}
          />
          <Select
            id="level"
            label="Academic level"
            tooltip="Controls depth, terminology, and expected rigor."
            value={formData.level}
            onChange={(e) => setField("level", e.target.value)}
            options={[
              { value: "School", label: "High School" },
              { value: "College", label: "College (Undergrad)" },
              { value: "University", label: "University (Postgrad)" },
              { value: "Masters", label: "Masters / MBA" },
              { value: "PhD", label: "PhD / Doctorate" },
            ]}
          />
          <Select
            id="pages"
            label="Approx. pages"
            tooltip="Used as a target length. Final length can vary by topic and instructions."
            value={pages}
            onChange={(e) => setField("pages", clampInt(e.target.value, 1, 20, 1))}
            error={errors.pages}
            options={Array.from({ length: 10 }, (_, i) => {
              const n = i + 1;
              return { value: n, label: `${n} page${n === 1 ? "" : "s"}` };
            })}
            hint="The generator aims to match page count, but may vary by topic."
          />
        </div>
      </FormSection>

      <FormSection
        id="sec-format"
        title="Format & style"
        subtitle="Length, tone, language, and citations"
        Icon={Layers}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="length"
            label="Length"
            tooltip="Affects detail level and number of sections."
            value={formData.length}
            onChange={(e) => setField("length", e.target.value)}
            options={[
              { value: "Short", label: "Short (1–2 pages)" },
              { value: "Medium", label: "Medium (3–5 pages)" },
              { value: "Detailed", label: "Detailed (6+ pages)" },
            ]}
          />
          <Select
            id="style"
            label="Writing tone"
            tooltip="Choose the voice and clarity level. Academic is more formal; Direct is simpler and faster to read."
            value={formData.style}
            onChange={(e) => setField("style", e.target.value)}
            options={[
              { value: "Formal", label: "Formal & objective" },
              { value: "Academic", label: "Strictly academic" },
              { value: "Direct and concise", label: "Direct and concise" },
              { value: "Simple", label: "Simple & direct" },
              { value: "Creative", label: "Creative & narrative" },
            ]}
          />
          <Select
            id="language"
            label="Language"
            tooltip="Pick the language for the full document. English (UK/US) changes spelling conventions."
            value={formData.language}
            onChange={(e) => setField("language", e.target.value)}
            options={[
              { value: "English", label: "English (US)" },
              { value: "EnglishUK", label: "English (UK)" },
              { value: "Urdu", label: "Urdu" },
              { value: "Spanish", label: "Spanish" },
              { value: "French", label: "French" },
            ]}
          />
          <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-white/60 p-4">
            <label className="flex items-start gap-3">
              <input
                id="references"
                type="checkbox"
                checked={Boolean(formData.references)}
                onChange={(e) => setField("references", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-[color:var(--color-border)] text-[color:var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
              />
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-text)]">
                  Include references
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  Add a references section at the end of the assignment.
                </div>
              </div>
            </label>
          </div>

          {formData.references && (
            <Select
              id="citationStyle"
              label="Citation style"
              tooltip="Applied to the generated reference list."
              value={formData.citationStyle}
              onChange={(e) => setField("citationStyle", e.target.value)}
              error={errors.citationStyle}
              options={[
                { value: "APA", label: "APA" },
                { value: "MLA", label: "MLA" },
                { value: "Chicago", label: "Chicago" },
              ]}
            />
          )}
        </div>
      </FormSection>

      <FormSection
        id="sec-instructions"
        title="Additional instructions"
        subtitle="Optional constraints or requirements"
        Icon={FileText}
        defaultOpen={false}
      >
        <label
          htmlFor="instructions"
          className="text-sm font-semibold text-[color:var(--color-text)]"
        >
          Notes for the writer
        </label>
        <textarea
          id="instructions"
          className="mt-2 w-full rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-[var(--shadow-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] min-h-[120px] resize-y placeholder:text-slate-400"
          placeholder="Specific requirements? Focus areas? Paste them here..."
          value={formData.instructions}
          onChange={(e) => setField("instructions", e.target.value)}
        />
      </FormSection>

      <div className="sticky bottom-4 mt-2">
        <Card className="glass-panel px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                Ready to generate?
              </div>
              <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Review settings and generate your assignment.
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              isLoading={isGenerating}
              className="w-full sm:w-auto rounded-full"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? "Generating…" : "Generate assignment"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="pb-6 text-center text-xs text-[color:var(--color-text-muted)]">
        By generating, you agree to use this tool for educational assistance only.
      </div>
    </form>
  );
};

