import { getDuckDbManager } from "../getDuckDbManager.ts";
import { ResultSet } from "../ResultSet.ts";
import { type LineString, LineStringSchema } from "../../models/LineString.ts";

export const getNearbyOutageLines = async (args: {
  longitude: number;
  latitude: number;
}): Promise<LineString[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT
        ST_AsGeoJson(geometry) AS geojson_linestring,
        ST_Distance(
          geometry::LINESTRING_2D,
          ST_Point2D(${args.longitude}, ${args.latitude})
        ) AS distance
      FROM outage_lines
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
