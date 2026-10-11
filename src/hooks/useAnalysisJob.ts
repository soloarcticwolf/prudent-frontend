import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api/client";

const TERMINAL = ["completed", "completed_with_warnings", "failed", "cancelled"];

/** Polls a job until it reaches a terminal state. */
export function useAnalysisJob(jobId: string | null) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.job(jobId as string),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s || TERMINAL.includes(s)) {
        return false;
      }
      return 2000;
    },
    retry: 1,
  });
}
