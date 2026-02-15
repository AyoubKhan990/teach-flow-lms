import React from "react";
import { RefreshCw } from "lucide-react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";

export const ResultPanel = ({
  result,
  onRefresh,
  onViewResult,
  onStartAnother,
}) => {
  return (
    <Card className="bg-white/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            Result
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Preview becomes available when generation completes.
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {!result && (
        <div className="mt-6 grid gap-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
          <div className="h-4 w-full animate-pulse rounded bg-black/10" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-black/10" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-black/10" />
          <div className="h-4 w-9/12 animate-pulse rounded bg-black/10" />
        </div>
      )}

      {result && (
        <div className="mt-6">
          <Alert variant="success" title="Completed" role="status">
            Your assignment is ready.
          </Alert>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="rounded-full" onClick={onViewResult}>
              View result
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={onStartAnother}
            >
              Start another
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

