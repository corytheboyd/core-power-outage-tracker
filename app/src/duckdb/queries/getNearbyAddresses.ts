import { getDuckDbManager } from "../getDuckDbManager.ts";
import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import { ResultSet } from "../ResultSet.ts";
import type { AddressSearchResult, Position } from "../../types/app";
import { AddressSchema } from "../../models/Address.ts";

export const getNearbyAddresses = async (args: {
  position: Position;
}): Promise<AddressSearchResult[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT id,
             address,
             city,
             county,
             zipcode,
             ST_Y(location::POINT_2D) AS latitude,
             ST_X(location::POINT_2D) AS longitude,
             ST_Distance_Spheroid(
               ST_FlipCoordinates(location::POINT_2D),
               ST_Point2D(${args.position.latitude}, ${args.position.longitude})
             )                        AS distance
      FROM addresses
      WHERE distance < 1000
      ORDER BY distance ASC
        LIMIT ${SEARCH_RESULT_LIMIT}
    `);

    const resultSet = new ResultSet(results, (o) => ({
      address: AddressSchema.parse(o),
      distance: o.distance as number,
      score: o.score as number,
    }));
    return resultSet.toArray();
  });
};
