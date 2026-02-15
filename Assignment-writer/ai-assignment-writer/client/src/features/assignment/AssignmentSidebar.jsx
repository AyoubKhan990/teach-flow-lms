import React from 'react';
import { Card } from '../../components/Card';

export const AssignmentSidebar = () => {
  return (
    <div className="sticky top-6 space-y-4">
      <Card className="bg-white/80 p-6">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">Output expectations</div>
        <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">Use these settings to control structure and visuals.</div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[var(--radius-card)] bg-black/5 p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Pages</div>
            <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">Aim for a page count close to your selection.</div>
          </div>
          <div className="rounded-[var(--radius-card)] bg-black/5 p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Images</div>
            <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">Upload images or let AI generate diagrams aligned to sections.</div>
          </div>
          <div className="rounded-[var(--radius-card)] bg-black/5 p-4">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Citations</div>
            <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">Enable references to append a formatted reference section.</div>
          </div>
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

