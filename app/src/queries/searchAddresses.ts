// const addressSearchStatement = await duckdb.connection.prepare(
//   `
//     WITH user_location AS (SELECT ST_GeomFromGeoJson(?) ::POINT_2D AS loc),
//          extracted_numbers AS (SELECT unnest(regexp_extract_all(?, '\\d+')) AS num),
//          extracted_words AS (SELECT word
//                              FROM (SELECT unnest(
//                                             filter(
//                                               string_split(regexp_replace(?, '\\d+', '', 'g'), ' '),
//                                               x -> x != ''
//                                             )
//                                           ) AS word)),
//          ranked_results AS (SELECT addresses.*,
//                                    ST_Distance_Sphere(ST_GeomFromGeoJson(location)::POINT_2D, ul.loc) AS distance_meters,
//                                    -- Distance score (inverse distance, normalized)
//                                    -- Closer addresses get higher scores
//                                    CASE
//                                      WHEN ul.loc IS NOT NULL THEN
//                                        CASE
//                                          WHEN 50 > distance_meters THEN 1000
//                                          WHEN 200 > distance_meters THEN 500
//                                          ELSE 0
//                                          END
//                                      ELSE 0
//                                      END                                                              AS distance_score,
//                                    -- Number matches
//                                    CASE
//                                      WHEN addresses.addressNumber IN (SELECT en.num FROM extracted_numbers AS en)
//                                        THEN 100
//                                      ELSE 0
//                                      END                                                              AS address_number_score,
//                                    CASE
//                                      WHEN addresses.zipcode IN (SELECT en.num FROM extracted_numbers AS en)
//                                        THEN 50
//                                      ELSE 0
//                                      END                                                              AS zip_score,
//                                    -- Word matches
//                                    CASE
//                                      WHEN EXISTS (SELECT 1
//                                                   FROM extracted_words AS ew
//                                                   WHERE lower(addresses.city) LIKE '%' || lower(ew.word) || '%')
//                                        THEN 30
//                                      ELSE 0
//                                      END                                                              AS city_score,
//                                    CASE
//                                      WHEN EXISTS (SELECT 1
//                                                   FROM extracted_words AS ew
//                                                   WHERE lower(addresses.addressFull) LIKE '%' || lower(ew.word) || '%')
//                                        THEN 20
//                                      ELSE 0
//                                      END                                                              AS address_full_score
//                             FROM addresses,
//                                  user_location AS ul)
//     SELECT rr.id,
//            rr.addressFull,
//            rr.city,
//            rr.zipcode,
//            rr.distance_meters,
//            address_number_score + zip_score + city_score + address_full_score +
//            distance_score AS score
//     FROM ranked_results AS rr,
//          user_location AS ul
//     WHERE address_number_score + zip_score + city_score + address_full_score > 0
//     ORDER BY score DESC LIMIT 10;
//   `,
// );

import { duckdbManager } from "../duckdbManager.ts";
import type { AddressSearchResult } from "../types/app";
import { resultToList } from "../lib/duckdb/resultToList.ts";
import { AddressSchema } from "../models/Address.ts";

const addressSearchStatement = await duckdbManager.connection.prepare(`
  SELECT 
    *,
    ST_Distance_Sphere(ST_Point2D(?, ?), location::POINT_2D) AS distance_meters,
    100 AS score
  FROM addresses
  WHERE 1=1
  AND
    addressFull ILIKE ?
  ORDER BY 
    score DESC,
    distance_meters ASC
  LIMIT 25
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
