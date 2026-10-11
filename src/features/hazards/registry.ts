import type { Hazard } from "../../types/api";

/** Mirrors the backend hazard registry; planned hazards render as disabled. */
export const KNOWN_HAZARDS: Pick<Hazard, "hazard_id" | "display_name" | "description" | "status">[] = [
  { hazard_id: "heatwave", display_name: "Heatwaves", description: "Extreme-heat events from daily maximum temperature.", status: "available" },
  { hazard_id: "flood", display_name: "Flood indicators", description: "Precipitation-based indicators.", status: "planned" },
  { hazard_id: "drought", display_name: "Drought indices", description: "Standardized drought indices.", status: "planned" },
  { hazard_id: "cold-wave", display_name: "Cold waves", description: "Extended cold extremes.", status: "planned" },
  { hazard_id: "wildfire-weather", display_name: "Wildfire weather", description: "Hot-dry-windy fire-weather indicators.", status: "planned" },
];
