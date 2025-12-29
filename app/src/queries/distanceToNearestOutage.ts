import { duckdbManager } from "../duckdbManager.ts";
import { resultToList } from "../duckdb/resultToList.ts";

const statement = await duckdbManager.connection.prepare(`
  SELECT
    a.id,
    min(ST_Distance_Spheroid(
      a.location::POINT_2D,
      ST_EndPoint(ST_ShortestLine(a.location::POINT_2D, ST_LineString2DFromWKB(o.linestring)))
        )) as distance
  FROM
    outages o,
    addresses a
  WHERE
    a.id IN (?)
  GROUP BY
    a.id
  ORDER BY distance ASC
`);

/**
 * meters
 * */
export async function distanceToNearestOutage(
  addressId: number,
): Promise<number> {
  const startTime = performance.now();

  const result = await statement.query(addressId);

  const distance = resultToList<{ distance: number }>(result).map(
    (o) => o.distance,
  )[0];

  console.debug(
    "Top closest addresses query completed",
    performance.now() - startTime,
    distance,
  );

  return distance;
}
