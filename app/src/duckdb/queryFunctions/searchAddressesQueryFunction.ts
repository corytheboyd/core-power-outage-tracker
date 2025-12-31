import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { SEARCH_RESULT_LIMIT } from "../../constants.ts";
import type { AddressSearchResult } from "../../types/app";
import { DuckDbQuery } from "../DuckDbQuery.ts";

export const searchAddressesQueryFunction: UseDuckDbQueryFunction<
  AddressSearchResult,
  {
    searchTerm: string;
  }
> = async (connection: AsyncDuckDBConnection) =>
  DuckDbQuery.build(
    connection,
    `
    SELECT id,
           address_line_1,
           address_line_2,
           city,
           zipcode,
           jaro_winkler_similarity(concat_ws(' ', address_line_1, address_line_2), UPPER(?), 0.7) AS score,
    FROM addresses
    WHERE score > 0
    ORDER BY score DESC LIMIT ${SEARCH_RESULT_LIMIT}
    `,
    ["searchTerm"] as const,
  );
