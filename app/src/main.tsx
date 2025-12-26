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
import { Address } from "./lib/models/Address.ts";

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

await conn.query(`
  INSTALL fts; LOAD fts;
  INSTALL spatial; LOAD spatial;

  CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";
  
  -- PRAGMA create_fts_index("addresses", "id");
`);

{
  const result = await conn.query(
    `SELECT address, city, zip FROM addresses
         WHERE 
            address ILIKE '%632 asp%'
         OR
            city ILIKE '%632 asp%'
         OR
            zip ILIKE '%632 asp%'`,
  );
  const data = result.toArray().map((row) => Address.parse(row.toJSON()));
  console.log(data);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
