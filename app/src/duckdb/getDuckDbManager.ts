import { DuckDbManager } from "./DuckDbManager.ts";
import { setupDuckDb } from "./setupDuckDb.ts";

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
    setup: setupDuckDb,
  });

  duckdbManagerInstance = await initializationPromise;
  return duckdbManagerInstance;
}
