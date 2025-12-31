import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import type { AddressSearchResult } from "../../types/app";
import { DuckDbQuery } from "../DuckDbQuery.ts";
import { AddressSchema } from "../../models/Address.ts";

export const searchAddressesQueryFunction: UseDuckDbQueryFunction<
  AddressSearchResult,
  {
    latitude: number;
    longitude: number;
    searchTerm: string;
  }
> = async (connection: AsyncDuckDBConnection) => {
  const sql = `
    SELECT id,
           address_line_1,
           address_line_2,
           city,
           zipcode,
           jaro_winkler_similarity(concat_ws(' ', address_line_1, address_line_2), UPPER(?), 0.7) AS score,
           ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance
    FROM addresses
    WHERE score > 0
    ORDER BY score DESC LIMIT ${SEARCH_RESULT_LIMIT}
    `;
  const statement = await connection.prepare(sql);
  return new DuckDbQuery({
    statement,
    sql,
    paramOrder: ["searchTerm", "latitude", "longitude"] as const,
    transformItem: (o) => ({
      address: AddressSchema.parse(o),
      distance: o.distance as number,
      score: o.score as number,
    }),
  });
};
