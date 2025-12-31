import type { UseDuckDbQueryFunction } from "../UseDuckDbQueryFunction.ts";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { DuckDbQuery } from "../DuckDbQuery.ts";

export const closestOutageQueryFunction: UseDuckDbQueryFunction<
  number,
  { addressId: number }
> = async (connection: AsyncDuckDBConnection) => {
  const sql = `
      SELECT a.id,
             min(ST_Distance_Spheroid(
               a.location::POINT_2D,
               ST_EndPoint(ST_ShortestLine(a.location::POINT_2D, ST_LineString2DFromWKB(o.linestring))))
             ) as distance
      FROM outages o,
           addresses a
      WHERE a.id IN (?)
      GROUP BY a.id
      ORDER BY distance ASC
    `;
  const statement = await connection.prepare(sql);
  return new DuckDbQuery({
    statement,
    sql,
    paramOrder: ["addressId"] as const,
    transformItem: (o) => {
      return o.distance as number;
    },
  });
};
