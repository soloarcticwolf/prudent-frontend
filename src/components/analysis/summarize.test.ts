import { describe, expect, it } from "vitest";
import { summarize } from "./ResultsDashboard";
import type { AnnualMetric } from "../../types/api";

function row(year: number, events: number, days: number, mean: number | null): AnnualMetric {
  return {
    year, event_count: events, heatwave_days: days, mean_duration_days: mean,
    max_duration_days: mean == null ? null : Math.ceil(mean),
    peak_tmax_c: null, valid_days: 365, total_days: 365, completeness: 1, incomplete: false,
  };
}

describe("dashboard summary reconciliation", () => {
  it("uses total days / total events, not a mean of annual means", () => {
    // Mirrors the West Bengal shape: uneven annual means must not skew the total.
    const annual = [
      row(2002, 1, 6, 6.0),
      row(2008, 2, 6, 3.0),
      row(2009, 2, 7, 3.5),
      row(2015, 1, 3, 3.0),
      row(2018, 2, 8, 4.0),
      row(2010, 0, 0, null),
    ];
    const s = summarize(annual);
    expect(s.totalEvents).toBe(8);
    expect(s.totalDays).toBe(30);
    expect(s.meanDuration).toBeCloseTo(30 / 8, 10); // 3.75, not 3.9
    expect(s.maxDuration).toBe(6);
  });

  it("returns null mean when no events qualify", () => {
    const s = summarize([row(2010, 0, 0, null)]);
    expect(s.meanDuration).toBeNull();
  });
});
