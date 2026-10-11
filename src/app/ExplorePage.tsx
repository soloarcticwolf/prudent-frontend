import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { api } from "../lib/api/client";
import { analysisFormSchema } from "../lib/validation/schemas";
import { KNOWN_HAZARDS } from "../features/hazards/registry";
import type { SearchResult } from "../types/api";
import { useAnalysisJob } from "../hooks/useAnalysisJob";
import { SearchBox } from "../components/analysis/SearchBox";
import { JobProgress } from "../components/analysis/JobProgress";
import { ResultsDashboard } from "../components/analysis/ResultsDashboard";
import { Alert, Badge, Card, CardHeader, Skeleton } from "../components/ui/primitives";
import { Button } from "../components/ui/Button";

const RegionMap = lazy(() =>
  import("../components/maps/RegionMap").then((m) => ({ default: m.RegionMap })),
);

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const reduce = useReducedMotion();
  const qc = useQueryClient();

  const [region, setRegion] = useState<SearchResult | null>(null);
  const [start, setStart] = useState(params.get("start") ?? "1995");
  const [end, setEnd] = useState(params.get("end") ?? "2020");
  const [hazard, setHazard] = useState(params.get("hazard") ?? "heatwave");
  const [formError, setFormError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const regionId = params.get("region_id") ?? region?.region_id ?? null;

  // Deep link / reload: resolve the region_id from the URL exactly like a
  // fresh selection, so the canonical boundary loads without manual re-pick.
  const {
    data: remoteRegion,
    isLoading: regionLoading,
    error: regionError,
  } = useQuery({
    queryKey: ["region", params.get("region_id")],
    queryFn: () => api.region(params.get("region_id") as string),
    enabled: !!params.get("region_id") && !region,
    staleTime: 300_000,
    retry: 1,
  });

  useEffect(() => {
    if (remoteRegion && !region) setRegion(remoteRegion);
  }, [remoteRegion, region]);

  const { data: boundary } = useQuery({
    queryKey: ["boundary", regionId],
    queryFn: () => api.regionBoundary(regionId as string),
    enabled: !!regionId,
    staleTime: 300_000,
  });

  const job = useAnalysisJob(jobId);
  const analysisId = job.data?.analysis_id ?? null;
  const resultQuery = useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: () => api.analysis(analysisId as string),
    enabled: !!analysisId && ["completed", "completed_with_warnings"].includes(job.data?.status ?? ""),
  });
  const result = resultQuery.data;

  useEffect(() => {
    if (region) {
      setParams(
        (p) => {
          p.set("region_id", region.region_id);
          p.set("start", start);
          p.set("end", end);
          p.set("hazard", hazard);
          return p;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.region_id]);

  const submit = useMutation({
    mutationFn: () =>
      api.submitAnalysis({
        region_id: regionId as string,
        start_year: Number(start),
        end_year: Number(end),
        hazard,
      }),
    onSuccess: (res) => {
      setFormError(null);
      setJobId(res.job_id);
      // Note: never pre-fill the ["analysis", id] cache here. The result query
      // fetches the stored report itself; seeding it with null marks the query
      // fresh and the cached report would never load (dead Analyze button).
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const validation = useMemo(
    () =>
      analysisFormSchema.safeParse({
        region_id: regionId ?? "",
        start_year: start,
        end_year: end,
        hazard,
      }),
    [regionId, start, end, hazard],
  );

  const run = () => {
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    submit.mutate();
  };

  // Busy only while work is actually in flight. A job in a terminal state
  // without a loadable result (e.g. backend restarted and dropped its
  // in-memory data) must NOT wedge the button permanently disabled.
  const TERMINAL = ["completed", "completed_with_warnings", "failed", "cancelled"];
  const jobActive =
    !!jobId && (job.isLoading || (job.data != null && !TERMINAL.includes(job.data.status)));
  const analyzing = submit.isPending || resultQuery.isFetching || (!!jobId && !result && jobActive);

  // Clearing the selection (e.g. editing the search text) also drops the
  // region_id from the URL, so the deep-link resolver above does not refetch it.
  const handlePick = useCallback(
    (r: SearchResult | null) => {
      setRegion(r);
      if (!r) {
        setParams(
          (p) => {
            p.delete("region_id");
            return p;
          },
          { replace: true },
        );
      }
    },
    [setParams],
  );
  // Any edit of the search text (e.g. the first backspace) invalidates the
  // workspace below: cancel in-flight work and clear displayed analytics.
  const handleQueryChange = useCallback(() => {
    if (jobId) {
      void api.cancelJob(jobId).catch(() => undefined);
      setJobId(null);
    }
    qc.removeQueries({ queryKey: ["analysis"] });
  }, [jobId, qc]);

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
    >
      <h1 className="font-serif text-4xl text-ink">Analysis workspace</h1>
      <p className="mt-2 max-w-2xl text-secondary">
        Search a recognized region, confirm its boundary on the map, choose a historical period, and run a heatwave analysis.
      </p>

      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-full p-5">
          <div className="space-y-4">
            <SearchBox value={region} onPick={handlePick} onQueryChange={handleQueryChange} />
            {region ? (
              <p className="rounded-md bg-subtle px-3 py-2 text-xs text-ink">
                Selected: <strong>{region.display_name}</strong>
                {region.approximate ? " (preview boundary — see warning)" : ""}
              </p>
            ) : regionLoading ? (
              <Skeleton className="h-10" />
            ) : regionError ? (
              <Alert kind="error">
                Could not resolve the linked region. Select a recognized region from search.
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start" className="text-sm font-semibold">Start year</label>
                <input id="start" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tnum focus:border-forest focus:outline-none" />
              </div>
              <div>
                <label htmlFor="end" className="text-sm font-semibold">End year</label>
                <input id="end" inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tnum focus:border-forest focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="hazard" className="text-sm font-semibold">Hazard</label>
              <select id="hazard" value={hazard} onChange={(e) => setHazard(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-forest focus:outline-none">
                {KNOWN_HAZARDS.map((h) => (
                  <option key={h.hazard_id} value={h.hazard_id} disabled={h.status !== "available"}>
                    {h.display_name}{h.status !== "available" ? " (planned)" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-secondary">Heatwaves selected by default. Planned hazards are disabled, not mocked.</p>
            </div>

            {formError ? <Alert kind="error">{formError}</Alert> : null}
            <Button onClick={run} disabled={!regionId || analyzing} aria-busy={analyzing} className="w-full">
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </Card>

        <div>
          <Card className="flex h-full flex-col">
            <CardHeader title="Region boundary" sub={boundary?.warning ?? "Translucent terracotta overlay with outline; zoom and pan freely."} />
            <div className="flex flex-1 flex-col p-4">
              <Suspense fallback={<Skeleton className="h-72" />}>
                <RegionMap boundary={boundary ?? null} />
              </Suspense>
              {boundary ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge>{boundary.boundary_version}</Badge>
                  <Badge>fingerprint {boundary.geometry_fingerprint}</Badge>
                  {boundary.warning ? <Badge tone="warn">approximate</Badge> : <Badge tone="good">verified source</Badge>}
                </div>
              ) : (
                <p className="mt-3 text-sm text-secondary">Select a region to highlight its canonical boundary.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {jobId ? (
          <JobProgress
            job={job.data}
            isLoading={job.isLoading}
            error={job.error as Error | null}
            onCancel={() => jobId && api.cancelJob(jobId).then((j) => qc.setQueryData(["job", jobId], j))}
          />
        ) : null}

        {["completed", "completed_with_warnings"].includes(job.data?.status ?? "") &&
        resultQuery.error &&
        !result ? (
          <Alert kind="error">
            The analysis finished, but its result could not be loaded — the backend may have
            restarted and dropped stored results. Run the analysis again.
          </Alert>
        ) : null}

        {result ? (
          <ResultsDashboard result={result} />
        ) : jobId && !["completed", "completed_with_warnings"].includes(job.data?.status ?? "") ? null : !jobId ? (
          <Card className="p-8 text-center text-sm text-secondary">
            Results appear here — annual metrics, charts, insights, and methodology.
          </Card>
        ) : null}
      </div>
    </motion.div>
  );
}
