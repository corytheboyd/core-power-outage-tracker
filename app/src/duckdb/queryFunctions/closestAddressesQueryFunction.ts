import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { AddressSearchResult } from "../../types/app";
import { DuckDbQuery } from "../DuckDbQuery.ts";
import { AddressSchema } from "../../models/Address.ts";

export const closestAddressesQueryFunction: UseDuckDbQueryFunction<
  AddressSearchResult,
  {
    longitude: number;
    latitude: number;
  }
> = async (connection: AsyncDuckDBConnection) => {
  const sql = `SELECT
    id,
    address,
    city,
    county,
    zipcode,
    ST_X(location::POINT_2D) as latitude,
    ST_Y(location::POINT_2D) as longitude,
    ST_Distance_Spheroid(
      ST_FlipCoordinates(location::POINT_2D),
      ST_Point2D(?, ?)
    ) AS distance
  FROM addresses
  ORDER BY
    distance ASC
  LIMIT ${SEARCH_RESULT_LIMIT}`;
  const statement = await connection.prepare(sql);
  return new DuckDbQuery<
    { longitude: number; latitude: number },
    AddressSearchResult
  >({
    statement,
    sql,
    paramOrder: ["latitude", "longitude"] as const,
    transformItem: (o) => ({
      address: AddressSchema.parse(o),
      distance: o.distance as number,
      score: o.score as number,
    }),
  });
};
