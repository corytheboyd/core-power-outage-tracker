import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

export async function initDuckDB(): Promise<void> {
  if (db) return;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  URL.revokeObjectURL(worker_url);

  conn = await db.connect();
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!conn) {
    await initDuckDB();
  }
  return conn!;
}

export async function createTableFromFeatures(
  features: GeoJSON.Feature[]
): Promise<void> {
  const connection = await getConnection();

  // Drop table if exists
  await connection.query("DROP TABLE IF EXISTS addresses");

  // Create table
  await connection.query(`
    CREATE TABLE addresses (
      id INTEGER,
      properties JSON,
      longitude DOUBLE,
      latitude DOUBLE
    )
  `);

  // Insert features in batches
  const batchSize = 1000;
  for (let i = 0; i < features.length; i += batchSize) {
    const batch = features.slice(i, i + batchSize);
    const values = batch
      .map((feature, idx) => {
        const props = JSON.stringify(feature.properties || {});
        const coords = feature.geometry?.coordinates || [0, 0];
        const [lon, lat] = coords as [number, number];
        return `(${i + idx}, '${props.replace(/'/g, "''")}', ${lon}, ${lat})`;
      })
      .join(",");

    await connection.query(`
      INSERT INTO addresses VALUES ${values}
    `);
  }
}

export async function searchAddresses(
  query: string,
  limit: number = 100
): Promise<any[]> {
  const connection = await getConnection();

  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  // Search across all JSON properties
  const result = await connection.query(`
    SELECT * FROM addresses
    WHERE LOWER(CAST(properties AS VARCHAR)) LIKE '%${lowerQuery}%'
    LIMIT ${limit}
  `);

  return result.toArray().map((row: any) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [row.longitude, row.latitude],
    },
    properties: JSON.parse(row.properties),
  }));
}

export async function getTableCount(): Promise<number> {
  const connection = await getConnection();
  const result = await connection.query("SELECT COUNT(*) as count FROM addresses");
  const rows = result.toArray();
  return rows[0]?.count || 0;
}

export async function exportDatabase(): Promise<Uint8Array> {
  if (!db || !conn) throw new Error("Database not initialized");

  // Force a checkpoint to ensure all data is written
  await conn.query("CHECKPOINT");

  // Export the entire database file
  const buffer = await db.exportFileBuffer("main.db");
  return buffer;
}

export async function importDatabase(buffer: Uint8Array): Promise<void> {
  const connection = await getConnection();

  // Register the database file
  await db!.registerFileBuffer("imported.db", buffer);

  // Attach the imported database
  await connection.query(`ATTACH 'imported.db' AS imported_db`);

  // Copy the table to our main database
  await connection.query(`
    CREATE TABLE addresses AS
    SELECT * FROM imported_db.addresses
  `);

  // Detach
  await connection.query(`DETACH imported_db`);
}