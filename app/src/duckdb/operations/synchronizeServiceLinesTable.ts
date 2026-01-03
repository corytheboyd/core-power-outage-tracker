import { toGeoJSON } from "@mapbox/polyline";
import type { DuckDbManager } from "../DuckDbManager.ts";

export async function synchronizeServiceLinesTable(duckdb: DuckDbManager) {
  const { db, connection } = duckdb;

  const response = await fetch("/base.json");
  const rawData: { lines: { g: string }[] } = await response.json();

  const preparedData = rawData.lines.map((line) => {
    return {
      geometry: toGeoJSON(line.g),
    };
  });
  await db.registerFileText("service_lines.json", JSON.stringify(preparedData));

  await connection.query(`
    CREATE OR REPLACE TABLE service_lines AS
    SELECT 
      ST_GeomFromGeoJSON(geometry)
    FROM 'service_lines.json'
  `);
}
