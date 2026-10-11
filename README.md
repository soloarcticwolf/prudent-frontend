# Prudent frontend

Public climate-intelligence UI: search a recognized region, confirm its boundary on a map,
run a historical heatwave analysis, and explore metrics, charts, insights, and full data
provenance. No login. Built with React 18 + TypeScript (strict) + Vite + Tailwind CSS +
Recharts + MapLibre GL + Motion + React Router + TanStack Query + Zod + Lucide icons.

Deployed: https://prudent-frontend.vercel.app/ · API: https://prudent-backend.onrender.com

## 1. Setup steps

Prerequisites: Node 20+, npm 10+. The backend must be reachable (local or deployed).

```bash
cd prudent-frontend
npm install
cp .env.example .env            # then set VITE_API_BASE_URL
npm run dev                     # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm test` | Vitest suite (`src/**/*.test.ts(x)`) |
| `npm run build` | `tsc --noEmit && vite build` → `dist/` (what Vercel deploys) |
| `npm run preview` | Serve the production build locally |

Environment (all public, baked in at build time — a value change requires rebuild/redeploy):

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` (local) / `https://prudent-backend.onrender.com` (prod) | Backend origin for every API call. No secrets may use `VITE_*` — they ship in the JS bundle. |

Production notes: `vercel.json` rewrites all routes to `index.html` so deep links
(`/explore`, `/methodology`) and reloads don't 404. Backend CORS must list this app's
origin or all API calls fail in the browser.

## 2. Architecture

```
src/
  main.tsx                 — React root, global CSS
  app/
    App.tsx                — QueryClient + BrowserRouter + nav/footer shell
    HomePage.tsx           — editorial hero ("The climate is changing. Explore where.")
    ExplorePage.tsx        — analysis workspace (the product core, see flow below)
    InfoPages.tsx          — Methodology / About (static, from backend-documented method)
  components/
    layout/Chrome.tsx      — nav, footer
    ui/                    — Button, Card/Badge/Skeleton/Alert primitives
    maps/RegionMap.tsx     — lazy-loaded MapLibre map, boundary overlay layer
    charts/AnalysisCharts.tsx — Recharts time series (gap-honest: nulls break lines)
    analysis/              — SearchBox, JobProgress, ResultsDashboard, ProvenanceSection
  features/
    geography/             — (search behaviour lives in SearchBox + lib/api)
    hazards/registry.ts    — mirrors backend registry: heatwave available, rest disabled
    heatwaves/ methodology/— methodology content blocks
  lib/
    api/client.ts          — typed fetch client (all endpoints in one place)
    validation/schemas.ts  — Zod form schema (region required, 1940–2025, ≤60y span)
  hooks/                   — useDebounce (search), useAnalysisJob (job polling)
  types/api.ts             — mirrors backend Pydantic contracts (incl. provenance_detail)
```

**Explore flow (state ownership):** `ExplorePage` owns region/years/hazard/jobId; server state
lives in TanStack Query (`geo-search`, `region`, `boundary`, `job`, `analysis` keys).

1. `SearchBox` debounces (350ms, min 3 chars) → `GET /geography/search` → disambiguated
   options (e.g. Kolkata city vs district) → pick sets canonical `region_id` (+ URL param).
2. Boundary fetch → `RegionMap` renders the polygon as a translucent terracotta overlay and
   `fitBounds` the viewport to it (never a fixed zoom). Boundary layer is independent of
   thematic layers so future hazards slot in.
3. Analyze → Zod validation → `POST /analyses` → `202 Accepted` (new job) or instant
   `completed` (cache hit, same `analysis_id`).
4. `useAnalysisJob` polls `GET /jobs/{id}` every 2s until terminal; `JobProgress` shows the
   live backend stage, animated bar driven by real `progress_pct`, and cancel.
5. On completion → `GET /analyses/{id}` → `ResultsDashboard`: headline metrics → charts →
   insights → expandable "Show result derivation" (sources, stages, methodology) .
6. Editing the search text cancels in-flight work, clears results, and drops `region_id`
   from the URL. Deep links / reloads with `?region_id=` resolve the region like a fresh
   selection. A terminal job whose result can't load (backend restarted) re-enables Analyze
   with an explanatory error instead of wedging disabled.

## 3. Data source(s)

The frontend computes **nothing** scientific — every number comes from the backend. Sources
surfaced in the UI (each with docs links, licenses, and role badges in Data & Methodology):

| Source | Role | What the UI uses |
|---|---|---|
| Open-Meteo archive (ERA5 family) | Sole analytical input | All metrics/charts via backend results; attribution + docs link shown |
| Nominatim / OpenStreetMap (ODbL) | Boundaries | Search suggestions, polygon overlay, boundary version/fingerprint badges |
| CARTO Positron basemap | Display context only | Map tiles; explicitly labelled as contributing no values |
| Google Fonts | Display | DM Serif Display + Inter, with system fallbacks |
| Bundled preview catalog (via backend) | Fallback boundaries | Always badged "approximate" with a visible warning |

NOAA NCEI and Copernicus CDS are **not** integrated — the UI states this outright rather
than implying broader sourcing.

## 4. Hazard logic (as presented)

- **Heatwaves (available, default):** methodology `heatwave-v2` — ≥3 consecutive valid days
  above the regional calendar-day 95th percentile (1991–2020 baseline sampled identically to
  the analysis series); events allocated to start year; incomplete years (<80% of expected
  days) excluded from trends; OLS trend with p-value/CI; mean duration = total days ÷ total
  events; missing values shown as gaps, never zero.
- **Flood, drought, cold-wave, wildfire-weather (planned):** listed disabled in the hazard
  selector with "(planned)" — never presented as functional. The hazard registry, map-layer
  separation, and per-metric lineage are built so each future hazard plugs in its own
  pipeline without rewriting the map or report.

## 5. Assumptions

- Backend reachable at `VITE_API_BASE_URL` with CORS allowing this origin; API speaks the
  documented `/api/v1` contracts in `src/types/api.ts` (a contract drift breaks the build
  only if types diverge — runtime mismatches surface as fetch errors).
- Canonical `region_id`s are stable; display names are labels only (cache identity includes
  boundary version + geometry fingerprint, so re-picks reuse results).
- Network access to CARTO tiles, Nominatim (via backend), and Google Fonts; map-tile
  failure degrades to a warning, not a dead page.
- `jobId`/selection live in page state: a reload drops in-flight jobs (deep link keeps the
  region, not the job). Backend in-memory mode loses jobs/results on restart (Mongo
  persists them in production).
- Single public user model: no auth, no accounts; abuse control lives server-side
  (rate limits, workload caps).

## 6. What I would improve with more time

- [ ] Split the ~800 KB bundle (route-level code-splitting beyond the lazy map; upgrade
      Recharts v2 → v3).
- [ ] Year-range slider + comparison-period picker instead of numeric inputs.
- [ ] Render per-event markers on charts (click an event → its dates/intensity).
- [ ] Multi-hazard map layers (toggle/opacity/legends) once backend pipelines land.
- [ ] Offline/PWA shell with cached methodology pages; `prefers-reduced-data` awareness.


## 7. AI tools used

- [ ] **OpenCode paired with glm5.2 - With detailed multilayered prompts, planning, revisions, bugfixes, and scope for future improvements. 
