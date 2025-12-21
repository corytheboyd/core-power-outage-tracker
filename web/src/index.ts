import * as duckdb from '@duckdb/duckdb-wasm';
// @ts-ignore
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
// @ts-ignore
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import duckdb_worker_mvp from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js';
import duckdb_worker_eh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js';

async function initDuckDB() {
    const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
            mainModule: duckdb_wasm,
            mainWorker: duckdb_worker_mvp,
        },
        eh: {
            mainModule: duckdb_wasm_eh,
            mainWorker: duckdb_worker_eh,
        },
    };
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    const conn = await db.connect();

    await db.registerFileURL('addresses.parquet', '/addresses.parquet', duckdb.DuckDBDataProtocol.HTTP, true)
    await db.registerFileURL('outages.parquet', '/outages.parquet', duckdb.DuckDBDataProtocol.HTTP, true)

    const addressesResult = await conn.query(`
    SELECT id, street, city, zip
    FROM 'addresses.parquet' 
    WHERE street ILIKE '%632 aspen ln%'
    `);
    console.log('Addresses:', addressesResult.toArray());

    await conn.close();
}

// Initialize DuckDB when the page loads
initDuckDB().catch(console.error);
