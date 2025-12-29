import { duckdbManager } from "../duckdbManager.ts";
import type { AddressSearchResult } from "../types/app";
import { resultToList } from "../lib/duckdb/resultToList.ts";
import { AddressSchema } from "../models/Address.ts";

const addressSearchStatement = await duckdbManager.connection.prepare(`
  SELECT *,
         ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance,
         jaro_winkler_similarity(address_line_1, ?)                        AS text_score,
  FROM addresses
  ORDER BY distance ASC,
           text_score DESC LIMIT 10;
`);

export async function addressSearch(
  searchTerm: string,
  position: GeolocationPosition,
): Promise<AddressSearchResult[]> {
  const startTime = performance.now();

  const result = await addressSearchStatement.query(
    position.coords.longitude,
    position.coords.latitude,
    `%${searchTerm}%`,
    // searchTerm,
  );

  const results = resultToList<
    object & { score: number; distance_meters: number }
  >(result).map((o) => {
    return {
      address: AddressSchema.parse(o),
      score: o.score,
      distanceMeters: o.distance_meters,
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
