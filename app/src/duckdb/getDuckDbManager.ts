import { DuckDbManager } from "./DuckDbManager.ts";
import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";

let duckdbManagerInstance: DuckDbManager | null = null;
let initializationPromise: Promise<DuckDbManager> | null = null;

export async function getDuckDbManager(): Promise<DuckDbManager> {
  if (duckdbManagerInstance) {
    return duckdbManagerInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = DuckDbManager.build({
    setup: async (connection, db) => {
      await db.registerFileURL(
        "addresses.parquet",
        "/addresses.parquet",
        DuckDBDataProtocol.HTTP,
        false,
      );

      await db.registerFileURL(
        "addresses_80421.parquet",
        "/addresses_80421.parquet",
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
          CREATE OR REPLACE TABLE addresses_80421 AS FROM "addresses_80421.parquet";
          CREATE OR REPLACE TABLE outages AS FROM "outages.parquet";
          `,
      );
    },
  });

  duckdbManagerInstance = await initializationPromise;
  return duckdbManagerInstance;
}
