import { z } from "zod";

export const analysisFormSchema = z
  .object({
    region_id: z.string().min(3, "Select a recognized region from search results."),
    start_year: z.coerce.number().int().min(1940).max(2025),
    end_year: z.coerce.number().int().min(1940).max(2025),
    hazard: z.string().default("heatwave"),
  })
  .refine((v) => v.end_year >= v.start_year, {
    message: "End year must be on or after start year.",
    path: ["end_year"],
  })
  .refine((v) => v.end_year - v.start_year + 1 <= 60, {
    message: "Interval is limited to 60 years per analysis.",
    path: ["end_year"],
  });

export type AnalysisFormValues = z.infer<typeof analysisFormSchema>;
