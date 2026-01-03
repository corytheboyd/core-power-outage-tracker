import type { DuckDbManagerSetupFunction } from "./DuckDbManager.ts";

export const setupDuckDb: DuckDbManagerSetupFunction = async (connection) => {
  await connection.query(`
    INSTALL spatial; LOAD spatial;
  `);
};
