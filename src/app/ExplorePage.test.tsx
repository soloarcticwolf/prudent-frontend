import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplorePage } from "./ExplorePage";

vi.mock("../components/maps/RegionMap", () => ({
  RegionMap: () => <div data-testid="region-map" />,
}));

// jsdom has no ResizeObserver (Recharts ResponsiveContainer needs it).
class _RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", _RO);

const regionObj = {
  region_id: "geo:test-1",
  display_name: "Testville",
  country_code: "TX",
  admin_level: "city",
  parent_id: null,
  centroid: { lon: 0, lat: 0 },
  bbox: [-1, -1, 1, 1],
  boundary_provider: "test",
  source_dataset: "test",
  source_release: "v1",
  boundary_version: "v1:abc",
  geometry_fingerprint: "abc",
  license: "",
  attribution: "",
  approximate: false,
};

const boundaryObj = {
  region_id: "geo:test-1",
  geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  display_geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  bbox: [-1, -1, 1, 1],
  centroid: { lon: 0, lat: 0 },
  boundary_version: "v1:abc",
  geometry_fingerprint: "abc",
  provenance: { provider: "test" },
  warning: null,
};

const jobProcessing = {
  job_id: "job_1",
  status: "processing",
  progress: ["Queued", "Processing", "Retrieving historical observations"],
  progress_pct: 30,
  analysis_id: null,
  warnings: [],
  error: null,
};

const cachedResult = {
  analysis_id: "an_1",
  run_id: "run_1",
  region_id: "geo:test-1",
  display_name: "Testville",
  admin_level: "city",
  boundary_version: "v1:abc",
  start_year: 2000,
  end_year: 2002,
  actual_start: "2000-01-01",
  actual_end: "2002-12-31",
  hazard: "heatwave",
  methodology_version: "heatwave-v2",
  baseline: { start: 1991, end: 2020 },
  provider: "open-meteo",
  dataset_version: "openmeteo-archive-v1",
  aggregation: "sampled-area-mean-v1",
  annual: [
    { year: 2000, event_count: 1, heatwave_days: 3, mean_duration_days: 3, max_duration_days: 3, peak_tmax_c: 35, valid_days: 366, total_days: 366, completeness: 1, incomplete: false },
    { year: 2001, event_count: 0, heatwave_days: 0, mean_duration_days: null, max_duration_days: null, peak_tmax_c: null, valid_days: 365, total_days: 365, completeness: 1, incomplete: false },
  ],
  trends: { heatwave_days: { supported: false, reason: "demo" } },
  insights: [{ type: "total", metric: "heatwave_days", text: "3 total days." }],
  warnings: [],
  provenance: {},
  provenance_detail: null,
  created_at: new Date().toISOString(),
};

function mockFetch() {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  return vi.fn(async (input: unknown, init?: { method?: string }) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/v1/geography/search")) return json([regionObj]);
    if (url.includes("/boundary")) return json(boundaryObj);
    if (url.includes("/api/v1/geography/regions/")) return json(regionObj);
    if (url.includes("/api/v1/analyses") && method === "POST") {
      return json(
        { status: "queued", job_id: "job_1", analysis_id: null, cache_hit: false, message: "q" },
        202,
      );
    }
    if (url.includes("/api/v1/jobs/job_1")) return json(jobProcessing);
    return json({ detail: `not mocked: ${url}` }, 404);
  });
}

function mockFetchCacheHit() {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  return vi.fn(async (input: unknown, init?: { method?: string }) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/v1/geography/search")) return json([regionObj]);
    if (url.includes("/boundary")) return json(boundaryObj);
    if (url.includes("/api/v1/geography/regions/")) return json(regionObj);
    if (url.includes("/api/v1/analyses") && method === "POST") {
      return json(
        { status: "completed", job_id: "job_9", analysis_id: "an_1", cache_hit: true, message: "hit" },
        200,
      );
    }
    if (url.includes("/api/v1/jobs/job_9")) {
      return json({ ...jobProcessing, job_id: "job_9", status: "completed", analysis_id: "an_1", progress_pct: 100 });
    }
    if (url.includes("/api/v1/analyses/an_1")) return json(cachedResult);
    return json({ detail: `not mocked: ${url}` }, 404);
  });
}

function mockFetchCompletedWithMissingResult() {  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  return vi.fn(async (input: unknown, init?: { method?: string }) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/v1/geography/search")) return json([regionObj]);
    if (url.includes("/boundary")) return json(boundaryObj);
    if (url.includes("/api/v1/geography/regions/")) return json(regionObj);
    if (url.includes("/api/v1/analyses") && method === "POST") {
      return json(
        { status: "queued", job_id: "job_1", analysis_id: null, cache_hit: false, message: "q" },
        202,
      );
    }
    // Backend restarted: job record says completed, but the result is gone.
    if (url.includes("/api/v1/jobs/job_1")) {
      return json({ ...jobProcessing, status: "completed", analysis_id: "an_gone" });
    }
    if (url.includes("/api/v1/analyses/an_gone")) return json({ detail: "analysis not found" }, 404);
    return json({ detail: `not mocked: ${url}` }, 404);
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  // unstubAllGlobals removes this too — restore for the next test.
  vi.stubGlobal("ResizeObserver", _RO);
});

describe("ExplorePage analysis flow", () => {
  function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
    vi.stubGlobal("fetch", fetchMock);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/explore"]}>
          <ExplorePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  async function selectRegionAndAnalyze() {
    fireEvent.change(screen.getByLabelText(/geographic search/i), { target: { value: "Tes" } });
    fireEvent.click(await screen.findByRole("option", { name: /Testville/ }));
    await screen.findByText(/Selected:/);
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
  }

  it("shows the processing section with backend stage after Analyze is clicked", async () => {
    renderPage(mockFetch());
    await selectRegionAndAnalyze();

    // The processing section with progress bar + live backend stage appears
    // (the stage text shows in both the header and the step list).
    await screen.findByRole("status");
    const hits = await screen.findAllByText(/Retrieving historical observations/);
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });

  it("populates cached results instead of stalling on Analyze", async () => {
    renderPage(mockFetchCacheHit());
    await selectRegionAndAnalyze();

    // Cache hit must render the stored report — not leave a dead button.
    const title = await screen.findAllByText(/Testville — heatwaves 2000–2002/);
    expect(title.length).toBeGreaterThanOrEqual(1);
  });

  it("re-enables Analyze when the job completes but the result is gone", async () => {
    renderPage(mockFetchCompletedWithMissingResult());
    await selectRegionAndAnalyze();

    // Orphaned terminal job: wait for the full cycle (explanation appears),
    // then the button must be back to an enabled Analyze state — never wedged.
    const note = await screen.findAllByText(/could not be loaded/);
    expect(note.length).toBeGreaterThanOrEqual(1);
    const btn = screen.getByRole("button", { name: "Analyze" });
    expect(btn.getAttribute("disabled")).toBeNull();
  });
});
