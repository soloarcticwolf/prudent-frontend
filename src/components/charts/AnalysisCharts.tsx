import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnnualMetric } from "../../types/api";
import { Card, CardHeader } from "../ui/primitives";

function Tip({ active, payload, label, unit }: { active?: boolean; payload?: { value?: number | null }[]; label?: string; unit: string }) {
  if (!active) return null;
  const v = payload?.[0]?.value;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow">
      <p className="font-semibold tnum">{label}</p>
      <p className="tnum">{v === null || v === undefined ? "No data" : `${v} ${unit}`}</p>
    </div>
  );
}

function Frame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} sub={sub} />
      <div className="h-64 px-2 py-3">{children}</div>
      <p className="px-5 pb-4 text-xs text-secondary">{sub}</p>
    </Card>
  );
}

/** Gaps (null) break the line — missing years are never interpolated. */
export function AnalysisCharts({ annual }: { annual: AnnualMetric[] }) {
  const rows = [...annual].sort((a, b) => a.year - b.year);
  const freq = rows.map((a) => ({ year: a.year, value: a.incomplete ? null : a.event_count }));
  const days = rows.map((a) => ({ year: a.year, value: a.incomplete ? null : a.heatwave_days }));
  const dur = rows.map((a) => ({ year: a.year, value: a.incomplete ? null : a.mean_duration_days ?? null }));
  const peak = rows.filter((a) => !a.incomplete).reduce<AnnualMetric | null>(
    (best, a) => (!best || a.event_count > best.event_count ? a : best),
    null,
  );

  const chart = (
    data: { year: number; value: number | null }[],
    unit: string,
    color: string,
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="#DFE2D8" strokeDasharray="3 3" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} tickMargin={6} />
        <YAxis tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
        <Tooltip content={<Tip unit={unit} />} />
        <Legend />
        <Line type="monotone" dataKey="value" name={unit} stroke={color} strokeWidth={2} dot={false} connectNulls={false} />
        {peak && data === freq ? (
          <ReferenceDot x={peak.year} y={peak.event_count} r={4} fill="#C96F53" stroke="#fff" />
        ) : null}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Frame title="Annual heatwave frequency" sub="Events per year. Gaps mark incomplete years — never drawn as zero.">
        {chart(freq, "events", "#24584F")}
      </Frame>
      <Frame title="Annual heatwave days" sub="Total days in heatwave events per year, with units and legend.">
        {chart(days, "days", "#C96F53")}
      </Frame>
      <div className="md:col-span-2">
        <Frame title="Mean event duration" sub="Average heatwave length in days. Missing years shown as gaps, not interpolated.">
          {chart(dur, "days/event", "#68736D")}
        </Frame>
      </div>
    </div>
  );
}
