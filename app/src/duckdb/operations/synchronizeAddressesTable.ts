import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import type { DuckDbManager } from "../DuckDbManager.ts";

export async function synchronizeAddressesTable(duckdb: DuckDbManager) {
  const { db, connection } = duckdb;

  await db.registerFileURL(
    "addresses.parquet",
    "/addresses.parquet",
    DuckDBDataProtocol.HTTP,
    false,
  );

  await connection.query(`
    CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";
  `);
}
