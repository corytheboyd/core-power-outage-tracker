import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import * as duckdb from "@duckdb/duckdb-wasm";
import { DuckDBDataProtocol, LogLevel } from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { resultToList } from "./lib/duckdb/resultToList.ts";
import { Address } from "./lib/models/Address.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Request location permission on page load
const position: GeolocationPosition;
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (p) => {
      position = p;
    },
    (error) => {
      console.log("Location permission denied or error:", error.message);
    },
  );
}

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

// Select a bundle based on browser checks
const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
// Instantiate the asynchronous version of DuckDB-wasm
const worker = new Worker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger(LogLevel.WARNING);
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

await db.registerFileURL(
  "addresses.parquet",
  "/addresses.parquet",
  DuckDBDataProtocol.HTTP,
  false,
);

const conn = await db.connect();

console.log("Load extensions...");
await conn.query(`
  INSTALL fts; LOAD fts;
  INSTALL spatial; LOAD spatial;
`);
console.log("Import addresses...");
await conn.query(
  `CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";`,
);
console.log("Create search index...");
await conn.query(`PRAGMA create_fts_index("addresses", "id", "addressFull");`);
console.log("Ready");

{
  console.log("Search query...");
  const searchTerm = "632 aspen bailey";
  const positionGeoJson = JSON.stringify({
    type: "Point",
    coordinates: [position.coords.longitude, position.coords.latitude],
  });
  const result = await conn.query(
    `
      WITH
        user_location AS (
          -- TODO or null
          SELECT
            ST_GeomFromGeoJson('{"type":"Point","coordinates":[-105.46225436568372,39.41943985083996]}')::POINT_2D AS loc
        ),
        extracted_numbers AS (
          SELECT unnest(regexp_extract_all('4053 Access Rd Evergreen', '\\d+')) AS num
        ),
        extracted_words AS (
          SELECT word
          FROM (
                 SELECT unnest(
                          filter(
                            string_split(regexp_replace('4053 Access Rd Evergreen', '\\d+', '', 'g'), ' '),
                            x -> x != ''
                          )
                        ) AS word
               )
        ),
        ranked_results AS (
          SELECT
            addresses.*,
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
              END AS distance_score,
            -- Number matches
            CASE
              WHEN addresses.addressNumber IN (SELECT en.num FROM extracted_numbers AS en) THEN 100
              ELSE 0
              END AS address_number_score,
            CASE
              WHEN addresses.zipcode IN (SELECT en.num FROM extracted_numbers AS en) THEN 50
              ELSE 0
              END AS zip_score,
            -- Word matches
            CASE
              WHEN EXISTS (
                SELECT 1 FROM extracted_words AS ew
                WHERE lower(addresses.city) LIKE '%' || lower(ew.word) || '%'
              ) THEN 30
              ELSE 0
              END AS city_score,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM extracted_words AS ew
                WHERE lower(addresses.addressFull) LIKE '%' || lower(ew.word) || '%'
              ) THEN 20
              ELSE 0
              END AS address_full_score
          FROM addresses, user_location AS ul
        )
      SELECT
        rr.id, rr.addressFull, rr.city, rr.zipcode, rr.distance_meters,
        address_number_score, zip_score, city_score, address_full_score, distance_score,
        address_number_score + zip_score + city_score + address_full_score + distance_score AS score
      FROM ranked_results AS rr,
           user_location AS ul
      WHERE
        address_number_score + zip_score + city_score + address_full_score > 0
      ORDER BY score DESC
        LIMIT 10
      ;
    `,
  );
  const data = resultToList(result).map((o) => Address.parse(o));
  console.log(data);
}
