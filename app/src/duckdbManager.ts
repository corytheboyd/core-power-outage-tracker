import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import { DuckDbManager } from "./duckdb/DuckDbManager.ts";

export const duckdbManager = await DuckDbManager.build({
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
  },
});
