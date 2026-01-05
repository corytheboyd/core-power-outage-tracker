import { getDuckDbManager } from "../getDuckDbManager.ts";
import { ResultSet } from "../ResultSet.ts";
import { type LineString, LineStringSchema } from "../../models/LineString.ts";
import type { Position } from "../../types/app";

export const getAllOutageLinesInBounds = async (args: {
  northEastPosition: Position;
  southWestPosition: Position;
}): Promise<LineString[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT
        ST_AsGeoJson(geometry) AS geojson_linestring,
      FROM outage_lines
      WHERE
        ST_Intersects(
          geometry,
          ST_MakeEnvelope(
            ${args.southWestPosition.longitude},
            ${args.southWestPosition.latitude},
            ${args.northEastPosition.longitude},
            ${args.northEastPosition.latitude}
          )
        )
    `);

    const resultSet = new ResultSet(results, (o) =>
      LineStringSchema.parse({
        geometry: JSON.parse(o.geojson_linestring as string),
      }),
    );
    return resultSet.toArray();
  });
};
