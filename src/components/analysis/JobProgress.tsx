import type { JobStatus } from "../../types/api";
import { Alert, Skeleton } from "../ui/primitives";
import { Button } from "../ui/Button";

const TERMINAL = ["completed", "completed_with_warnings", "failed", "cancelled"];

export function JobProgress({
  job,
  isLoading,
  error,
  onCancel,
}: {
  job: JobStatus | undefined;
  isLoading: boolean;
  error: Error | null;
  onCancel: () => void;
}) {
  if (error) return <Alert kind="error">Could not reach the analysis service: {error.message}</Alert>;
  if (isLoading || !job) {
    return (
      <div aria-busy="true" aria-label="Preparing analysis">
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (job.status === "failed") {
    return <Alert kind="error">{job.error || "The analysis failed. Try a shorter interval or another region."}</Alert>;
  }
  if (TERMINAL.includes(job.status)) return null;
  const latest = job.progress[job.progress.length - 1] ?? "Processing";
  return (
    <div className="rounded-lg border border-line bg-surface p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{latest}…</p>
        <Button variant="ghost" onClick={onCancel} className="text-xs">Cancel</Button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle" aria-hidden>
        <div
          className="h-full rounded-full bg-forest transition-[width]"
          style={{ width: `${Math.min(95, Math.max(8, job.progress_pct ?? 15))}%` }}
        />
      </div>
      <ol className="mt-3 space-y-1 text-xs text-secondary">
        {job.progress.map((p, i) => (
          <li key={`${p}-${i}`}>· {p}</li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-secondary">Long analyses run in the background — this page polls automatically.</p>
    </div>
  );
}
