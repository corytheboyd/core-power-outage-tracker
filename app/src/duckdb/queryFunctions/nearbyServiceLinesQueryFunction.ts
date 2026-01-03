import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { ServiceLine } from "../../models/ServiceLine.ts";
import { ServiceLineSchema } from "../../models/ServiceLine.ts";
import { DuckDbQuery } from "../DuckDbQuery.ts";

export const nearbyServiceLinesQueryFunction: UseDuckDbQueryFunction<
  ServiceLine,
  {
    longitude: number;
    latitude: number;
  }
> = async (connection: AsyncDuckDBConnection) => {
  const sql = `
    SELECT
      ST_AsGeoJson(geometry) AS geojson_linestring,
      ST_Distance(
        geometry::LINESTRING_2D,
        ST_Point2D(?, ?)
      ) AS distance
    FROM service_lines
    WHERE 
      distance < 0.005
    ORDER BY distance ASC
  `;

  const statement = await connection.prepare(sql);

  return new DuckDbQuery<{ longitude: number; latitude: number }, ServiceLine>({
    statement,
    sql,
    paramOrder: ["longitude", "latitude"] as const,
    transformItem: (o) => {
      return ServiceLineSchema.parse({
        geometry: JSON.parse(o.geojson_linestring as string),
      });
    },
  });
};
