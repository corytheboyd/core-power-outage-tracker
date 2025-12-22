import * as zip from "@zip.js/zip.js";
import * as shapefile from "shapefile";
import type { WorkerRequest, WorkerResponse } from "./types";
import { getCachedData, setCachedData } from "../lib/cache";
import { createTableFromFeatures, initDuckDB, searchAddresses } from "../lib/duckdb";

let cancelled = false;
let dbInitialized = false;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const message = e.data;
  console.debug("message", message);

  if (message.type === "CANCEL") {
    cancelled = true;
    return;
  }

  if (message.type === "INIT") {
    cancelled = false;
    await processShapefile(message.url);
  }

  if (message.type === "SEARCH") {
    await performSearch(message.query);
  }
};

async function processShapefile(url: string) {
  try {
    // Initialize DuckDB
    postProgress(0, 100, "Initializing database");
    await initDuckDB();

    // Check cache first
    postProgress(5, 100, "Checking cache");
    const cached = await getCachedData(url);

    // Make conditional request
    const headers: HeadersInit = {};
    if (cached?.etag) {
      headers["If-None-Match"] = cached.etag;
    }
    if (cached?.lastModified) {
      headers["If-Modified-Since"] = cached.lastModified;
    }

    postProgress(10, 100, "Fetching ZIP file");
    const response = await fetch(url, { headers });

    // 304 Not Modified - use cached features
    if (response.status === 304 && cached?.features) {
      postProgress(20, 100, "Loading cached data");
      postProgress(50, 100, "Creating database table");
      await createTableFromFeatures(cached.features);
      dbInitialized = true;
      postComplete(cached.totalFeatures);
      return;
    }

    // Process new data
    const blob = await response.blob();

    if (cancelled) return;

    // Stage 2: Extract ZIP
    postProgress(30, 100, "Extracting ZIP");
    const blobReader = new zip.BlobReader(blob);
    const zipReader = new zip.ZipReader(blobReader);
    const entries = await zipReader.getEntries();

    if (cancelled) return;

    // Find .shp and .dbf files
    const shpEntry = entries
      .filter((e) => !e.directory)
      .find((e) => e.filename.endsWith(".shp"));

    const dbfEntry = entries
      .filter((e) => !e.directory)
      .find((e) => e.filename.endsWith(".dbf"));

    if (!shpEntry) {
      throw new Error("No .shp file found in ZIP");
    }

    // Extract shapefile and database
    postProgress(50, 100, "Extracting shapefile");
    const shpBuffer = await shpEntry.getData(new zip.Uint8ArrayWriter());
    const dbfBuffer = dbfEntry
      ? await dbfEntry.getData(new zip.Uint8ArrayWriter())
      : undefined;

    if (cancelled) return;

    // Stage 3: Parse shapefile with attributes
    postProgress(70, 100, "Parsing shapefile");
    const source = await shapefile.open(shpBuffer, dbfBuffer);

    // Collect features
    const features: GeoJSON.Feature[] = [];
    let result = await source.read();

    while (!result.done && !cancelled) {
      const feature = result.value as GeoJSON.Feature;
      features.push(feature);
      result = await source.read();
    }

    if (cancelled) return;

    // Create DuckDB table from features
    postProgress(85, 100, "Creating database table");
    await createTableFromFeatures(features);
    dbInitialized = true;

    // Cache the features (DuckDB table recreated from cache on reload)
    postProgress(95, 100, "Caching data");
    const etag = response.headers.get("ETag");
    const lastModified = response.headers.get("Last-Modified");

    await setCachedData({
      url,
      etag,
      lastModified,
      features,
      totalFeatures: features.length,
      timestamp: Date.now(),
    });

    postComplete(features.length);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    postError(errorMessage);
  }
}

function postProgress(loaded: number, total: number, stage: string) {
  const response: WorkerResponse = { type: "PROGRESS", loaded, total, stage };
  self.postMessage(response);
}

function postComplete(totalFeatures: number) {
  const response: WorkerResponse = { type: "COMPLETE", totalFeatures };
  self.postMessage(response);
}

function postError(error: string) {
  const response: WorkerResponse = { type: "ERROR", error };
  self.postMessage(response);
}

async function performSearch(query: string) {
  try {
    if (!dbInitialized) {
      postError("Database not initialized");
      return;
    }

    // Use SQL query to search
    const results = await searchAddresses(query, 100);
    console.log("results", results);

    const response: WorkerResponse = {
      type: "SEARCH_RESULTS",
      results,
      query,
    };
    self.postMessage(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Search error";
    postError(errorMessage);
  }
}
