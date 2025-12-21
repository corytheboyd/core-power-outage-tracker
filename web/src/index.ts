import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import duckdb_worker_mvp from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js';
import duckdb_worker_eh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js';
import database_url from './database';

async function initDuckDB() {
  console.log('Initializing DuckDB...');
  
  // Create manual bundles configuration for Parcel
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

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  console.log('Selected bundle:', bundle);

  // Instantiate the asynchronous version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  
  console.log('DuckDB initialized successfully!');
  
  // Create a connection
  const conn = await db.connect();
  
  // Load the database file
  console.log('Loading database file from:', database_url);
  const response = await fetch(database_url);
  const dbBuffer = await response.arrayBuffer();
  await db.registerFileBuffer('outages.db', new Uint8Array(dbBuffer));
  
  // Attach the database
  console.log('Attaching database...');
  await conn.query(`ATTACH 'outages.db' AS outages (READ_ONLY)`);
  
  // Query the database to show tables
  console.log('Querying database tables...');
  const tablesResult = await conn.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'outages'
  `);
  console.log('Tables:', tablesResult);
  
  // Example query - adjust based on your actual schema
  console.log('Running example query...');
  const result = await conn.query(`
    SELECT * FROM outages.addresses LIMIT 10
  `);
  
  console.log('Query result:', result);
  
  // Display results in the page
  const resultDiv = document.getElementById('results');
  if (resultDiv) {
    const rows = result.toArray();
    resultDiv.innerHTML = `
      <h2>Database Query Results</h2>
      <p>First 10 addresses from the database:</p>
      <pre>${JSON.stringify(rows, null, 2)}</pre>
    `;
  }
  
  // Close the connection
  await conn.close();
  
  return db;
}

// Initialize DuckDB when the page loads
initDuckDB().catch(console.error);
