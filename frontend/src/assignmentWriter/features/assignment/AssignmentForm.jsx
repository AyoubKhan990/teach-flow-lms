import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/Button";
import { Alert } from "../../components/Alert";
import { Badge } from "../../components/Badge";
import { useToast } from "../../components/useToast";
import { assignmentWriterPath } from "../../constants";
import { AssignmentSidebar } from "./AssignmentSidebar";
import { useAssignmentForm } from "./useAssignmentForm";
import { AssignmentFormSections } from "./AssignmentFormSections";

export const AssignmentForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    clampInt,
    pages,
    formData,
    errors,
    formError,
    topErrors,
    isGenerating,
    setField,
    focusField,
    handleSubmit,
  } = useAssignmentForm({
    toast,
    onJobCreated: (id) => navigate(assignmentWriterPath(`/jobs/${id}`)),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => navigate(assignmentWriterPath("/"))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="bg-white/70 backdrop-blur">
            No signup
          </Badge>
          <Badge variant="info" className="bg-white/70 backdrop-blur">
            Export to Word/PDF
          </Badge>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
        <main id="main" className="lg:col-span-8">
          <div className="glass-panel rounded-[var(--radius-hero)] p-6 sm:p-8">
            <h1 className="text-step-2 font-extrabold text-[color:var(--color-text)]">
              Assignment Builder
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Provide a topic and choose formatting options. You can include uploaded
              images or let AI generate visuals.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {topErrors.length > 0 && (
              <Alert variant="danger" title="Please fix the highlighted fields" role="alert">
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {topErrors.map((e) => (
                    <li key={e.field}>
                      <button
                        type="button"
                        className="text-left underline underline-offset-2"
                        onClick={() => focusField(e.field)}
                      >
                        {e.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {formError && (
              <Alert variant="danger" title="Request error" role="alert">
                {formError}
              </Alert>
            )}

            {isGenerating && (
              <Alert variant="info" title="Generating your assignment" role="status">
                Content generates first, then images (if enabled). Keep this tab open.
              </Alert>
            )}
          </div>

          <AssignmentFormSections
            clampInt={clampInt}
            pages={pages}
            formData={formData}
            errors={errors}
            setField={setField}
            isGenerating={isGenerating}
            onSubmit={handleSubmit}
          />
        </main>

        <aside className="lg:col-span-4">
          <AssignmentSidebar formData={formData} pages={pages} />
        </aside>
      </div>
    </div>
  );
};

