import { getDuckDbManager } from "../getDuckDbManager.ts";
import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";

export async function synchronizeAddressesTable() {
  const { db, connection } = await getDuckDbManager();

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
