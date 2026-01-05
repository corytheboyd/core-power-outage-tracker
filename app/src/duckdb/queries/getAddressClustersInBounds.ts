import type { Position } from "../../types/app";
import { getDuckDbManager } from "../getDuckDbManager.ts";
import { ResultSet } from "../ResultSet.ts";
import {
  type AddressCluster,
  AddressClusterSchema,
} from "../../models/AddressCluster.ts";

export const getAddressClustersInBounds = async (args: {
  northEastPosition: Position;
  southWestPosition: Position;
}): Promise<AddressCluster[]> => {
  const duckdb = await getDuckDbManager();

  return await duckdb.withConnection(async (c) => {
    const results = await c.query(`
      WITH clusters AS (SELECT FLOOR(ST_X(location) / 0.01) AS cluster_x,
                               FLOOR(ST_Y(location) / 0.01) AS cluster_y,
                               location
                        FROM addresses
                        WHERE location IS NOT NULL
                          AND ST_Within(
                          location,
                          ST_MakeEnvelope(
                            ${args.southWestPosition.longitude},
                            ${args.southWestPosition.latitude},
                            ${args.northEastPosition.longitude},
                            ${args.northEastPosition.latitude}
                          )
                              )),
           cluster_centers AS (SELECT cluster_x,
                                      cluster_y,
                                      ST_Point2D(
                                        AVG(ST_X(location)),
                                        AVG(ST_Y(location))
                                      ) AS center,
                                      COUNT(*) AS count
      FROM clusters
      GROUP BY cluster_x, cluster_y )
      SELECT ST_X(cc.center) AS logitude,
             ST_Y(cc.center) AS latitude,
             cc.count
      FROM cluster_centers cc
             JOIN clusters c ON c.cluster_x = cc.cluster_x AND c.cluster_y = cc.cluster_y
      GROUP BY cc.cluster_x, cc.cluster_y, cc.center, cc.count
      HAVING cc.count > 0
      ORDER BY cc.count DESC;
    `);

    const resultSet = new ResultSet(results, (o) =>
      AddressClusterSchema.parse(o),
    );
    return resultSet.toArray();
  });
};
