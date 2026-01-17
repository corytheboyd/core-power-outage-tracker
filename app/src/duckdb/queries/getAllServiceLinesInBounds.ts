import { getDuckDbManager } from "../getDuckDbManager.ts";
import { ResultSet } from "../ResultSet.ts";
import { type LineString, LineStringSchema } from "../../models/LineString.ts";
import type { Position } from "../../types/app";
import { v7 } from "uuid";

export const getAllServiceLinesInBounds = async (args: {
  northEastPosition: Position;
  southWestPosition: Position;
}): Promise<LineString[]> => {
  const duckdb = await getDuckDbManager();
  const timeLabel = `getAllServiceLinesInBounds:${v7()}`;
  console.time(timeLabel);

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT
        ST_AsGeoJson(geometry) AS geojson_linestring,
      FROM service_lines
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

    console.timeEnd(timeLabel);
    return resultSet.toArray();
  });
};
