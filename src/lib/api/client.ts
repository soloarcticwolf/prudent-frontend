import type {
  AnalysisResult,
  BoundaryResponse,
  Hazard,
  JobStatus,
  SearchResult,
} from "../../types/api";

const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Request failed (${r.status})`);
  }
  return (await r.json()) as T;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Request failed (${r.status})`);
  }
  return (await r.json()) as T;
}

export interface AnalysisSubmit {
  status: "queued" | "completed";
  job_id: string;
  analysis_id?: string | null;
  cache_hit: boolean;
  message: string;
}

export const api = {
  baseUrl: BASE,
  searchRegions: (q: string, limit = 8) =>
    get<SearchResult[]>(`/api/v1/geography/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  region: (id: string) =>
    get<SearchResult>(`/api/v1/geography/regions/${encodeURIComponent(id)}`),
  regionBoundary: (id: string) =>
    get<BoundaryResponse>(`/api/v1/geography/regions/${encodeURIComponent(id)}/boundary`),
  hazards: () => get<{ hazards: Hazard[] }>(`/api/v1/climate/hazards`),
  coverage: () => get<Record<string, unknown>>(`/api/v1/climate/coverage`),
  submitAnalysis: (payload: {
    region_id: string;
    start_year: number;
    end_year: number;
    hazard: string;
    baseline_start?: number;
    baseline_end?: number;
  }) => post<AnalysisSubmit>(`/api/v1/analyses`, payload),
  analysis: (id: string) => get<AnalysisResult>(`/api/v1/analyses/${encodeURIComponent(id)}`),
  job: (id: string) => get<JobStatus>(`/api/v1/jobs/${encodeURIComponent(id)}`),
  cancelJob: (id: string) => post<JobStatus>(`/api/v1/jobs/${encodeURIComponent(id)}/cancel`, {}),
  health: () => get<{ status: string }>(`/health`),
};
