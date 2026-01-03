import type { DuckDbManagerSetupFunction } from "./DuckDbManager.ts";
import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";

export const setupDuckDb: DuckDbManagerSetupFunction = async (
  connection,
  db,
) => {
  await db.registerFileURL(
    "addresses.parquet",
    "/addresses.parquet",
    DuckDBDataProtocol.HTTP,
    false,
  );

  console.log("Load extensions...");
  await connection.query(`
    INSTALL spatial; LOAD spatial;
  `);

  console.log("Import tables...");
  await connection.query(`
    CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";
  `);

  console.log("Done");
};
