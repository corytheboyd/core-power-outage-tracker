export type WorkerRequest =
  | { type: "INIT"; url: string }
  | { type: "CANCEL" }
  | { type: "SEARCH"; query: string };

export type WorkerResponse =
  | { type: "PROGRESS"; loaded: number; total: number; stage: string }
  | { type: "COMPLETE"; totalFeatures: number }
  | { type: "SEARCH_RESULTS"; results: GeoJSON.Feature[]; query: string }
  | { type: "ERROR"; error: string };
