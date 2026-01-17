import { getDuckDbManager } from "../getDuckDbManager.ts";
import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import { ResultSet } from "../ResultSet.ts";
import { type Address, AddressSchema } from "../../models/Address.ts";
import { v7 } from "uuid";

export const searchAddresses = async (args: {
  searchTerm: string;
}): Promise<Address[]> => {
  const duckdb = await getDuckDbManager();
  const timeLabel = `getAllAddressesInBounds:${v7()}`;
  console.time(timeLabel);

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT id,
             address,
             city,
             county,
             zipcode,
             ST_Y(location::POINT_2D) as latitude,
             ST_X(location::POINT_2D) as longitude,
             jaro_winkler_similarity(UPPER(address || ' ' || city || ' ' || zipcode), UPPER('${args.searchTerm}'), 0.7) AS score
      FROM addresses
      WHERE score > 0
      ORDER BY score DESC
      LIMIT ${SEARCH_RESULT_LIMIT}
    `);

    const resultSet = new ResultSet(results, (o) => AddressSchema.parse(o));

    console.timeEnd(timeLabel);
    return resultSet.toArray();
  });
};
