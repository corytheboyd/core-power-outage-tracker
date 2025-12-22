import polyline from "@mapbox/polyline";

const OUTAGE_LINES_API =
  "https://cache.sienatech.com/apex/siena_ords/webmaps/lines/CORE/temp?zoom=20";
const CACHE_KEY = "outageLines";

export interface OutageLine {
  lineId: string;
  coordinates: [number, number][]; // [lng, lat] pairs
}

interface PolylineCache {
  etag: string;
  timestamp: number;
  lines: OutageLine[];
}

interface ApiResponse {
  uid: number;
  state: string;
  zoom: number;
  lineType: string;
  lines: {
    g: string; // encoded polyline
    f: string; // line ID
    e: number;
    t: string;
  }[];
  lineCount: number;
}

/**
 * Fetch outage lines from CORE API with ETag caching
 */
export async function fetchOutageLines(): Promise<OutageLine[]> {
  // Try to get cached data
  const cached = getCachedLines();

  try {
    // Make request with If-None-Match header if we have an ETag
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (cached?.etag) {
      headers["If-None-Match"] = cached.etag;
    }

    const response = await fetch(OUTAGE_LINES_API, {
      method: "GET",
      headers,
    });

    // If 304 Not Modified, use cached data
    if (response.status === 304 && cached) {
      console.log("Using cached outage lines (304 Not Modified)");
      return cached.lines;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get new ETag from response
    const etag = response.headers.get("ETag") || "";

    // Parse response
    const data: ApiResponse = await response.json();

    // Decode polylines
    const lines: OutageLine[] = [];
    for (const line of data.lines) {
      try {
        // Decode polyline using @mapbox/polyline
        // It returns [[lat, lng], ...] so we need to swap to [lng, lat]
        const decoded = polyline.decode(line.g);
        const coordinates: [number, number][] = decoded.map(
          (coord) => [coord[1], coord[0]] as [number, number],
        );

        lines.push({
          lineId: line.f,
          coordinates,
        });
      } catch (err) {
        console.warn(`Failed to decode polyline for line ${line.f}:`, err);
        // Skip this line and continue
      }
    }

    console.log(`Fetched ${lines.length} outage lines from API`);

    // Cache the result
    setCachedLines({
      etag,
      timestamp: Date.now(),
      lines,
    });

    return lines;
  } catch (error) {
    console.error("Failed to fetch outage lines:", error);

    // If we have cached data, return it with a warning
    if (cached) {
      console.warn("Falling back to cached outage lines due to fetch error");
      return cached.lines;
    }

    // No cached data and fetch failed - return empty array
    console.warn("No cached data available, returning empty outage lines");
    return [];
  }
}

/**
 * Get cached lines from localStorage
 */
function getCachedLines(): PolylineCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as PolylineCache;

    // Validate cache structure
    if (!parsed.etag || !Array.isArray(parsed.lines)) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn("Failed to parse cached outage lines:", err);
    return null;
  }
}

/**
 * Set cached lines in localStorage
 */
function setCachedLines(cache: PolylineCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("Failed to cache outage lines:", err);
  }
}

/**
 * Clear cached lines (useful for debugging)
 */
export function clearOutageCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
