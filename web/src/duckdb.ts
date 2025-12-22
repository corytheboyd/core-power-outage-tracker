import * as duckdb from "@duckdb/duckdb-wasm";
// @ts-expect-error - Vite URL import for WASM file
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
// @ts-expect-error - Vite URL import for WASM file
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
// @ts-expect-error - Vite URL import for worker file
import duckdb_worker_mvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
// @ts-expect-error - Vite URL import for worker file
import duckdb_worker_eh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { fetchOutageLines } from "./polylines";

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB() {
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
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  await db.registerFileURL(
    "addresses.parquet",
    "/addresses.parquet",
    duckdb.DuckDBDataProtocol.HTTP,
    true,
  );
}

async function loadOutageLines(conn: duckdb.AsyncDuckDBConnection) {
  // Create outage_lines table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS outage_lines (
      line_id TEXT PRIMARY KEY,
      geometry LINESTRING NOT NULL
    )
  `);

  // Clear existing data
  await conn.query("DELETE FROM outage_lines");

  // Fetch fresh polyline data
  const lines = await fetchOutageLines();

  console.log(`Loading ${lines.length} outage lines into DuckDB`);

  // Insert each line as LINESTRING
  for (const line of lines) {
    if (line.coordinates.length < 2) {
      console.warn(`Skipping line ${line.lineId}: insufficient coordinates`);
      continue;
    }

    // Build WKT LINESTRING: "LINESTRING(lng1 lat1, lng2 lat2, ...)"
    const coordPairs = line.coordinates
      .map((c) => `${c[0]} ${c[1]}`)
      .join(", ");

    try {
      await conn.query(
        `
        INSERT OR REPLACE INTO outage_lines (line_id, geometry)
        VALUES (?, ST_GeomFromText(?))
      `,
        line.lineId,
        `LINESTRING(${coordPairs})`,
      );
    } catch (err) {
      console.error(`Failed to insert line ${line.lineId}:`, err);
    }
  }

  console.log("Outage lines loaded successfully");
}

export async function checkOutage(addressQuery: string) {
  if (!db) {
    throw new Error("Database not initialized");
  }

  const conn = await db.connect();

  try {
    // Install spatial extension
    await conn.query("INSTALL spatial; LOAD spatial;");

    // Load fresh outage line data
    await loadOutageLines(conn);

    // Prepare the search pattern
    const searchPattern = `%${addressQuery}%`;

    // Distance threshold: 0.002 degrees ≈ 450 feet / 0.14 miles
    const DISTANCE_THRESHOLD = 0.002;

    // Query: find addresses and their distance to nearest outage line
    const result = await conn.query(
      `
            SELECT 
                a.id as address_id,
                a.street,
                a.city,
                a.zip,
                MIN(ST_Distance(a.location, l.geometry)) * 69 as distance_miles,
                CASE 
                    WHEN MIN(ST_Distance(a.location, l.geometry)) <= ? THEN true 
                    ELSE false 
                END as has_outage
            FROM 'addresses.parquet' a
            LEFT JOIN outage_lines l ON ST_DWithin(a.location, l.geometry, ?)
            WHERE a.street ILIKE ?
            GROUP BY a.id, a.street, a.city, a.zip
            ORDER BY distance_miles ASC NULLS LAST
            LIMIT 10
        `,
      DISTANCE_THRESHOLD,
      DISTANCE_THRESHOLD,
      searchPattern,
    );

    const results = result.toArray();

    if (results.length === 0) {
      return { found: false, addresses: [] };
    }

    return {
      found: true,
      addresses: results.map(
        (row: {
          street: string;
          city: string;
          zip: string;
          has_outage: boolean;
          distance_miles: number | null;
        }) => ({
          street: row.street,
          city: row.city,
          zip: row.zip,
          hasOutage: row.has_outage,
          outageDetails: row.has_outage
            ? {
                distanceMiles: row.distance_miles,
              }
            : null,
        }),
      ),
    };
  } finally {
    await conn.close();
  }
}
