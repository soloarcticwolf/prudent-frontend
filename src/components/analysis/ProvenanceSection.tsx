import { useState } from "react";
import { Check, Copy, Database, ExternalLink, Info, Map as MapIcon, MapPin } from "lucide-react";
import type { AnalysisResult, SourceRecord } from "../../types/api";
import { Alert, Badge, Card, CardHeader } from "../ui/primitives";

export function fmtUTC(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export function fmtLocal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function CopyValue({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => undefined,
        );
      }}
      className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[11px] text-secondary hover:text-ink"
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      <span className="tnum max-w-40 truncate">{value}</span>
    </button>
  );
}

function roleBadge(role: SourceRecord["role"]) {
  if (role === "analytical") return <Badge tone="good">Analytical input</Badge>;
  if (role === "boundary") return <Badge>Boundary</Badge>;
  return <Badge>Display context</Badge>;
}

function RoleIcon({ role }: { role: SourceRecord["role"] }) {
  const cls = "shrink-0 text-forest";
  if (role === "analytical") return <Database size={20} className={cls} />;
  if (role === "boundary") return <MapPin size={20} className={cls} />;
  return <MapIcon size={20} className={cls} />;
}

function SourceCard({ source }: { source: SourceRecord }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <RoleIcon role={source.role} />
          <div>
            <p className="font-semibold text-ink">{source.provider}</p>
            <p className="text-sm text-secondary">{source.dataset}</p>
          </div>
        </div>
        {roleBadge(source.role)}
      </div>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Operation</dt><dd className="text-ink">{source.operation}</dd></div>
        <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Endpoint</dt><dd className="break-all text-ink tnum">{source.endpoint}</dd></div>
        {source.fields_consumed.length > 0 ? (
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Fields used</dt><dd className="text-ink tnum">{source.fields_consumed.join(", ")}</dd></div>
        ) : null}
        {source.units_provider || source.units_used ? (
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Units</dt><dd className="text-ink">{source.units_provider ?? "—"} → {source.units_used ?? "—"} ({source.unit_conversion})</dd></div>
        ) : null}
        {source.observation_start ? (
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Observes</dt><dd className="text-ink tnum">{source.observation_start} → {source.observation_end}</dd></div>
        ) : null}
        <div className="flex gap-2">
          <dt className="w-32 shrink-0 text-secondary">Retrieved</dt>
          <dd className="text-ink tnum">{source.retrieved_at ? `${fmtUTC(source.retrieved_at)} (${fmtLocal(source.retrieved_at)} local)` : "Not retrieved over network"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 shrink-0 text-secondary">Provider update</dt>
          <dd className="text-ink">{source.provider_updated_at ? fmtUTC(source.provider_updated_at) : "Provider update timestamp unavailable"}</dd>
        </div>
        {source.role === "analytical" ? (
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Records</dt><dd className="text-ink tnum">{source.records_accepted.toLocaleString()} accepted · {source.records_missing.toLocaleString()} missing · {source.records_rejected.toLocaleString()} rejected</dd></div>
        ) : null}
        <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Cache</dt><dd className="text-ink">{source.cache.hit ? `Reused cached response (originally retrieved ${fmtUTC(source.cache.original_retrieved_at)})` : "Fresh retrieval"}</dd></div>
        {source.response_fingerprint ? (
          <div className="flex items-center gap-2"><dt className="w-32 shrink-0 text-secondary">Fingerprint</dt><dd><CopyValue value={source.response_fingerprint} label="response fingerprint" /></dd></div>
        ) : null}
        <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">License</dt><dd className="text-ink">{source.license || "—"}</dd></div>
        {source.notes ? (
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-secondary">Note</dt><dd className="text-ink">{source.notes}</dd></div>
        ) : null}
      </dl>
      {source.docs_url ? (
        <a href={source.docs_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-forest hover:underline">
          Dataset documentation <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
  );
}

export function MetricHow({ text }: { text: string }) {
  return (
    <details className="group mt-2 text-xs">
      <summary className="inline-flex cursor-pointer items-center gap-1 font-medium text-forest hover:underline focus-visible:outline-2 focus-visible:outline-forest">
        <Info size={13} /> How is this calculated?
      </summary>
      <p className="mt-1 leading-relaxed text-secondary">{text}</p>
    </details>
  );
}

export function ProvenanceSection({ result }: { result: AnalysisResult }) {
  const det = result.provenance_detail;
  if (!det) {
    return (
      <Card>
        <CardHeader title="Data & Methodology" sub="How every number below was derived." />
        <div className="p-5">
          <Alert kind="warn">
            Provenance not fully captured for this run. This report was generated before detailed
            provenance capture existed, so retrieval timestamps and intermediate derivation records
            are unavailable. Re-running the analysis produces a fully traceable report.
          </Alert>
        </div>
      </Card>
    );
  }
  const analytical = det.sources.filter((s) => s.role === "analytical");
  const summary: [string, string][] = [
    ["Data sources", `${analytical.length} analytical (${det.sources.map((s) => s.provider).join(", ")})`],
    ["Observation period", `${det.observation_start} → ${det.observation_end}`],
    ["Data retrieved", `${fmtUTC(det.retrieved_at)} (${fmtLocal(det.retrieved_at)} local)`],
    ["Analysis generated", `${fmtUTC(det.completed_at)} (${fmtLocal(det.completed_at)} local)`],
    ["Dataset / model", `${analytical[0]?.dataset ?? (result.dataset_version as string)} via ${analytical[0]?.provider ?? result.provider}`],
    ["Methodology", `${result.methodology_version} · provenance ${det.schema_version}`],
  ];
  return (
    <Card>
      <CardHeader
        title="Data & Methodology"
        sub="Trace any number below back to its source data, transformations, and timestamps."
      />
      <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map(([k, v]) => (
          <div key={k} className="rounded-md bg-ivory px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-secondary">{k}</p>
            <p className="mt-0.5 text-[13px] text-ink tnum">{v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 px-5 pb-2">
        <h3 className="text-sm font-semibold text-ink">Sources actually used</h3>
        {det.sources.map((s) => (
          <SourceCard key={s.source_id} source={s} />
        ))}
        <p className="text-xs text-secondary">
          Only these sources contributed to this report. NOAA NCEI and Copernicus CDS are not
          integrated into this application — no data here came from them.
        </p>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">How this result was calculated</h3>
        <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
          {det.stages.map((st, i) => (
            <li key={st.stage_id}>
              <details className="group rounded-md border border-line bg-ivory/50 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-forest">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[11px] text-white tnum">{i + 1}</span>
                  {st.title}
                </summary>
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-secondary">Input</dt><dd className="text-ink">{st.input}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-secondary">Transformation</dt><dd className="text-ink">{st.transformation}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-secondary">Parameters</dt><dd className="text-ink">{st.parameters}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-secondary">Output</dt><dd className="text-ink">{st.output}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-secondary">Feeds into</dt><dd className="text-ink tnum">{st.contributes_to.join(", ")}</dd></div>
                </dl>
              </details>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-secondary">
          Run <span className="tnum">{det.run_id}</span> · cache {det.cache_hit ? "reused" : "fresh"} ·{" "}
          <CopyValue value={det.run_id} label="run id" /> · observation dates describe the climate;
          retrieval and analysis dates describe our systems — they are intentionally different.
        </p>
      </div>
    </Card>
  );
}
