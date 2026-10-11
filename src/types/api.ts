export interface SearchResult {
  region_id: string;
  display_name: string;
  country_code?: string | null;
  admin_level?: string | null;
  parent_id?: string | null;
  centroid?: { lon: number; lat: number } | null;
  bbox?: number[] | null;
  boundary_provider?: string | null;
  source_dataset?: string | null;
  source_release?: string | null;
  boundary_version?: string | null;
  geometry_fingerprint?: string | null;
  license?: string | null;
  attribution?: string | null;
  approximate?: boolean;
}

export interface GeoGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface BoundaryResponse {
  region_id: string;
  geometry: GeoGeometry;
  display_geometry: GeoGeometry;
  bbox?: number[] | null;
  centroid?: { lon: number; lat: number } | null;
  boundary_version: string;
  geometry_fingerprint: string;
  provenance: Record<string, unknown>;
  warning?: string | null;
}

export interface AnnualMetric {
  year: number;
  event_count: number;
  heatwave_days: number;
  mean_duration_days?: number | null;
  max_duration_days?: number | null;
  peak_tmax_c?: number | null;
  valid_days: number;
  total_days: number;
  missing_days?: number;
  completeness: number;
  incomplete: boolean;
}

export interface AnalysisResult {
  analysis_id: string;
  run_id?: string;
  region_id: string;
  display_name: string;
  admin_level?: string | null;
  boundary_version: string;
  start_year: number;
  end_year: number;
  actual_start: string;
  actual_end: string;
  hazard: string;
  methodology_version: string;
  baseline: Record<string, unknown>;
  provider: string;
  dataset_version: string;
  aggregation: string;
  annual: AnnualMetric[];
  trends: Record<string, TrendEstimate>;
  insights: Insight[];
  warnings: string[];
  provenance: Record<string, unknown>;
  provenance_detail?: ProvenanceDetail | null;
  created_at: string;
}

export interface TrendEstimate {
  supported: boolean;
  slope_per_year?: number;
  p_value?: number;
  n_years?: number;
  modeled_change?: number;
  ci95_low?: number;
  ci95_high?: number;
  warning?: string;
  reason?: string;
}

export interface Insight {
  type: string;
  metric: string;
  text: string;
  detail?: Record<string, unknown>;
}

export interface SourceCacheInfo {
  hit: boolean;
  checked_at?: string | null;
  age_s?: number | null;
  original_retrieved_at?: string | null;
}

export interface SourceRecord {
  source_id: string;
  provider: string;
  dataset: string;
  role: "analytical" | "boundary" | "context";
  endpoint: string;
  operation: string;
  fields_consumed: string[];
  units_provider?: string | null;
  units_used?: string | null;
  unit_conversion: string;
  observation_start?: string | null;
  observation_end?: string | null;
  retrieved_at?: string | null;
  provider_updated_at?: string | null;
  records_retrieved: number;
  records_accepted: number;
  records_rejected: number;
  records_missing: number;
  response_fingerprint?: string | null;
  cache: SourceCacheInfo;
  attribution: string;
  license: string;
  website: string;
  docs_url: string;
  notes?: string;
}

export interface StageRecord {
  stage_id: string;
  title: string;
  input: string;
  transformation: string;
  parameters: string;
  output: string;
  contributes_to: string[];
}

export interface MetricLineage {
  metric: string;
  kind: "observed" | "estimated" | "derived" | "inference";
  derivation: string;
  inputs: string[];
  exclusions?: string | null;
  method?: string | null;
  statistics?: string | null;
}

export interface ProvenanceDetail {
  schema_version: string;
  run_id: string;
  status: string;
  observation_start: string;
  observation_end: string;
  retrieved_at: string;
  completed_at: string;
  cache_hit: boolean;
  cache_checked_at?: string | null;
  sources: SourceRecord[];
  stages: StageRecord[];
  metric_lineage: MetricLineage[];
  spatial: Record<string, unknown>;
  software: Record<string, unknown>;
  warnings: string[];
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: string[];
  progress_pct?: number | null;
  analysis_id?: string | null;
  warnings: string[];
  error?: string | null;
}

export interface Hazard {
  hazard_id: string;
  display_name: string;
  description: string;
  status: "available" | "planned";
  units?: Record<string, string>;
}
