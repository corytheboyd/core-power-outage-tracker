import { getDuckDbManager } from "../getDuckDbManager.ts";
import { ResultSet } from "../ResultSet.ts";
import { type LineString, LineStringSchema } from "../../models/LineString.ts";
import type { Position } from "../../types/app";

export const getNearbyServiceLines = async (args: {
  position: Position;
}): Promise<LineString[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT
        ST_AsGeoJson(geometry) AS geojson_linestring,
        ST_Distance(
          geometry::LINESTRING_2D,
          ST_Point2D(${args.position.longitude}, ${args.position.latitude})
        ) AS distance
      FROM service_lines
      WHERE
        distance < 0.8
      ORDER BY distance ASC
    `);

    const resultSet = new ResultSet(results, (o) =>
      LineStringSchema.parse({
        geometry: JSON.parse(o.geojson_linestring as string),
      }),
    );
    return resultSet.toArray();
  });
};
