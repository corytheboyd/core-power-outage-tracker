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
await conn.query(
  `PRAGMA create_fts_index("addresses", "id", "address", "city", "zipcode");`,
);
console.log("Ready");

{
  console.log("Search query...");
  const result = await conn.query(
    `
      SELECT *
      FROM (
        SELECT 
          id, address, city, zipcode,
          fts_main_addresses.match_bm25(
            id, '632 aspen bailey'
          ) AS score
        FROM addresses
      )
      WHERE score IS NOT NULL
      ORDER BY score DESC
    `,
  );
  const data = resultToList(result).map((o) => Address.parse(o));
  console.log(data);
}
