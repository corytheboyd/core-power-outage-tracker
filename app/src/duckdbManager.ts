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

    await db.registerFileURL(
      "outages.parquet",
      "/outages.parquet",
      DuckDBDataProtocol.HTTP,
      false,
    );

    console.log("Load extensions...");
    await connection.query(`
      INSTALL fts; LOAD fts;
      INSTALL spatial; LOAD spatial;
    `);

    console.log("Import tables...");
    await connection.query(
      `
      CREATE OR REPLACE TABLE addresses AS FROM "addresses.parquet";
      CREATE OR REPLACE TABLE outages AS FROM "outages.parquet";
      `,
    );
  },
});
