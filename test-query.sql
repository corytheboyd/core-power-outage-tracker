INSTALL spatial; LOAD spatial;

CREATE TABLE addresses AS SELECT * FROM 'data/addresses.parquet';
CREATE TABLE outages AS SELECT * FROM 'data/outages.parquet';

-- Show outage summary
SELECT 
  id,
  county,
  customers_affected,
  outage_cause,
  latitude,
  longitude
FROM outages 
ORDER BY customers_affected DESC
LIMIT 10;

-- Find addresses within 0.01 degrees (~0.7 miles) of any outage
SELECT 
  a.street,
  a.city,
  a.zip,
  o.county,
  o.customers_affected,
  o.outage_cause,
  ST_Distance(a.location, o.location) * 69 as distance_miles
FROM addresses a
JOIN outages o ON ST_DWithin(a.location, o.location, 0.01)
ORDER BY o.customers_affected DESC, distance_miles ASC
LIMIT 20;

-- Count how many addresses are near each major outage (>50 customers)
SELECT 
  o.id,
  o.county,
  o.customers_affected,
  o.outage_cause,
  COUNT(a.id) as addresses_within_half_mile
FROM outages o
LEFT JOIN addresses a ON ST_DWithin(a.location, o.location, 0.01)
WHERE o.customers_affected > 50
GROUP BY o.id, o.county, o.customers_affected, o.outage_cause
ORDER BY o.customers_affected DESC;
