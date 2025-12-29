import { duckdbManager } from "../duckdbManager.ts";
import type { AddressSearchResult } from "../types/app";
import { resultToList } from "../lib/duckdb/resultToList.ts";
import { AddressSchema } from "../models/Address.ts";

const topClosestAddressesStatement = await duckdbManager.connection.prepare(`
  SELECT 
    id, addressFull, city, zipcode,
    ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance_meters
  FROM addresses
  ORDER BY
    distance_meters ASC
  LIMIT 25
`);

export async function topClosestAddresses(
  position: GeolocationPosition,
): Promise<AddressSearchResult[]> {
  const startTime = performance.now();

  const result = await topClosestAddressesStatement.query(
    position.coords.longitude,
    position.coords.latitude,
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
    "Top closest addresses query completed",
    performance.now() - startTime,
    results,
  );

  return results;
}
