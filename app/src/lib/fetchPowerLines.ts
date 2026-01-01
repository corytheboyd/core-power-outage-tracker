import polyline from "@mapbox/polyline";

interface BaseJsonLine {
  g: string; // encoded polyline
}

interface BaseJsonResponse {
  lines: BaseJsonLine[];
}

export interface DecodedPowerLine {
  id: number;
  geometry: [number, number][];
}

export async function fetchPowerLines(): Promise<DecodedPowerLine[]> {
  const response = await fetch("/base.json");
  const data: BaseJsonResponse = await response.json();

  return data.lines.map((line, index) => ({
    id: index,
    geometry: polyline.decode(line.g) as [number, number][],
  }));
}
