import { toGeoJSON } from "@mapbox/polyline";
import type { DuckDbManager } from "../DuckDbManager.ts";

export async function synchronizeOutageLinesTable(duckdb: DuckDbManager) {
  const response = await fetch("/temp.json");
  const rawData: { lines: { g: string }[] } = await response.json();

  const preparedData = rawData.lines.map((line) => {
    return {
      geometry: toGeoJSON(line.g),
    };
  });

  await duckdb.db.registerFileText(
    "outage_lines.json",
    JSON.stringify(preparedData),
  );

  await duckdb.withConnection(async (c) => {
    await c.query(`
      CREATE OR REPLACE TABLE outage_lines AS
      SELECT 
        ST_GeomFromGeoJSON(geometry) AS geometry
      FROM 'outage_lines.json'
    `);
  });
}
