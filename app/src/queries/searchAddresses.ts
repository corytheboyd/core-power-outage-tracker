import { duckdbManager } from "../duckdbManager.ts";
import type { AddressSearchResult } from "../types/app";
import { AddressSchema } from "../models/Address.ts";
import { resultToList } from "../duckdb/resultToList.ts";
import { SEARCH_RESULT_LIMIT } from "../constants.ts";

const statement = await duckdbManager.connection.prepare(`
  SELECT id,
         address_line_1,
         address_line_2,
         city,
         zipcode,
         ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance,
         jaro_winkler_similarity(concat_ws(' ', address_line_1, address_line_2), UPPER(?), 0.7) AS score,
  FROM addresses
  WHERE score > 0
  ORDER BY score DESC LIMIT ${SEARCH_RESULT_LIMIT}
`);

export async function searchAddresses(
  searchTerm: string,
  position: GeolocationPosition,
): Promise<AddressSearchResult[]> {
  const startTime = performance.now();

  const result = await statement.query(
    position.coords.latitude,
    position.coords.longitude,
    searchTerm,
  );

  const results: AddressSearchResult[] = resultToList<{
    score: number;
    distance: number;
  }>(result).map((o) => {
    return {
      address: AddressSchema.parse(o),
      score: o.score,
      distance: o.distance,
    };
  });

  console.debug(
    "Address search completed",
    performance.now() - startTime,
    searchTerm,
    results,
  );

  return results;
}
