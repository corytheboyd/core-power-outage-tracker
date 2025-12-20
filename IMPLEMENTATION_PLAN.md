# Core Power Outage Map - Implementation Plan

## Project Overview

A Progressive Web App (PWA) that allows users to check power outage status for their address in the CORE Electric Cooperative service area. Uses a client-side DuckDB database with geospatial queries for offline-capable, serverless operation.

## Architecture

### Data Flow
1. **Build Time**: Download OSM addresses → Populate DuckDB
2. **Update Time**: Fetch CORE API → Update outages in DuckDB
3. **Runtime**: Browser loads DuckDB WASM → Query locally

### Key Decisions
- **Storage**: Single `.duckdb` file (~5-8MB, ~3-5MB compressed)
- **Address Source**: OpenStreetMap via Geofabrik Colorado extract
- **Update Strategy**: Current outages only (no history)
- **Outage Matching**: Hybrid approach (zip code + 1km radius)
- **Search**: Full-text search (FTS) + geolocation
- **Deployment**: Static file hosting (GitHub Pages, Cloudflare, etc.)

## Database Schema

```sql
-- Addresses table
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY,
  street VARCHAR NOT NULL,      -- "632 Aspen Ln"
  city VARCHAR NOT NULL,         -- "Bailey"
  zip VARCHAR(5) NOT NULL,       -- "80421"
  lat DOUBLE NOT NULL,
  lon DOUBLE NOT NULL
);

-- Active outages (current snapshot only)
CREATE TABLE outages (
  id BIGINT PRIMARY KEY,         -- CORE API outage ID
  zip VARCHAR(5) NOT NULL,       -- Affected zip code
  lat DOUBLE NOT NULL,           -- Outage point location
  lon DOUBLE NOT NULL,
  radius_meters INTEGER DEFAULT 1000  -- Fixed 1km search radius
);

-- Full-text search index for address search
CREATE INDEX idx_fts_address ON addresses USING FTS;

-- Spatial indices for geolocation search  
CREATE INDEX idx_addresses_location ON addresses(lat, lon);
CREATE INDEX idx_outages_location ON outages(lat, lon);

-- Regular indices for zip lookups
CREATE INDEX idx_addresses_zip ON addresses(zip);
CREATE INDEX idx_outages_zip ON outages(zip);
```

## Query Patterns

### 1. Text Search
User types: "632 aspen bailey"

```sql
SELECT id, street, city, zip, lat, lon
FROM addresses
WHERE street LIKE '%632%aspen%'
   OR city LIKE '%bailey%'
   OR zip LIKE '%80421%'
ORDER BY 
  CASE 
    WHEN street LIKE '632%' THEN 1
    ELSE 2 
  END
LIMIT 10;
```

### 2. Geolocation Search
User allows browser location (lat=39.4, lon=-105.5)

```sql
SELECT id, street, city, zip, lat, lon,
  SQRT(POW(69.0 * (lat - 39.4), 2) + POW(69.0 * COS(39.4 / 57.3) * (lon + 105.5), 2)) * 1609.34 as distance_meters
FROM addresses
ORDER BY distance_meters
LIMIT 10;
```

### 3. Check Outage Status
For address at (lat, lon) in zip

```sql
-- Method 1: Zip-based (fast, coarse)
SELECT EXISTS(
  SELECT 1 FROM outages 
  WHERE zip = '80421'
) as has_outage;

-- Method 2: Radius-based (precise)
SELECT EXISTS(
  SELECT 1 FROM outages o
  WHERE o.zip = '80421'
    AND SQRT(POW(69.0 * (o.lat - ?), 2) + POW(69.0 * COS(? / 57.3) * (o.lon - ?), 2)) * 1609.34 < o.radius_meters
) as has_outage;
```

## Implementation Phases

### Phase 1: Address Database Builder

**File**: `build-addresses.js`

**Purpose**: One-time (or manual) build of address database from OpenStreetMap

**Steps**:

1. **Download Colorado OSM Data**
   - Source: https://download.geofabrik.de/north-america/us/colorado-latest.osm.pbf
   - Size: ~200MB compressed
   - Extract address nodes

2. **Determine CORE Service Area**
   - Parse CORE API to get list of served zip codes
   - Filter OSM addresses to only these zips
   - Counties: Jefferson, Douglas, Park, Clear Creek, Teller, El Paso, Elbert, Arapahoe, Adams, Chaffee, Fremont

3. **Parse OSM Address Nodes**
   - Look for nodes with tags:
     - `addr:housenumber`
     - `addr:street`
     - `addr:city`
     - `addr:postcode`
   - Extract lat/lon from node coordinates

4. **Normalize & Deduplicate**
   - Standardize address formats
   - Remove duplicates
   - Validate coordinates are within Colorado

5. **Load into DuckDB**
   ```javascript
   const db = new duckdb.Database('dist/core-outages.duckdb');
   
   db.run(`
     CREATE TABLE addresses (
       id INTEGER PRIMARY KEY,
       street VARCHAR NOT NULL,
       city VARCHAR NOT NULL,
       zip VARCHAR(5) NOT NULL,
       lat DOUBLE NOT NULL,
       lon DOUBLE NOT NULL
     )
   `);
   
   // Bulk insert addresses
   const stmt = db.prepare('INSERT INTO addresses VALUES (?, ?, ?, ?, ?, ?)');
   addresses.forEach((addr, idx) => {
     stmt.run(idx, addr.street, addr.city, addr.zip, addr.lat, addr.lon);
   });
   
   // Create indices
   db.run('CREATE INDEX idx_fts_address ON addresses USING FTS');
   db.run('CREATE INDEX idx_addresses_location ON addresses(lat, lon)');
   db.run('CREATE INDEX idx_addresses_zip ON addresses(zip)');
   ```

6. **Validation**
   - Test with known address: "632 Aspen Ln, Bailey, CO 80421"
   - Verify count matches expected (target: ~100K addresses)
   - Check data quality (no nulls, valid coordinates)

**Dependencies**:
- `duckdb` - DuckDB Node.js driver
- `osm-pbf-parser` or `osmium-tool` - Parse OSM PBF files
- `axios` - Fetch CORE API

**Output**: `dist/core-outages.duckdb` with populated addresses table

**Estimated Time**: 4-8 hours

---

### Phase 2: Outage Updater

**File**: `update-outages.js`

**Purpose**: Fetch current outages from CORE API and update database

**Steps**:

1. **Fetch CORE API Data**
   ```javascript
   const response = await axios.get(
     'https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER'
   );
   const data = response.data;
   ```

2. **Parse Outage Data**
   - Source: `data.outageData.outages` array
   - Extract for each outage:
     - `id`: outage.id
     - `zip`: outage.zip
     - `lat`: outage.latitude
     - `lon`: outage.longitude

3. **Update Database**
   ```javascript
   const db = new duckdb.Database('dist/core-outages.duckdb');
   
   // Clear existing outages (current-only strategy)
   db.run('DELETE FROM outages');
   
   // Insert current outages
   const stmt = db.prepare('INSERT INTO outages VALUES (?, ?, ?, ?, ?)');
   outages.forEach(o => {
     stmt.run(o.id, o.zip, o.lat, o.lon, 1000); // 1km radius
   });
   
   db.close();
   ```

4. **Create Indices** (if not exists)
   ```javascript
   db.run('CREATE INDEX IF NOT EXISTS idx_outages_location ON outages(lat, lon)');
   db.run('CREATE INDEX IF NOT EXISTS idx_outages_zip ON outages(zip)');
   ```

5. **Logging**
   - Log timestamp of update
   - Log count of active outages
   - Log affected zip codes

**Configuration**: `config.json`
```json
{
  "coreApiUrl": "https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER",
  "outageRadiusMeters": 1000,
  "databasePath": "dist/core-outages.duckdb"
}
```

**Dependencies**:
- `duckdb` - DuckDB Node.js driver
- `axios` - HTTP client

**Usage**:
```bash
node update-outages.js
# Output: Updated 75 outages across 15 zip codes at 2025-12-20T19:30:00Z
```

**Frequency**: Run manually or via cron (every 5 minutes recommended)

**Output**: Updated `dist/core-outages.duckdb`

**Estimated Time**: 2-3 hours

---

### Phase 3: Client-Side Web Application

**Files**: `dist/index.html`, `dist/app.js`, `dist/styles.css`

**Purpose**: Browser-based UI for searching addresses and checking outage status

#### 3.1 HTML Structure

**`dist/index.html`** - See implementation plan for full code

#### 3.2 Client Application Logic

**`dist/app.js`** - Key components:

1. DuckDB WASM initialization
2. Text search functionality
3. Geolocation search
4. Outage status checking
5. Map display with Leaflet
6. Event handlers

#### 3.3 Styling

**`dist/styles.css`** - Responsive design with power status indicators

#### 3.4 PWA Configuration

- `manifest.json` - App metadata
- `service-worker.js` - Offline caching
- Icon assets

**Estimated Time**: 6-10 hours

---

### Phase 4: Build & Deployment Pipeline

**Purpose**: Automate build and deployment process

**Package Configuration**: `package.json`

**Scripts**:
- `build:addresses` - Build address database (one-time)
- `update:outages` - Update outage data
- `build` - Run full build
- `serve` - Local development server
- `deploy` - Deploy to static hosting

**Deployment Instructions**:
- Manual: Copy `dist/` folder to hosting provider
- Automated: GitHub Actions (optional)

**Estimated Time**: 2-3 hours

---

## Testing & Validation

### Test Address
**632 Aspen Ln, Bailey, CO 80421**

1. Address lookup queries
2. Geolocation search validation
3. Outage status checking
4. Client load testing
5. Performance benchmarks

### Performance Targets
- Database file: <10MB uncompressed, <5MB compressed
- Initial load: <5 seconds on 3G
- Search response: <200ms
- Map render: <1 second

---

## File Structure

```
core-power-outage-map/
├── build-addresses.js
├── update-outages.js
├── config.json
├── package.json
├── IMPLEMENTATION_PLAN.md
├── README.md
├── .gitignore
├── data/
│   └── colorado-latest.osm.pbf
├── dist/
│   ├── core-outages.duckdb
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
└── .github/
    └── workflows/
        └── update-outages.yml
```

---

## Dependencies

### Build Scripts
- `duckdb`: ^0.10.0
- `axios`: ^1.6.0
- `osm-read`: ^0.6.0

### Client (CDN)
- `@duckdb/duckdb-wasm`
- `leaflet`

---

## Configuration Parameters

### Tuneable Settings
- `outageRadiusMeters`: 1000 (default)
- `maxSearchResults`: 10
- `mapDefaultZoom`: 10
- `mapCenterLat`: 39.4
- `mapCenterLon`: -105.3

---

## Timeline Estimate

| Phase | Time |
|-------|------|
| Address Database Builder | 4-8 hours |
| Outage Updater | 2-3 hours |
| Client Web App | 6-10 hours |
| Build & Deployment | 2-3 hours |
| **Total** | **14-24 hours** |

---

## Success Criteria

- ✅ Database file <10MB uncompressed
- ✅ Test address searchable
- ✅ Search response <200ms
- ✅ Accurate outage status
- ✅ Map displays correctly
- ✅ Offline PWA functionality
- ✅ Mobile-responsive
- ✅ 100% static files (no server)

---

## Future Enhancements

- Historical outage tracking
- Push notifications
- Weather-based predictions
- Multi-language support
- Dark mode
- Data export features

---

## Known Limitations

1. OSM may have incomplete rural coverage
2. 1km outage radius is approximate
3. Update latency depends on script frequency
4. Requires modern browser with WASM
5. Initial 5MB download on slow connections

---

## Maintenance

### Regular Tasks
- Weekly: Verify outage updater
- Monthly: Rebuild addresses if needed
- Quarterly: Optimize file size
- As needed: Security updates

---

## References

- CORE Electric API: https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER
- DuckDB: https://duckdb.org/
- DuckDB WASM: https://github.com/duckdb/duckdb-wasm
- Geofabrik: https://download.geofabrik.de/
- Leaflet: https://leafletjs.com/
