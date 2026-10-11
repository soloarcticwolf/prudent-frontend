import type { AnalysisResult, AnnualMetric } from "../../types/api";
import { ChevronDown } from "lucide-react";
import { AnalysisCharts } from "../charts/AnalysisCharts";
import { MetricHow, ProvenanceSection } from "./ProvenanceSection";
import { Alert, Badge, Card, CardHeader } from "../ui/primitives";

export function summarize(annual: AnnualMetric[]) {
  const valid = annual.filter((a) => !a.incomplete);
  const totalEvents = valid.reduce((s, a) => s + a.event_count, 0);
  const totalDays = valid.reduce((s, a) => s + a.heatwave_days, 0);
  const maxDur = valid.reduce((m, a) => Math.max(m, a.max_duration_days ?? 0), 0);
  return {
    validYears: valid.length,
    totalEvents,
    totalDays,
    // True mean over the same event set: total days / total events (not a mean of annual means).
    meanDuration: totalEvents > 0 ? totalDays / totalEvents : null,
    maxDuration: valid.length ? maxDur : null,
  };
}

function Metric({ label, value, unit, def, how }: { label: string; value: string; unit?: string; def: string; how?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ivory px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink tnum">
        {value} {unit ? <span className="text-sm text-secondary">{unit}</span> : null}
      </p>
      <p className="mt-1 text-xs text-secondary">{def}</p>
      {how ? <MetricHow text={how} /> : null}
    </div>
  );
}

export function ResultsDashboard({ result }: { result: AnalysisResult }) {
  const s = summarize(result.annual);
  const trend = result.trends?.heatwave_days;
  const lineage = Object.fromEntries(
    (result.provenance_detail?.metric_lineage ?? []).map((m) => [m.metric, m]),
  );
  const how = (id: string, fallback: string) => {
    const m = lineage[id] as { derivation?: string; exclusions?: string | null; method?: string | null; statistics?: string | null } | undefined;
    if (!m?.derivation) return fallback;
    return [m.derivation, m.exclusions ? `Exclusions: ${m.exclusions}.` : "", m.method ? `Method: ${m.method}.` : "", m.statistics ? `Statistics: ${m.statistics}.` : ""]
      .filter(Boolean)
      .join(" ");
  };
  const trendText =
    trend?.supported && trend.slope_per_year != null
      ? `${trend.slope_per_year >= 0 ? "+" : ""}${trend.slope_per_year.toFixed(3)} days/yr (n=${trend.n_years}, p=${trend.p_value?.toPrecision(3)})`
      : (trend?.reason ?? "Trend not supported for this interval.");

  return (
    <div className="space-y-4">
      {result.warnings.map((w) => (
        <Alert key={w} kind="warn">{w}</Alert>
      ))}

      <Card>
        <CardHeader
          title={`${result.display_name} — heatwaves ${result.start_year}–${result.end_year}`}
          sub={`Annual metrics · ${s.validYears} valid years · methodology ${result.methodology_version} · baseline ${(result.baseline as { start?: number }).start ?? 1991}–${(result.baseline as { end?: number }).end ?? 2020}`}
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Heatwave events" value={String(s.totalEvents)} unit="events" def="Count of ≥3-day exceedance events in the interval." how={how("heatwave_events", "Detected ≥3-day exceedance events under the reported methodology version.")} />
          <Metric label="Heatwave days" value={String(s.totalDays)} unit="days" def="Total days inside heatwave events." how={how("heatwave_days", "Sum of qualifying event durations, allocated by start year.")} />
          <Metric
            label="Mean event duration"
            value={s.meanDuration != null ? s.meanDuration.toFixed(1) : "—"}
            unit="days"
            def="Average length of detected events; unsupported values shown as —, never zero."
            how={how("mean_duration", "Total durations divided by event count.")}
          />
          <Metric
            label="Longest event"
            value={s.maxDuration != null ? String(s.maxDuration) : "—"}
            unit="days"
            def="Maximum single-event duration in the interval."
            how="Maximum duration across the same detected events counted above; missing days never extend an event."
          />
          <div className="sm:col-span-2 lg:col-span-2">
            <Metric label="Trend (heatwave days)" value={trendText} def="OLS trend estimate with uncertainty; not causal attribution." how={how("trend", "OLS regression on complete years.")} />
          </div>
        </div>
      </Card>

      <AnalysisCharts annual={result.annual} />

      <Card>
        <CardHeader title="Evidence-based insights" sub="Every finding traces to the statistics above — no hardcoded claims." />
        <ul className="space-y-3 p-5">
          {result.insights.map((ins, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <Badge tone={ins.type === "coverage" ? "warn" : "neutral"}>{ins.metric}</Badge>
              <span className="text-ink">{ins.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <details className="group rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(32,48,45,0.06)]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 focus-visible:outline-2 focus-visible:outline-forest [&::-webkit-details-marker]:hidden">
          <span>
            <span className="font-serif text-lg text-ink">Expand result derivation</span>
            <span className="block text-sm text-secondary">Sources, timestamps, and the full step-by-step calculation behind these results.</span>
          </span>
          <ChevronDown size={20} className="shrink-0 text-forest transition-transform duration-200 group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-line p-4">
          <ProvenanceSection result={result} />
        </div>
      </details>

      <Card>
        <CardHeader title="Methodology & provenance" sub="How this result was produced and what limits it." />
        <dl className="grid gap-x-8 gap-y-2 p-5 text-sm sm:grid-cols-2">
          {[
            ["Data provider", `${result.provider} (${result.dataset_version})`],
            ["Aggregation", String(result.aggregation)],
            ["Reference baseline", `${(result.baseline as { start?: number }).start ?? 1991}–${(result.baseline as { end?: number }).end ?? 2020}, 95th percentile ±7-day window`],
            ["Heatwave definition", `≥3 consecutive valid days above calendar-day threshold (${result.methodology_version})`],
            ["Analysis period", `${result.actual_start} → ${result.actual_end}`],
            ["Trend method", "Ordinary least-squares on complete years; incomplete years excluded"],
            ["Attribution", "Historical reanalysis via Open-Meteo archive API (ERA5 family)"],
            ["Created", new Date(result.created_at).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col border-b border-line py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-secondary">{k}</dt>
              <dd className="mt-0.5 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="px-5 pb-5 text-xs text-secondary">
          Known limits: coarse reanalysis resolution cannot describe street-level conditions; missing
          observations are excluded, never zero-filled; trend p-values are not causal proof.
        </p>
      </Card>
    </div>
  );
}
