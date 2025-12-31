import type { AsyncPreparedStatement } from "@duckdb/duckdb-wasm";
import { ResultSet, type TransformItemFunction } from "./ResultSet.ts";
import type { SqlPrimitive } from "../types/app";

type DuckDbQueryOptions<Args extends Record<string, SqlPrimitive>, Item> = {
  statement: AsyncPreparedStatement;
  sql: string;
  paramOrder?: ReadonlyArray<keyof Args>;
  transformItem: TransformItemFunction<Item>;
};

export class DuckDbQuery<
  Args extends Record<string, SqlPrimitive>,
  Item = void,
> {
  private readonly statement: AsyncPreparedStatement;
  private readonly paramOrder: ReadonlyArray<keyof Args>;
  private readonly sql: string;
  private readonly transformItem: TransformItemFunction<Item>;

  constructor(options: DuckDbQueryOptions<Args, Item>) {
    this.statement = options.statement;
    this.paramOrder = options.paramOrder || [];
    this.sql = options.sql;
    this.transformItem = options.transformItem;
  }

  public async query(args: Args): Promise<ResultSet<Item>> {
    const startTime = performance.now();

    if (this.paramOrder.length === 0) {
      const result = await this.statement.query();
      return new ResultSet<Item>(result, this.transformItem);
    }
    const orderedValues = this.paramOrder.map((key) => args[key]);
    const result = await this.statement.query(...orderedValues);
    const rs = new ResultSet<Item>(result, this.transformItem);

    const elapsedTime = performance.now() - startTime;
    console.debug(
      `Query executed in ${elapsedTime} ms`,
      this.sql,
      args,
      rs.toArray(),
    );

    return rs;
  }

  public async teardown() {
    await this.statement.close();
  }
}
