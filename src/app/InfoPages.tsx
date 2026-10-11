import { Card } from "../components/ui/primitives";

const rows: [string, string][] = [
  ["Data provider", "Open-Meteo Historical Weather API (archive), ERA5-family reanalysis. Daily maximum temperature, °C. Coverage and resolution vary by location and are validated per request."],
  ["Reference baseline", "1991–2020 fixed baseline where coverage allows. If a location lacks adequate reference data, the analysis returns a limitation — never an invented baseline."],
  ["Heatwave definition (heatwave-v1)", "≥3 consecutive valid days with daily Tmax above the regional calendar-day 95th percentile (±7-day window, linear interpolation, ≥100 baseline obs). Missing days break runs and are never bridged or zero-filled. Feb 29 maps to Feb 28."],
  ["Regional aggregation", "Deterministic multi-point sampling inside the canonical boundary with an equal-weight mean (sampled-area-mean-v1), recorded in provenance. Coarse resolution cannot describe street-level conditions."],
  ["Trend method", "Ordinary least-squares on complete years (≥80% valid days). Reports slope, p-value, 95% CI, and modeled change; short series carry warnings. P-values are not causal attribution."],
  ["Caching", "Deterministic SHA-256 key over region ID, boundary version, geometry fingerprint, dataset, period, baseline, and methodology. Incompatible inputs never share results."],
  ["Boundaries", "Primary: geoBoundaries admin polygons (per-release license recorded). Overview: Natural Earth (public domain). Local detail: OpenStreetMap/Nominatim (ODbL, © OSM contributors). Preview catalog shapes are flagged approximate."],
];

export function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">Methodology &amp; provenance</h1>
      <p className="mt-3 text-secondary">
        Everything Prudent shows can be traced back to these choices. Methodology version: <code>heatwave-v1</code>.
      </p>
      <div className="mt-6 space-y-3">
        {rows.map(([k, v]) => (
          <Card key={k} className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-forest">{k}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">{v}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">About Prudent</h1>
      <p className="mt-3 leading-relaxed text-secondary">
        Prudent is a public climate-intelligence platform for the general public, students,
        researchers, and analysts. It starts with one fully working hazard — historical heatwaves —
        and an architecture designed for more: flood indicators, drought indices, cold waves, and
        wildfire-weather conditions, each with its own validated pipeline.
      </p>
      <p className="mt-3 leading-relaxed text-secondary">
        No login is required. Where data or boundaries are missing, Prudent says so instead of
        fabricating coverage. Uncertainty is part of the product, not a footnote.
      </p>
    </div>
  );
}
