import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { AddressSearchResult } from "../../types/app";
import { DuckDbQuery } from "../DuckDbQuery.ts";

export const closestAddressesQueryFunction: UseDuckDbQueryFunction<
  AddressSearchResult,
  {
    longitude: number;
    latitude: number;
  }
> = async (connection: AsyncDuckDBConnection) =>
  DuckDbQuery.build<
    { longitude: number; latitude: number },
    AddressSearchResult
  >(
    connection,
    `SELECT
    id,
    address_line_1,
    address_line_2,
    city,
    zipcode,
    ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance
  FROM addresses
  ORDER BY
    distance ASC
  LIMIT ${SEARCH_RESULT_LIMIT}`,
    ["longitude", "latitude"] as const,
  );
