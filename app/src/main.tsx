import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import { resultToList } from "./lib/duckdb/resultToList.ts";
import { getPosition } from "./lib/getPosition.ts";
import { positionToGeoJsonPoint } from "./lib/positionToGeoJsonPoint.ts";
import { DuckDbManager } from "./lib/duckdb/DuckDbManager.ts";
import { AddressSchema } from "./models/Address.ts";
import { app } from "./types/app";
import AddressSearchResult = app.AddressSearchResult;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export const duckdb = await DuckDbManager.build({
  setup: async (connection, db) => {
    await db.registerFileURL(
      "addresses.parquet",
      "/addresses.parquet",
      DuckDBDataProtocol.HTTP,
      false,
    );

    console.log("Load extensions...");
    await connection.query(`
      INSTALL fts; LOAD fts;
      INSTALL spatial; LOAD spatial;
    `);

    console.log("Import addresses...");
    await connection.query(
      `CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";`,
    );

    console.log("Create search index...");
    await connection.query(
      `PRAGMA create_fts_index("addresses", "id", "addressFull");`,
    );
  },
});

const addressSearchStatement = await duckdb.connection.prepare(
  `
    WITH user_location AS (SELECT ST_GeomFromGeoJson(?) ::POINT_2D AS loc),
         extracted_numbers AS (SELECT unnest(regexp_extract_all(?, '\\d+')) AS num),
         extracted_words AS (SELECT word
                             FROM (SELECT unnest(
                                            filter(
                                              string_split(regexp_replace(?, '\\d+', '', 'g'), ' '),
                                              x -> x != ''
                                            )
                                          ) AS word)),
         ranked_results AS (SELECT addresses.*,
                                   ST_Distance_Sphere(ST_GeomFromGeoJson(location)::POINT_2D, ul.loc) AS distance_meters,
                                   -- Distance score (inverse distance, normalized)
                                   -- Closer addresses get higher scores
                                   CASE
                                     WHEN ul.loc IS NOT NULL THEN
                                       CASE
                                         WHEN 50 > distance_meters THEN 1000
                                         WHEN 200 > distance_meters THEN 500
                                         ELSE 0
                                         END
                                     ELSE 0
                                     END                                                              AS distance_score,
                                   -- Number matches
                                   CASE
                                     WHEN addresses.addressNumber IN (SELECT en.num FROM extracted_numbers AS en)
                                       THEN 100
                                     ELSE 0
                                     END                                                              AS address_number_score,
                                   CASE
                                     WHEN addresses.zipcode IN (SELECT en.num FROM extracted_numbers AS en)
                                       THEN 50
                                     ELSE 0
                                     END                                                              AS zip_score,
                                   -- Word matches
                                   CASE
                                     WHEN EXISTS (SELECT 1
                                                  FROM extracted_words AS ew
                                                  WHERE lower(addresses.city) LIKE '%' || lower(ew.word) || '%')
                                       THEN 30
                                     ELSE 0
                                     END                                                              AS city_score,
                                   CASE
                                     WHEN EXISTS (SELECT 1
                                                  FROM extracted_words AS ew
                                                  WHERE lower(addresses.addressFull) LIKE '%' || lower(ew.word) || '%')
                                       THEN 20
                                     ELSE 0
                                     END                                                              AS address_full_score
                            FROM addresses,
                                 user_location AS ul)
    SELECT rr.id,
           rr.addressFull,
           rr.city,
           rr.zipcode,
           rr.distance_meters,
           address_number_score,
           zip_score,
           city_score,
           address_full_score,
           distance_score,
           address_number_score + zip_score + city_score + address_full_score +
           distance_score AS score
    FROM ranked_results AS rr,
         user_location AS ul
    WHERE address_number_score + zip_score + city_score + address_full_score > 0
    ORDER BY score DESC LIMIT 10;
  `,
);

async function addressSearch(term: string): Promise<AddressSearchResult[]> {
  addressSearchStatement.query(
    position != null ? JSON.stringify(positionToGeoJsonPoint(position)) : null,
    term,
    term,
  );
}

console.log("Get current position...");
const position = await getPosition();

{
  console.log("Search query...");
  const searchTerm = "632 aspen bailey";
  const result = await addressSearchStatement.query(
    position != null ? JSON.stringify(positionToGeoJsonPoint(position)) : null,
    searchTerm,
    searchTerm,
  );
  const data = resultToList(result).map((o) => AddressSchema.parse(o));
  console.log(data);
}
