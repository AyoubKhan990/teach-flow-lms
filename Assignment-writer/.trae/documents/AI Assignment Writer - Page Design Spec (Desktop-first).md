# AI Assignment Writer — Redesign Spec (Desktop-first)

## 0. Current UI quick audit (from the provided screenshot + current pages)
- Strong visual identity (glass + gradients), but visual rules are not consistently tokenized (colors/radii/shadows vary by component).
- Form density is high: long single-page form + many selects; needs clearer hierarchy (stepper/accordion) without changing fields.
- Feedback is mixed: inline errors exist, but some flows still use disruptive alerts; status messages should be unified.
- Accessibility gaps to address: consistent focus indicator thickness/contrast, motion reduction, and “error summary” for screen readers.

## 1) Competitor & modern pattern notes (for inspiration)
- Grammarly supports long-form editing with guided suggestions (rewrite/tone/clarity) in its web editor. <mcreference link="https://www.grammarly.com/features" index="1">1</mcreference>
- Notion AI integrates “draft/rewrite/summarize/tone” actions inline in a document editor workflow. <mcreference link="https://www.notion.com/help/guides/notion-ai-for-docs" index="2">2</mcreference>
- QuillBot positions as a suite (paraphrase/summarize/citation tools), suggesting a clear “tool switcher” IA pattern even when features are simple. <mcreference link="https://quillbot.com/flow" index="3">3</mcreference>

## 2) Design System (tokens)
### 2.1 Color tokens (CSS variables)
Use role-based tokens inspired by modern “primary/secondary/tertiary + surface” systems. <mcreference link="https://developer.android.com/develop/ui/compose/designsystems/material3" index="4">4</mcreference>
- --color-bg: #F8FAFC
- --color-surface: #FFFFFF
- --color-surface-muted: #F3F4F6
- --color-text: #0F172A
- --color-text-muted: #475569
- --color-primary: #0D173F
- --color-accent: #3B82F6
- --color-success: #16A34A
- --color-warning: #D97706
- --color-danger: #DC2626
- --color-border: #E5E7EB

### 2.2 Typography
- Font stack: Plus Jakarta Sans / Inter / system
- Scale (desktop): 12, 14, 16, 18, 24, 32, 48
- Body line-height: 1.55; Document preview: serif stack + 1.8 leading for readability

### 2.3 Spacing, radius, elevation
- 4px spacing grid; layout gutters: 24px desktop, 16px mobile
- Radius scale: 8 (controls), 12 (cards), 20 (hero panels)
- Elevation: 0/1/2/3 mapped to shadow tokens + optional subtle tonal overlay (keep glass but reduce blur for legibility)

### 2.4 Motion
- Default transitions: 150–250ms, ease-out; avoid large translate animations on primary flows
- Respect `prefers-reduced-motion`: disable non-essential animations

## 3) Accessibility rules (must-have)
- Focus indicator MUST be clearly visible and meet minimum size/contrast guidance (e.g., solid outline, sufficient contrast). <mcreference link="https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html" index="5">5</mcreference>
- Don’t remove focus outlines unless replaced with an equivalent/stronger indicator. <mcreference link="https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html" index="5">5</mcreference>
- Provide programmatic labels for all fields, and link errors to inputs via `aria-describedby`.
- Provide an error summary region (role="alert") at form top when submit fails.
- Ensure interactive targets are comfortably clickable; avoid icon-only buttons without accessible names.

## 4) Component architecture (React + Tailwind)
### 4.1 Structure
- `ui/` (pure, reusable): Button, Input, Select, Textarea, Checkbox, Badge, Alert, Toast, Tooltip, Modal, Tabs/SegmentedControl, Stepper, Skeleton, Progress
- `features/assignment/`: AssignmentForm (sections), ImageUploadDropzone, ValidationSummary, GenerateCTA
- `features/result/`: ResultToolbar, DocumentPreview, ExportButtons, StatusBanner
- `layouts/`: AppShell (optional top nav), CenteredLayout, DocumentLayout

### 4.2 State & feedback patterns
- Form: controlled inputs + schema validation; show errors on blur and on submit
- Async: one global toast system + inline status banners for long-running tasks (generation)

## 5) Page-by-page design

## 5.1 Home
- **Layout**: Centered stacked sections; max width 1120px; hero + feature grid + footer.
- **Meta**: Title “AI Assignment Writer”; description “Generate cited, formatted assignments in minutes.”
- **Components**: HeroHeading, PrimaryCTA, SecondaryCTA, FeatureCardGrid.
- **Key interactions**: CTA routes to /form; secondary opens examples.

## 5.2 Assignment Builder (/form)
- **Layout**: 2-column desktop (left: form, right: “output expectations” help card); collapses to single column on <1024px.
- **Structure**: Stepper or accordion sections (Essentials, Format, Visuals, Instructions) using existing fields only.
- **Validation**: Sticky error summary appears after submit; field errors inline.
- **Image upload**: Dropzone with previews + counter; clearly indicate “AI will generate if you don’t upload”.
- **Primary action**: Bottom sticky Generate bar (desktop) with loading/progress copy.

## 5.3 Result Viewer (/result)
- **Layout**: Document canvas centered; toolbar docked top (desktop) but never obscures content (use safe top padding + "skip to content").
- **Document preview**: Serif typography; content width ~760–820px; images rendered with captions.
- **Status**: Dedicated StatusBanner showing image generation outcomes and next steps.
- **Actions**: Copy, Download DOCX, Download PDF; provide non-blocking toasts instead of alerts