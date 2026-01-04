import type { AddressSearchResult } from "../../types/app";
import { getDuckDbManager } from "../getDuckDbManager.ts";
import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import { AddressSchema } from "../../models/Address.ts";
import { ResultSet } from "../ResultSet.ts";

export const searchAddresses = async (args: {
  longitude: number;
  latitude: number;
  searchTerm: string;
}): Promise<AddressSearchResult[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT id,
             address,
             city,
             county,
             zipcode,
             ST_Y(location::POINT_2D) as latitude,
             ST_X(location::POINT_2D) as longitude,
             jaro_winkler_similarity(address, UPPER('${args.searchTerm}'), 0.7) AS score,
             ST_Distance_Spheroid(
               ST_FlipCoordinates(location::POINT_2D),
               ST_Point2D(${args.latitude}, ${args.longitude})
             ) AS distance
      FROM addresses
      WHERE score > 0
      ORDER BY score DESC LIMIT ${SEARCH_RESULT_LIMIT}
    `);

    const resultSet = new ResultSet(results, (o) => ({
      address: AddressSchema.parse(o),
      distance: o.distance as number,
      score: o.score as number,
    }));
    return resultSet.toArray();
  });
};
