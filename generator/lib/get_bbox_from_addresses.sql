INSTALL spatial; LOAD spatial;
SELECT
    MIN(ST_X(location)) - (0.0725 * 3) || ',' ||
    MIN(ST_Y(location)) - (0.0725 * 3) || ',' ||
    MAX(ST_X(location)) + (0.0725 * 3) || ',' ||
    MAX(ST_Y(location)) + (0.0725 * 3) AS value
FROM './data/addresses.parquet'
