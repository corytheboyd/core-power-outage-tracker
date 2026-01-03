import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import {
  AsyncDuckDB,
  AsyncDuckDBConnection,
  ConsoleLogger,
  LogLevel,
  selectBundle,
} from "@duckdb/duckdb-wasm";

export interface DuckDbManagerSetupFunction {
  (connection: AsyncDuckDBConnection, db: AsyncDuckDB): Promise<void>;
}

export class DuckDbManager {
  public readonly db: AsyncDuckDB;
  public readonly connection: AsyncDuckDBConnection;

  private constructor(db: AsyncDuckDB, connection: AsyncDuckDBConnection) {
    this.db = db;
    this.connection = connection;
  }

  public static async build(
    options: {
      setup?: DuckDbManagerSetupFunction;
    } = {},
  ): Promise<DuckDbManager> {
    const MANUAL_BUNDLES = {
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
    const bundle = await selectBundle(MANUAL_BUNDLES);

    const worker = new Worker(bundle.mainWorker!);
    const logger = new ConsoleLogger(LogLevel.WARNING);
    const db = new AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    const connection = await db.connect();

    if (options.setup) {
      await options.setup(connection, db);
    }

    return new DuckDbManager(db, connection);
  }
  public async teardown() {
    await this.connection.close();
  }
}
