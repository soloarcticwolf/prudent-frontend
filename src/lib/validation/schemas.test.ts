import { describe, expect, it } from "vitest";
import { analysisFormSchema } from "./schemas";

describe("analysis form validation", () => {
  it("accepts heatwave default with a valid interval", () => {
    const r = analysisFormSchema.safeParse({ region_id: "geo:london-gb", start_year: 1995, end_year: 2020, hazard: "heatwave" });
    expect(r.success).toBe(true);
  });

  it("rejects reversed and oversized intervals", () => {
    expect(
      analysisFormSchema.safeParse({ region_id: "geo:london-gb", start_year: 2020, end_year: 1995, hazard: "heatwave" }).success,
    ).toBe(false);
    expect(
      analysisFormSchema.safeParse({ region_id: "geo:london-gb", start_year: 1900, end_year: 2025, hazard: "heatwave" }).success,
    ).toBe(false);
  });

  it("requires a canonical region id", () => {
    expect(
      analysisFormSchema.safeParse({ region_id: "", start_year: 2000, end_year: 2010, hazard: "heatwave" }).success,
    ).toBe(false);
  });
});
