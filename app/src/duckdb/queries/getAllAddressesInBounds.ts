import type { Position } from "../../types/app";
import { getDuckDbManager } from "../getDuckDbManager.ts";
import { type Address, AddressSchema } from "../../models/Address.ts";
import { ResultSet } from "../ResultSet.ts";

/**
 * https://duckdb.org/docs/stable/core_extensions/spatial/functions#st_makeenvelope
 * GEOMETRY ST_MakeEnvelope (min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE)
 * */
export const getAllAddressesInBounds = async (args: {
  northEastPosition: Position;
  southWestPosition: Position;
}): Promise<Address[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      SELECT id,
             address,
             city,
             county,
             zipcode,
             ST_Y(location::POINT_2D) AS latitude,
             ST_X(location::POINT_2D) AS longitude
      FROM addresses
      WHERE
        ST_Within(
            location::GEOMETRY,
            ST_MakeEnvelope(
              ${args.southWestPosition.longitude},
              ${args.southWestPosition.latitude},
              ${args.northEastPosition.longitude},
              ${args.northEastPosition.latitude}
            )
        ) = true
    `);

    const resultSet = new ResultSet(results, (o) => AddressSchema.parse(o));
    return resultSet.toArray();
  });
};
