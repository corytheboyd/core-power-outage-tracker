import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { ServiceLine } from "../../models/ServiceLine.ts";
import { ServiceLineSchema } from "../../models/ServiceLine.ts";
import { DuckDbQuery } from "../DuckDbQuery.ts";

export const nearbyPowerLinesQueryFunction: UseDuckDbQueryFunction<
  ServiceLine,
  {
    longitude: number;
    latitude: number;
    radiusMeters: number;
  }
> = async (connection: AsyncDuckDBConnection) => {
  const sql = `
    SELECT
      id,
      ST_AsText(geometry) as geometry_wkt,
      ST_Distance_Sphere(ST_Point2D(?, ?), geometry) AS distance
    FROM power_lines
    WHERE ST_Distance_Sphere(ST_Point2D(?, ?), geometry) < ?
    ORDER BY distance ASC
  `;

  const statement = await connection.prepare(sql);

  return new DuckDbQuery<
    { longitude: number; latitude: number; radiusMeters: number },
    ServiceLine
  >({
    statement,
    sql,
    paramOrder: [
      "latitude",
      "longitude",
      "latitude",
      "longitude",
      "radiusMeters",
    ] as const,
    transformItem: (o) => {
      // Parse WKT LINESTRING to array of [lat, lng] coordinates
      const wkt = o.geometry_wkt as string;
      const coordsStr = wkt.replace("LINESTRING(", "").replace(")", "");
      const geometry = coordsStr.split(", ").map((coord) => {
        const [lng, lat] = coord.trim().split(" ").map(Number);
        return [lat, lng] as [number, number];
      });

      return ServiceLineSchema.parse({
        id: o.id as number,
        geometry,
      });
    },
  });
};
