import { getDuckDbManager } from "../getDuckDbManager.ts";
import { toGeoJSON } from "@mapbox/polyline";

export async function synchronizeServiceLinesTable() {
  const { db, connection } = await getDuckDbManager();

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
