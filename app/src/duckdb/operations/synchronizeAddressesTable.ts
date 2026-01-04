import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import type { DuckDbManager } from "../DuckDbManager.ts";

export async function synchronizeAddressesTable(duckdb: DuckDbManager) {
  await duckdb.db.registerFileURL(
    "addresses.parquet",
    "/addresses.parquet",
    DuckDBDataProtocol.HTTP,
    false,
  );

  await duckdb.withConnection(async (c) => {
    await c.query(`
      CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";
    `);
  });
}
